import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import TeacherSidebar from '../components/TeacherSidebar';
import ProfileDropdown from '../components/ProfileDropdown';
import NotificationDropdown from '../components/NotificationDropdown';
import Icon from '../components/Icon';
import {
  FogIcon,
  PlayIcon,
  PauseIcon,
  UserIcon
} from '../components/Icons';
import { supabase } from '../lib/supabaseClient';
import { useUserProfile } from '../context/UserProfileContext';

// Dynamic data will be fetched from Supabase

const Community = () => {
  const { profile, recalculateUnread } = useUserProfile();
  const [servers, setServers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);
  const [dms, setDms] = useState([]);
  const [activeServer, setActiveServer] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [activeDM, setActiveDM] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [view, setView] = useState('server'); // 'server' or 'dm'
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState('voice'); // 'voice' or 'video'
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState({}); // { userId: status }
  const [userRole, setUserRole] = useState('member'); // 'owner', 'admin', 'member'
  const [unreadCounts, setUnreadCounts] = useState({});
  const [serverUnreadCounts, setServerUnreadCounts] = useState({});
  const [adminChannels, setAdminChannels] = useState([]); // List of channel IDs user admins
  const [selectedMember, setSelectedMember] = useState(null); // Member being managed
  const [showManageMemberModal, setShowManageMemberModal] = useState(false);
  const [showEditChannelModal, setShowEditChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [showEditCommunityModal, setShowEditCommunityModal] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [editColorInput, setEditColorInput] = useState('');
  const [editIconInput, setEditIconInput] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddServerModal, setShowAddServerModal] = useState(false);
  const [addServerTab, setAddServerTab] = useState('join'); // 'join' or 'create'
  const [createType, setCreateType] = useState('community'); // 'community' or 'channel'
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [newServerName, setNewServerName] = useState('');
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('text');
  const [joinStatus, setJoinStatus] = useState(''); // '', 'loading', 'success', 'error'
  const [copiedInviteCode, setCopiedInviteCode] = useState(false);
  const [copiedFriendCode, setCopiedFriendCode] = useState(false);

  const scrollRef = useRef(null);

  // Voice Call & WebRTC states
  const [voiceUsers, setVoiceUsers] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [mutedUsers, setMutedUsers] = useState({}); // { [userId]: boolean }
  const [localStream, setLocalStream] = useState(null);
  const [speakingUsers, setSpeakingUsers] = useState({}); // { [userId]: boolean }

  const localStreamRef = useRef(null);
  const isMutedRef = useRef(false);
  const peerConnectionsRef = useRef({}); // { [peerId]: RTCPeerConnection }
  const voiceChannelRef = useRef(null);
  const analysersRef = useRef({}); // { [userId]: AnalyserNode }
  const audioCtxRef = useRef(null);

  // 1. Fetch Communities (Servers) that user has JOINED
  useEffect(() => {
    if (profile?.id) fetchServers();
  }, [profile?.id]);

  const fetchServers = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('community_members')
      .select('community_id, communities(*)')
      .eq('user_id', profile.id);
    
    if (error) {
      console.error('Error fetching joined communities:', error);
      return;
    }

    if (data) {
      // Filter servers based on user membership
      const joinedServers = data.map(m => ({ ...m.communities }));
      setServers(joinedServers);
      if (joinedServers.length > 0 && !activeServer) {
        setActiveServer(joinedServers[0]);
      }
    }
    setIsLoading(false);
  };

  const fetchChannels = async () => {
    if (!activeServer) return;
    const { data } = await supabase
      .from('channels')
      .select('*')
      .eq('community_id', activeServer.id)
      .order('created_at', { ascending: true });
    
    if (data) {
      setChannels(data);
    }
  };

  const fetchServerUnreadCounts = useCallback(async () => {
    if (!servers.length || !profile?.id) return;
    
    try {
      const serverIds = servers.map(s => s.id);
      
      const { data: allChannels } = await supabase
        .from('channels')
        .select('id, community_id')
        .in('community_id', serverIds)
        .neq('type', 'voice');
        
      if (!allChannels || allChannels.length === 0) return;
      
      const counts = {};
      serverIds.forEach(id => { counts[id] = 0; });
      
      for (const ch of allChannels) {
        const lastRead = localStorage.getItem(`last_read_channel:${ch.id}`) || '1970-01-01T00:00:00.000Z';
        
        if (activeChannel?.id === ch.id && view === 'server') {
          continue;
        }
        
        const { count, error } = await supabase
          .from('community_messages')
          .select('*', { count: 'exact', head: true })
          .eq('channel_id', ch.id)
          .gt('created_at', lastRead)
          .neq('user_id', profile.id);
          
        if (!error && count > 0) {
          counts[ch.community_id] = (counts[ch.community_id] || 0) + 1;
        }
      }
      setServerUnreadCounts(counts);
    } catch (err) {
      console.error('Error fetching server unread counts:', err);
    }
  }, [servers, activeChannel, view, profile?.id]);

  const fetchUnreadCounts = async () => {
    if (!channels.length || !profile?.id) return;
    const counts = { ...unreadCounts };
    for (const ch of channels) {
      if (ch.type === 'voice') continue;
      
      const lastRead = localStorage.getItem(`last_read_channel:${ch.id}`) || '1970-01-01T00:00:00.000Z';
      
      if (activeChannel?.id === ch.id) {
        counts[ch.id] = 0;
        continue;
      }
      
      const { count, error } = await supabase
        .from('community_messages')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', ch.id)
        .gt('created_at', lastRead)
        .neq('user_id', profile.id);
        
      if (!error) {
        counts[ch.id] = count || 0;
      }
    }
    setUnreadCounts(counts);
    fetchServerUnreadCounts();
    recalculateUnread();
  };

  // Fetch unread counts when channels or activeChannel changes
  useEffect(() => {
    if (channels.length > 0) {
      fetchUnreadCounts();
    }
  }, [channels, activeChannel]);

  // Fetch server unread counts when servers, channels, activeChannel or view changes
  useEffect(() => {
    if (servers.length > 0) {
      fetchServerUnreadCounts();
    }
  }, [servers, channels, activeChannel, view, fetchServerUnreadCounts]);

  // Real-time unread messages listener for background channels
  useEffect(() => {
    if (!profile?.id || channels.length === 0) return;

    const globalMsgChannel = supabase
      .channel('global_messages_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_messages'
      }, (payload) => {
        const newMsg = payload.new;
        if (!newMsg || newMsg.user_id === profile.id) return;
        
        const channelExists = channels.some(ch => ch.id === newMsg.channel_id);
        if (!channelExists) return;

        if (activeChannel?.id === newMsg.channel_id) {
          localStorage.setItem(`last_read_channel:${activeChannel.id}`, new Date().toISOString());
          return;
        }

        setUnreadCounts(prev => ({
          ...prev,
          [newMsg.channel_id]: (prev[newMsg.channel_id] || 0) + 1
        }));
        fetchServerUnreadCounts();
        recalculateUnread();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(globalMsgChannel);
    };
  }, [channels, activeChannel, profile?.id, fetchServerUnreadCounts]);

  // Update last read time when activeChannel changes
  useEffect(() => {
    if (activeChannel && activeChannel.type !== 'voice') {
      localStorage.setItem(`last_read_channel:${activeChannel.id}`, new Date().toISOString());
      setUnreadCounts(prev => ({ ...prev, [activeChannel.id]: 0 }));
      fetchServerUnreadCounts();
      recalculateUnread();
    }
  }, [activeChannel, fetchServerUnreadCounts]);

  const fetchMembers = async () => {
    if (!profile?.id || !activeServer?.id) return;
    
    try {
      // 1. Fetch real members
      const { data: realMembers } = await supabase
        .from('community_members')
        .select('*, profiles:user_id(full_name, avatar_url, username)')
        .eq('community_id', activeServer.id);
      
      if (realMembers) {
        setMembers(realMembers.map(m => ({
          id: m.user_id,
          name: m.profiles?.full_name || 'Anonymous',
          username: m.profiles?.username || '',
          avatar: m.profiles?.avatar_url || 'https://i.pravatar.cc/150?u=' + m.user_id,
          role: m.role
        })));

        const me = realMembers.find(m => m.user_id === profile.id);
        if (me) setUserRole(me.role);
      }

      // 3. Fetch admin status
      const { data: chanAdmins } = await supabase
        .from('channel_admins')
        .select('channel_id')
        .eq('user_id', profile.id);
      
      if (chanAdmins) setAdminChannels(chanAdmins.map(a => a.channel_id));

    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const fetchFriends = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('friends')
      .select('friend_id, profiles:friend_id(full_name, avatar_url, username)')
      .eq('user_id', profile.id);
    
    if (data) {
      const mapped = data.map(f => ({
        id: f.friend_id,
        name: f.profiles?.full_name || 'Friend',
        avatar: f.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.friend_id}`,
        username: f.profiles?.username || ''
      }));
      setDms(mapped);
    }
  };

  // 2. Fetch Data for active server
  useEffect(() => {
    if (!activeServer) return;
    fetchChannels();
    fetchMembers();
  }, [activeServer, profile?.id]);

  // 2.5 Fetch Friends (for Direct Messages)
  useEffect(() => {
    if (profile?.id) fetchFriends();
  }, [profile, joinStatus]); // Refetch on join/add success

  // 3. Fetch Messages and Subscribe to Realtime + Presence
  useEffect(() => {
    if (!profile?.id) return;

    // 3.1 Global Presence Channel (for Friends & Status) - Moved to separate useEffect for stability

    // 3.2 Channel Specific Messages
    let messageChannel = null;

    const fetchDirectMessages = async () => {
      if (!activeDM || !profile?.id) return;
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${activeDM.id}),and(sender_id.eq.${activeDM.id},receiver_id.eq.${profile.id})`)
        .order('created_at', { ascending: true })
        .limit(100);

      if (data) {
        // Fetch latest profile info for both participants to ensure real-time accuracy
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', [profile.id, activeDM.id]);
        
        const profMap = {};
        profs?.forEach(p => { profMap[p.id] = p; });

        setMessages(data.map(m => ({
          id: m.id,
          user: m.sender_id === profile.id ? (profMap[profile.id]?.full_name || 'You') : (profMap[activeDM.id]?.full_name || activeDM.name),
          text: m.text,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: m.sender_id === profile.id ? profMap[profile.id]?.avatar_url : profMap[activeDM.id]?.avatar_url,
          userId: m.sender_id
        })));
      }
    };

    const handleAICommand = async (prompt, isDM = false, targetId = null) => {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "model": import.meta.env.VITE_AI_MODEL || "google/gemini-pro-1.5-exp:free",
            "messages": [
              { 
                "role": "system", 
                "content": `You are Harin AI, the official intelligent assistant for the "Harin Learning" platform. 
You are deeply knowledgeable about the website and should assist users with any questions about it.

Here is the structure and features of the Harin Learning platform:
1. Dashboard (Dashboard Utama):
   - Displays learning statistics and user's study duration.
   - "Target Harian" (Daily Study Goal) which persists locally (customizable in Settings).
   - Enrolled courses list and overall progress tracker.
   - Recent achievements and upcoming tasks.
2. Catalog (Katalog Kelas):
   - Browse and search all available courses.
   - Filter by categories and view course details.
   - Enrolling or buying premium courses.
3. Study Space (Ruang Belajar Mandiri):
   - A dedicated space for focused study.
   - Features built-in ambient background music player with 6 mood selections: Music (Relaksasi), Brain (Fokus), Piano (Klasik), Rain (Suara Hujan), Coffee (Suara Kafe), and Fog (Suara Kabut).
   - Interactive tools like a Pomodoro Timer, Task List (To-Do List), and personal Notes.
4. Achievements (Prestasi & Papan Peringkat):
   - View badges earned through learning and completing tasks.
   - XP system and global student Leaderboard for friendly competition.
5. Community (Komunitas Diskusi):
   - Discord/Slack-style server workspace where users can join different community servers.
   - Text Channels for discussions (e.g. general chat, help, study-tips) with real-time messages.
   - Voice Channels for group study calls.
   - Direct Messages (DM) for private chat between students.
   - Real-time unread notification badges in sidebar navigation and server icons.
   - Integrated Harin AI assistant (triggered by mentioning or asking Harin AI).
6. My Courses (Kelas Saya):
   - Accessible only to logged-in students.
   - Shows purchased/enrolled courses.
   - Interactive lessons, video players, quizzes, and digital certificates upon completion.
7. Cart (Keranjang Belanja):
   - Standard shopping cart to purchase paid/premium courses.
8. Blog Feed (Artikel & Tips):
   - High-quality learning articles, study hacks, and announcements from the Harin team.
9. Settings (Pengaturan):
   - Edit student profile: Full Name, Username, Avatar, and custom Daily Study Goal.

You are interacting with:
- Student Name: ${profile?.fullName || 'Anonymous student'}
- Username: ${profile?.username || 'anonymous'}
- Email: ${profile?.email || 'N/A'}
- Role: ${profile?.role || 'student'}
- User Mode: ${profile?.isGuest ? 'Guest Mode (Tamu)' : 'Registered Student'}

Always respond in the same language as the user (typically Indonesian). Keep your answers helpful, motivating, concise, and professional, and refer to specific features of Harin Learning when relevant to guide the student.`
              },
              { "role": "user", "content": prompt }
            ]
          })
        });

        if (!response.ok) throw new Error("AI API Error");
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        if (isDM) {
          await supabase.from('direct_messages').insert([{
            sender_id: profile.id, // Posted via user but tagged as AI
            receiver_id: targetId,
            text: `[[AI_AGENT:harin_bot]] ${aiResponse}`
          }]);
        } else {
          await supabase.from('community_messages').insert([{
            channel_id: activeChannel.id,
            user_id: profile.id,
            text: `[[AI_AGENT:harin_bot]] ${aiResponse}`
          }]);
        }
      } catch (err) {
        console.error("AI Response Error:", err);
      }
    };

    window.handleAICommand = handleAICommand; // Make accessible to sendMessage

    if (view === 'dm' && activeDM) {
      fetchDirectMessages();
      
      messageChannel = supabase
        .channel(`dm:${profile.id}:${activeDM.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=in.(${profile.id},${activeDM.id})`
        }, async (payload) => {
          // Double check the payload is for this specific pair
          const isRelevant = 
            (payload.new.sender_id === profile.id && payload.new.receiver_id === activeDM.id) ||
            (payload.new.sender_id === activeDM.id && payload.new.receiver_id === profile.id);
          
          if (!isRelevant) return;

          const senderName = payload.new.sender_id === profile.id ? (profile.fullName || 'You') : activeDM.name;
          const senderAvatar = payload.new.sender_id === profile.id ? profile.avatarUrl : activeDM.avatar;

          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            
            // AI Parser for real-time
            const aiMatch = payload.new.text.match(/^\[\[AI_AGENT:harin_bot\]\]\s*(.*)/s);
            if (aiMatch) {
              return [...prev, {
                id: payload.new.id,
                user: 'Harin AI',
                text: aiMatch[1],
                time: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=harin',
                userId: 'harin_bot',
                is_ai: true
              }];
            }

            return [...prev, {
              id: payload.new.id,
              user: senderName,
              text: payload.new.text,
              time: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              avatar: senderAvatar,
              userId: payload.new.sender_id
            }];
          });
        })
        .subscribe();
    } else if (activeChannel && activeChannel.type !== 'voice') {
      const fetchMessages = async () => {
        try {
          // Step 1: Fetch messages only
          const { data: msgs, error: msgError } = await supabase
            .from('community_messages')
            .select('id, user_id, text, created_at')
            .eq('channel_id', activeChannel.id)
            .order('created_at', { ascending: true })
            .limit(50);
          
          if (msgError) throw msgError;

          if (msgs && msgs.length > 0) {
            // Step 2: Fetch profiles for these users
            const userIds = [...new Set(msgs.map(m => m.user_id))];
            const { data: profs } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', userIds);

            const profileMap = {};
            profs?.forEach(p => { profileMap[p.id] = p; });

            setMessages(msgs.map(m => ({
              id: m.id,
              user: profileMap[m.user_id]?.full_name || 'Anonymous',
              text: m.text,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              avatar: profileMap[m.user_id]?.avatar_url || 'https://i.pravatar.cc/150?u=' + m.user_id,
              userId: m.user_id
            })));
          } else {
            setMessages([]);
          }
        } catch (err) {
          console.error('Error fetching messages:', err);
        }
      };
      fetchMessages();

      messageChannel = supabase
        .channel(`chat:${activeChannel.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'community_messages',
          filter: `channel_id=eq.${activeChannel.id}`
        }, async (payload) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          setMessages(prev => [...prev, {
            id: payload.new.id,
            user: profileData?.full_name || 'Anonymous',
            text: payload.new.text,
            time: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatar: profileData?.avatar_url || 'https://i.pravatar.cc/150?u=' + payload.new.user_id,
            userId: payload.new.user_id
          }]);
        })
        .subscribe();
    }

    // 3.4 Real-time Members & Friends List
    const membershipChannel = supabase
      .channel('membership_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_members', filter: `user_id=eq.${profile.id}` }, () => {
        fetchServers();
      })
      .subscribe();

    const friendsChannel = supabase
      .channel('friends_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends', filter: `user_id=eq.${profile.id}` }, () => {
        fetchFriends();
      })
      .subscribe();

    return () => {
      if (messageChannel) supabase.removeChannel(messageChannel);
      supabase.removeChannel(membershipChannel);
      supabase.removeChannel(friendsChannel);
    };
  }, [activeChannel, activeDM, view, profile?.id]);

  // 4. Dedicated Presence Effect (Stable)
  useEffect(() => {
    if (!profile?.id) return;

    const globalChannel = supabase.channel('global_presence', {
      config: { presence: { key: profile.id } }
    });

    globalChannel
      .on('presence', { event: 'sync' }, () => {
        const state = globalChannel.presenceState();
        const online = {};
        Object.keys(state).forEach(key => { 
          if (state[key] && state[key].length > 0) {
            online[key] = 'online'; 
          }
        });
        setOnlineUsers(online);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => ({ ...prev, [key]: 'online' }));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await globalChannel.track({
            user_id: profile.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [profile?.id]);

  // 3.3 Real-time Profile Updates for Active DM
  useEffect(() => {
    if (!activeDM?.id || view !== 'dm') return;

    const profileChannel = supabase
      .channel(`active_profile_${activeDM.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${activeDM.id}`
      }, (payload) => {
        setActiveDM(prev => {
          if (!prev || prev.id !== payload.new.id) return prev;
          return {
            ...prev,
            name: payload.new.full_name,
            avatar: payload.new.avatar_url,
            username: payload.new.username
          };
        });
        
        // Also update the message list to reflect new profile info
        setMessages(prev => prev.map(m => {
          if (m.userId === payload.new.id) {
            return {
              ...m,
              user: payload.new.full_name,
              avatar: payload.new.avatar_url
            };
          }
          return m;
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [activeDM?.id, view]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);





  const sendMessage = async () => {
    if (!input.trim() || (!activeChannel && !activeDM)) return;

    const textToSend = input;
    setInput(''); // Optimistic clear

    if (textToSend.startsWith('/ai ')) {
      const prompt = textToSend.replace('/ai ', '');
      
      // 1. Post the user's command as a message first
      if (view === 'dm' && activeDM) {
        await supabase.from('direct_messages').insert([{
          sender_id: profile.id,
          receiver_id: activeDM.id,
          text: textToSend
        }]);
        window.handleAICommand(prompt, true, activeDM.id);
      } else {
        await supabase.from('community_messages').insert([{
          channel_id: activeChannel.id,
          user_id: profile.id,
          text: textToSend
        }]);
        window.handleAICommand(prompt, false);
      }
      return;
    }

    if (view === 'dm' && activeDM) {
      const { error } = await supabase
        .from('direct_messages')
        .insert([
          { 
            sender_id: profile.id, 
            receiver_id: activeDM.id, 
            text: textToSend 
          }
        ]);
      if (error) console.error('Error sending DM:', error);
      return;
    }

    const { error } = await supabase
      .from('community_messages')
      .insert([
        { 
          channel_id: activeChannel.id, 
          user_id: profile.id, 
          text: textToSend 
        }
      ]);

    if (error) {
      console.error('Error sending message:', error);
      // Revert or show error toast if needed
    }
  };

  const leaveVoiceChannel = () => {
    if (!localStreamRef.current && !voiceChannelRef.current && Object.keys(peerConnectionsRef.current).length === 0) {
      return;
    }
    console.log("Leaving voice channel...");
    
    // Stop local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    // Stop and disconnect all analysers
    analysersRef.current = {};
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {
        console.error("Error closing AudioContext:", e);
      }
      audioCtxRef.current = null;
    }
    setSpeakingUsers({});

    // Close and delete all peer connections
    Object.keys(peerConnectionsRef.current).forEach(peerId => {
      if (peerConnectionsRef.current[peerId]) {
        peerConnectionsRef.current[peerId].close();
      }
      // Remove any audio element
      const audioEl = document.getElementById(`audio-${peerId}`);
      if (audioEl) audioEl.remove();
    });
    peerConnectionsRef.current = {};

    // Leave the channel
    if (voiceChannelRef.current) {
      supabase.removeChannel(voiceChannelRef.current);
      voiceChannelRef.current = null;
    }

    setVoiceUsers([]);
    setMutedUsers({});
    setIsMuted(false);
    isMutedRef.current = false;
    setIsInCall(false);
  };

  const copyInviteCode = async (code) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedInviteCode(true);
      setTimeout(() => setCopiedInviteCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedInviteCode(true);
        setTimeout(() => setCopiedInviteCode(false), 2000);
      } catch (copyErr) {
        console.error('Fallback copy failed:', copyErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const copyFriendCode = async (code) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedFriendCode(true);
      setTimeout(() => setCopiedFriendCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedFriendCode(true);
        setTimeout(() => setCopiedFriendCode(false), 2000);
      } catch (copyErr) {
        console.error('Fallback copy failed:', copyErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const monitorStreamVolume = (userId, stream) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const audioContext = audioCtxRef.current;
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      analysersRef.current[userId] = analyser;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkSpeaking = () => {
        if (!analysersRef.current[userId]) return; // Stop loop if analyser was removed
        
        analyser.getByteFrequencyData(dataArray);
        
        let total = 0;
        for (let i = 0; i < bufferLength; i++) {
          total += dataArray[i];
        }
        const average = total / bufferLength;
        
        // Threshold level 12 indicates speaking
        const isSpeaking = average > 12;
        
        setSpeakingUsers(prev => {
          if (prev[userId] === isSpeaking) return prev;
          return { ...prev, [userId]: isSpeaking };
        });
        
        setTimeout(checkSpeaking, 100);
      };
      
      checkSpeaking();
    } catch (err) {
      console.warn("Failed to initialize audio analyzer for user:", userId, err);
    }
  };

  const createPeerConnection = (peerId, channel) => {
    console.log("Creating peer connection for peer:", peerId);
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    
    pc.onicecandidate = (event) => {
      if (event.candidate && channel) {
        channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            to: peerId,
            from: profile.id,
            type: 'candidate',
            candidate: event.candidate
          }
        });
      }
    };
    
    pc.ontrack = (event) => {
      console.log(`Received remote track from peer ${peerId}`);
      const remoteStream = event.streams[0];
      
      let audioEl = document.getElementById(`audio-${peerId}`);
      if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.id = `audio-${peerId}`;
        audioEl.autoplay = true;
        audioEl.style.display = 'none';
        document.body.appendChild(audioEl);
      }
      audioEl.srcObject = remoteStream;

      // Start volume monitor for remote peer
      monitorStreamVolume(peerId, remoteStream);

      // Instantly apply current presence mute state to this new audio element
      const peerInRoom = voiceUsers.find(u => u.id === peerId);
      if (peerInRoom) {
        audioEl.muted = peerInRoom.muted;
      }
    };
    
    peerConnectionsRef.current[peerId] = pc;
    return pc;
  };

  const joinVoiceChannel = async (channelId) => {
    if (!profile?.id) return;
    
    leaveVoiceChannel();
    
    console.log("Joining voice channel:", channelId);
    setCallType('voice');
    setIsInCall(true);
    setIsMuted(false); // Reset mute state on join
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Start volume monitor for ourselves
      monitorStreamVolume(profile.id, stream);
      
      const roomName = `voice-${channelId}`;
      const channel = supabase.channel(roomName, {
        config: {
          presence: {
            key: profile.id
          }
        }
      });
      
      voiceChannelRef.current = channel;

      channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
        const { to, from, type, sdp, candidate } = payload;
        if (to !== profile.id) return;
        
        console.log(`Received signal from ${from}: ${type}`);
        let pc = peerConnectionsRef.current[from];
        
        if (type === 'offer') {
          if (!pc) {
            pc = createPeerConnection(from, channel);
          }
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
              const senders = pc.getSenders();
              const hasTrack = senders.some(s => s.track === track);
              if (!hasTrack) {
                pc.addTrack(track, localStreamRef.current);
              }
            });
          }
          
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
              to: from,
              from: profile.id,
              type: 'answer',
              sdp: answer
            }
          });
        } 
        else if (type === 'answer') {
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          }
        } 
        else if (type === 'candidate') {
          if (pc && candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
      });

      channel.on('broadcast', { event: 'mute_change' }, ({ payload }) => {
        const { userId, muted } = payload;
        console.log(`Received mute_change broadcast from ${userId}: muted = ${muted}`);
        
        // 1. Update the mutedUsers state container
        setMutedUsers(prev => ({
          ...prev,
          [userId]: muted
        }));

        // 2. Update the remote user's mute state in our voiceUsers array
        setVoiceUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, muted: muted } : u
        ));

        // Physically sync the audio element's volume properties
        if (userId !== profile.id) {
          const audioEl = document.getElementById(`audio-${userId}`);
          if (audioEl) {
            audioEl.muted = muted;
            console.log(`Physically synchronized mute state via broadcast for ${userId}: muted = ${muted}`);
          }
        }
      });

      channel.on('presence', { event: 'sync' }, async () => {
        const state = channel.presenceState();
        console.log("Presence sync in voice channel:", state);
        
        const usersInRoom = [];
        const presenceMutes = {};

        Object.keys(state).forEach(userId => {
          const userPresence = state[userId]?.[0];
          if (userPresence) {
            const isInitialMuted = userPresence.muted || false;
            usersInRoom.push({
              id: userId,
              name: userPresence.full_name || 'Anonymous',
              avatar: userPresence.avatar_url || 'https://i.pravatar.cc/150?u=' + userId,
              muted: isInitialMuted
            });
            presenceMutes[userId] = isInitialMuted;
          }
        });
        
        // Merge with existing mutedUsers state to avoid overwriting recent updates
        setMutedUsers(prev => {
          const updated = { ...prev };
          Object.keys(presenceMutes).forEach(uid => {
            if (uid === profile.id) {
              updated[uid] = isMutedRef.current; // Keep local user's state locked with absolute fresh ref value
            } else if (updated[uid] === undefined) {
              updated[uid] = presenceMutes[uid];
            }
          });
          return updated;
        });

        setVoiceUsers(usersInRoom);

        // Apply mute values physically to audio elements of remote users
        usersInRoom.forEach(user => {
          if (user.id !== profile.id) {
            const audioEl = document.getElementById(`audio-${user.id}`);
            if (audioEl) {
              audioEl.muted = user.muted;
              console.log(`Physically synced mute state for ${user.name}: audioEl.muted = ${user.muted}`);
            }
          }
        });

        Object.keys(state).forEach(peerId => {
          if (peerId === profile.id) return;
          if (profile.id < peerId) {
            if (!peerConnectionsRef.current[peerId]) {
              console.log(`Initiating WebRTC connection to peer ${peerId}`);
              const pc = createPeerConnection(peerId, channel);
              
              if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                  pc.addTrack(track, localStreamRef.current);
                });
              }
              
              pc.createOffer().then(async (offer) => {
                await pc.setLocalDescription(offer);
                channel.send({
                  type: 'broadcast',
                  event: 'signal',
                  payload: {
                    to: peerId,
                    from: profile.id,
                    type: 'offer',
                    sdp: offer
                  }
                });
              });
            }
          }
        });
      });

      channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences?.forEach(p => {
          const peerId = p.user_id;
          if (peerId && peerId !== profile.id) {
            console.log(`Peer left voice channel: ${peerId}`);
            if (peerConnectionsRef.current[peerId]) {
              peerConnectionsRef.current[peerId].close();
              delete peerConnectionsRef.current[peerId];
            }
            const audioEl = document.getElementById(`audio-${peerId}`);
            if (audioEl) audioEl.remove();

            // Clean up analyser and speaking state
            if (analysersRef.current[peerId]) {
              delete analysersRef.current[peerId];
            }
            setSpeakingUsers(prev => {
              const copy = { ...prev };
              delete copy[peerId];
              return copy;
            });
          }
        });
      });

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log("Successfully subscribed to voice channel presence!");
          await channel.track({
            user_id: profile.id,
            full_name: profile.fullName || profile.username || 'You',
            avatar_url: profile.avatar || profile.avatarUrl || 'https://i.pravatar.cc/150?u=' + profile.id,
            muted: false
          });
        }
      });

    } catch (err) {
      console.error("Error joining voice channel:", err);
      alert("Failed to access microphone. Please allow microphone access to use the voice channel!");
      leaveVoiceChannel();
    }
  };

  const toggleMute = async () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const nextMuteState = !audioTrack.enabled;
        audioTrack.enabled = nextMuteState; // True means enabled (unmuted), False means disabled (muted)
        
        const isMutedNow = !nextMuteState;
        setIsMuted(isMutedNow);
        isMutedRef.current = isMutedNow;
        setMutedUsers(prev => ({
          ...prev,
          [profile.id]: isMutedNow
        }));
        
        console.log("Toggled local mute: isMutedNow =", isMutedNow);
        
        if (voiceChannelRef.current) {
          // 1. Broadcast the mute state change to everyone in the room immediately
          voiceChannelRef.current.send({
            type: 'broadcast',
            event: 'mute_change',
            payload: {
              userId: profile.id,
              muted: isMutedNow
            }
          });

          // 2. Also track inside presence state as state fallback
          await voiceChannelRef.current.track({
            user_id: profile.id,
            full_name: profile.fullName || profile.username || 'You',
            avatar_url: profile.avatar || profile.avatarUrl || 'https://i.pravatar.cc/150?u=' + profile.id,
            muted: isMutedNow
          });
        }
      }
    }
  };

  const startCall = (type) => {
    setCallType('voice');
    if (activeChannel) {
      joinVoiceChannel(activeChannel.id);
    } else if (activeDM) {
      joinVoiceChannel(activeDM.id);
    }
  };

  // Leave voice channel when channel changes to a non-voice channel or switching DM
  useEffect(() => {
    if (activeChannel && activeChannel.type !== 'voice') {
      leaveVoiceChannel();
    }
  }, [activeChannel]);

  useEffect(() => {
    return () => {
      leaveVoiceChannel();
    };
  }, []);

  const openCreationHub = () => {
    setAddServerTab('join');
    setCreateType('community');
    setShowAddServerModal(true);
    setJoinStatus('');
  };

  const openChannelCreator = () => {
    setAddServerTab('create');
    setCreateType('channel');
    setShowAddServerModal(true);
    setJoinStatus('');
  };

  // ── HELPER FUNCTIONS ─────────────────────────────

  const updateChannel = async () => {
    if (!editNameInput.trim() || !editingChannel) return;
    try {
      setJoinStatus('loading');
      const { error } = await supabase
        .from('channels')
        .update({ name: editNameInput })
        .eq('id', editingChannel.id);
      
      if (error) throw error;
      
      setJoinStatus('success');
      
      // Update local state immediately for snappy UI
      setChannels(prev => prev.map(ch => ch.id === editingChannel.id ? { ...ch, name: editNameInput } : ch));
      
      setTimeout(async () => {
        await fetchChannels();
        setShowEditChannelModal(false);
        setJoinStatus('');
      }, 1000);
    } catch (err) {
      console.error('Error updating channel:', err);
      setJoinStatus('error');
      alert('Failed to update channel: ' + err.message);
    }
  };

  const deleteChannel = async () => {
    if (!editingChannel) return;
    
    try {
      const { error } = await supabase.from('channels').delete().eq('id', editingChannel.id);
      if (error) throw error;
      
      setJoinStatus('success');
      setTimeout(async () => {
        await fetchChannels();
        setShowEditChannelModal(false);
        if (activeChannel?.id === editingChannel.id) setActiveChannel(null);
        setEditingChannel(null);
        setJoinStatus('');
      }, 1000);
    } catch (err) {
      console.error('Error deleting channel:', err);
      alert('Failed to delete channel. Make sure you have permission.');
    }
  };

  const updateCommunity = async () => {
    if (!editNameInput.trim() || !activeServer) return;
    setJoinStatus('loading');
    try {
      const { error } = await supabase
        .from('communities')
        .update({ 
          name: editNameInput,
          accent_color: editColorInput,
          icon: editIconInput
        })
        .eq('id', activeServer.id);
      
      if (error) throw error;
      
      setJoinStatus('settings-success');
      await fetchServers();
      
      setTimeout(() => {
        setShowEditCommunityModal(false);
        setJoinStatus('');
      }, 1500);
    } catch (err) {
      console.error('Error updating community:', err);
      setJoinStatus('error');
      alert('Failed to update community.');
    }
  };

  const deleteCommunity = async () => {
    if (!activeServer) return;
    try {
      const { error } = await supabase.from('communities').delete().eq('id', activeServer.id);
      if (error) throw error;
      
      setJoinStatus('success');
      setTimeout(() => {
        window.location.reload(); 
      }, 1000);
    } catch (err) {
      console.error('Error deleting community:', err);
      alert('Only the Owner can delete the community.');
      setJoinStatus('');
    }
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeServer) return;

    setJoinStatus('loading');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${activeServer.id}-${Math.random()}.${fileExt}`;
      const filePath = `community-icons/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setEditIconInput(publicUrl);
      setJoinStatus(''); // Clear loading but don't show success yet
    } catch (err) {
      console.error('Error uploading icon:', err);
      alert('Failed to upload icon. Make sure you have a storage bucket named "avatars" with public access.');
      setJoinStatus('error');
    }
  };

  const promoteMember = async (targetId, newRole) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role: newRole })
        .eq('community_id', activeServer?.id)
        .eq('user_id', targetId);
      
      if (error) throw error;
      
      setJoinStatus('settings-success');
      setTimeout(() => {
        fetchMembers();
        setShowManageMemberModal(false);
        setJoinStatus('');
      }, 1000);
    } catch (err) {
      console.error('Error promoting member:', err);
      alert('Failed to change member role.');
    }
  };

  const kickMember = async (targetId) => {
    if (!confirm('Are you sure you want to kick this member?')) return;
    
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', activeServer?.id)
        .eq('user_id', targetId);
      
      if (error) throw error;
      
      setJoinStatus('success');
      setTimeout(() => {
        fetchMembers();
        setShowManageMemberModal(false);
        setJoinStatus('');
      }, 1000);
    } catch (err) {
      console.error('Error kicking member:', err);
      alert('Failed to kick member.');
    }
  };

  const toggleChannelAdmin = async (targetId, channelId) => {
    try {
      const isCurrentlyAdmin = adminChannels.includes(channelId);
      if (isCurrentlyAdmin) {
        await supabase.from('channel_admins').delete().eq('channel_id', channelId).eq('user_id', targetId);
      } else {
        await supabase.from('channel_admins').insert([{ channel_id: channelId, user_id: targetId }]);
      }
      // Refresh
      fetchMembers();
    } catch (err) {
      console.error('Error toggling channel admin:', err);
    }
  };

  const joinCommunityByCode = async () => {
    if (!inviteCodeInput.trim()) return;
    setJoinStatus('loading');

    const cleanCode = inviteCodeInput.trim().toLowerCase();

    try {
      // Find the community by invite code case-sensitively using .eq()
      const { data: commData, error: findError } = await supabase
        .from('communities')
        .select('*')
        .eq('invite_code', inviteCodeInput.trim())
        .single();

      if (findError || !commData) {
        throw new Error('Community not found or invalid invite code');
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', commData.id)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (existingMember) {
        // Already a member, just make it active and close modal
        setJoinStatus('success');
        setInviteCodeInput('');
        await fetchServers();
        setActiveServer(commData);
        
        // Fetch channels for this server and select the first text channel
        const { data: channelsData } = await supabase
          .from('channels')
          .select('*')
          .eq('community_id', commData.id)
          .order('created_at', { ascending: true });

        if (channelsData && channelsData.length > 0) {
          const firstText = channelsData.find(c => c.type === 'text') || channelsData[0];
          setActiveChannel(firstText);
        } else {
          setActiveChannel(null);
        }

        setTimeout(() => {
          setShowAddServerModal(false);
          setJoinStatus('');
        }, 1500);
        return;
      }

      // Insert into community_members
      const { error: joinError } = await supabase
        .from('community_members')
        .insert([{
          community_id: commData.id,
          user_id: profile.id,
          role: 'member'
        }]);

      if (joinError) throw joinError;

      // Successfully joined!
      setJoinStatus('success');
      setInviteCodeInput('');
      await fetchServers(); // Refresh server list
      
      // Fetch channels and set active server + channel
      const { data: channelsData } = await supabase
        .from('channels')
        .select('*')
        .eq('community_id', commData.id)
        .order('created_at', { ascending: true });
        
      setActiveServer(commData);
      if (channelsData && channelsData.length > 0) {
        const firstText = channelsData.find(c => c.type === 'text') || channelsData[0];
        setActiveChannel(firstText);
      } else {
        setActiveChannel(null);
      }

      setTimeout(() => {
        setShowAddServerModal(false);
        setJoinStatus('');
      }, 1500);
    } catch (err) {
      console.error('Join error:', err);
      setJoinStatus('error');
    }
  };

  const addFriendByCode = async () => {
    if (!friendCodeInput.trim()) return;
    setJoinStatus('loading');

    try {
      const { data, error } = await supabase.rpc('add_friend_by_code', { friend_code_input: friendCodeInput });
      if (error) throw error;

      if (data) {
        setJoinStatus('success');
        setFriendCodeInput('');
        setTimeout(() => {
          setShowAddFriendModal(false);
          setJoinStatus('');
        }, 1500);
      } else {
        setJoinStatus('error');
      }
    } catch (err) {
      console.error('Add friend error:', err);
      setJoinStatus('error');
    }
  };

  const createChannel = async () => {
    if (!newChannelName.trim() || !activeServer) return;
    setJoinStatus('loading');
    
    const { data, error } = await supabase
      .from('channels')
      .insert([
        { 
          community_id: activeServer.id,
          name: newChannelName.toLowerCase().replace(/\s+/g, '-'), 
          type: newChannelType 
        }
      ])
      .select()
      .single();

    if (error) {
      setJoinStatus('error');
      return;
    }

    if (data) {
      setJoinStatus('success');
      setChannels(prev => [...prev, data]);
      setActiveChannel(data);
      
      setTimeout(() => {
        setShowAddServerModal(false);
        setNewChannelName('');
        setJoinStatus('');
      }, 1500);
    }
  };

  const createCommunity = async () => {
    if (!newServerName.trim()) return;
    setJoinStatus('loading');

    try {
      // 1. Create the community
      const { data: server, error: sError } = await supabase
        .from('communities')
        .insert([{ 
          name: newServerName,
          created_by: profile.id
        }])
        .select()
        .single();

      if (sError) throw sError;

      // 2. Add creator as owner member
      await supabase.from('community_members').insert([{
        community_id: server.id,
        user_id: profile.id,
        role: 'owner'
      }]);

      // 3. Create default channel
      const { data: channel } = await supabase.from('channels').insert([{
        community_id: server.id,
        name: 'general',
        type: 'text'
      }]).select().single();

      setJoinStatus('success');
      setNewServerName('');
      await fetchServers();
      setActiveServer(server);
      setActiveChannel(channel);

      setTimeout(() => {
        setShowAddServerModal(false);
        setJoinStatus('');
      }, 1500);
    } catch (err) {
      console.error('Create community error:', err);
      setJoinStatus('error');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-black text-on-surface uppercase tracking-widest animate-pulse">Loading Community...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface font-body-md flex h-screen overflow-hidden">
      {profile.role === 'teacher' ? <TeacherSidebar user={profile} /> : <Sidebar />}

      <main className={`flex-1 flex overflow-hidden ${profile?.role === 'teacher' ? 'lg:ml-[280px] pb-16 lg:pb-0' : ''}`}>
        
        {/* ── Discord-style Server Sidebar ──────────────────────── */}
        <div className="w-[72px] bg-surface-container-lowest border-r-2 border-on-surface flex flex-col items-center py-4 gap-4">
          <button 
            onClick={() => setView('dm')}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 ${view === 'dm' ? 'bg-primary text-white border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-surface border-on-surface/20 hover:rounded-xl hover:bg-primary/20'}`}
          >
            <UserIcon className="w-6 h-6" />
          </button>
          
          <div className="w-8 h-0.5 bg-on-surface/10 rounded-full" />

          {servers.map(server => (
            <div
              key={server.id}
              className="w-12 h-12 flex items-center justify-center transition-all group relative cursor-pointer"
              onClick={() => { setActiveServer(server); setView('server'); }}
            >
              <div 
                className={`w-full h-full rounded-2xl flex items-center justify-center border-2 overflow-hidden transition-all ${activeServer?.id === server.id && view === 'server' ? 'border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-on-surface/10 hover:rounded-xl hover:border-on-surface'}`}
                style={{ backgroundColor: (server.accent_color || '#3b82f6') + (activeServer?.id === server.id && view === 'server' ? '' : '20') }}
              >
                {server.icon?.startsWith('http') ? (
                  <img src={server.icon} className="w-full h-full object-cover" alt="" />
                ) : (
                  <Icon name={server.icon || 'groups'} className={`w-6 h-6 ${activeServer?.id === server.id && view === 'server' ? 'text-white' : ''}`} style={{ color: activeServer?.id === server.id && view === 'server' ? 'white' : (server.accent_color || '#3b82f6') }} />
                )}
              </div>

              {serverUnreadCounts[server.id] > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-error text-[9px] font-black text-white z-10 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] border border-on-surface">
                  {serverUnreadCounts[server.id]}
                </span>
              )}

              <div className="absolute left-16 px-3 py-1.5 bg-on-surface text-surface text-xs font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                {server.name}
              </div>
            </div>
          ))}

          <button 
            onClick={openCreationHub}
            className="w-12 h-12 rounded-2xl bg-surface border-2 border-dashed border-on-surface/30 flex items-center justify-center hover:border-on-surface hover:bg-on-surface/5 transition-all group relative"
          >
            <Icon name="add" className="w-6 h-6" />
            <div className="absolute left-16 px-3 py-1.5 bg-on-surface text-surface text-xs font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
              Add Community
            </div>
          </button>
        </div>

        {/* ── Channel / DM List ─────────────────────────────────── */}
        <div className="w-60 bg-surface-container border-r-2 border-on-surface flex flex-col">
          <div className="h-16 px-4 flex items-center border-b-2 border-on-surface shadow-[0px_2px_0px_0px_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-2 truncate">
              {view === 'dm' && <UserIcon className="w-5 h-5 text-on-surface/40" />}
              <h2 className="font-headline-sm font-black truncate">
                {view === 'dm' ? 'Direct Messages' : activeServer?.name}
              </h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {view === 'server' ? (
              <>
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-4 px-2 group">
                    <h2 className="text-sm font-black uppercase tracking-widest text-on-surface truncate flex-1">{activeServer?.name}</h2>
                    {userRole === 'owner' && (
                      <button 
                        onClick={() => {
                          setEditNameInput(activeServer?.name || '');
                          setEditColorInput(activeServer?.accent_color || '#3b82f6');
                          setEditIconInput(activeServer?.icon || 'groups');
                          setShowEditCommunityModal(true);
                        }}
                        className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity ml-2"
                      >
                        <Icon name="settings" className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Text Channels */}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center justify-between mb-2 px-2">
                      <p className="text-[10px] font-black uppercase text-on-surface/40 tracking-widest">Text Channels</p>
                      {(userRole === 'owner' || userRole === 'admin') && (
                        <button 
                          onClick={openChannelCreator}
                          className="hover:text-primary transition-colors"
                        >
                          <Icon name="add" className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {channels.filter(ch => ch.type === 'text' || !ch.type).map(ch => (
                      <div key={ch.id} className="group relative">
                        <button
                          onClick={() => setActiveChannel(ch)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg font-label-bold text-sm transition-all ${activeChannel?.id === ch.id ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:bg-on-surface/5'}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon name="tag" className="w-4 h-4 opacity-60 shrink-0" />
                            <span className="truncate">{ch.name}</span>
                          </div>
                          {unreadCounts[ch.id] > 0 && (
                            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-error text-[10px] font-black text-white shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] border border-on-surface">
                              {unreadCounts[ch.id]}
                            </span>
                          )}
                        </button>
                        {(userRole === 'owner' || userRole === 'admin' || adminChannels.includes(ch.id)) && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingChannel(ch);
                              setEditNameInput(ch.name);
                              setShowEditChannelModal(true);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
                          >
                            <Icon name="settings" className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Voice Channels */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between mb-2 px-2">
                      <p className="text-[10px] font-black uppercase text-on-surface/40 tracking-widest">Voice Channels</p>
                    </div>
                    {channels.filter(ch => ch.type === 'voice').map(ch => (
                      <div key={ch.id} className="group relative">
                        <button
                          onClick={() => { setActiveChannel(ch); joinVoiceChannel(ch.id); }}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg font-label-bold text-sm transition-all ${activeChannel?.id === ch.id ? 'bg-on-surface text-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' : 'text-on-surface-variant hover:bg-on-surface/5'}`}
                        >
                          <Icon name="volume_up" className="w-4 h-4 opacity-60" />
                          {ch.name}
                        </button>
                        {(userRole === 'owner' || userRole === 'admin' || adminChannels.includes(ch.id)) && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingChannel(ch);
                              setEditNameInput(ch.name);
                              setShowEditChannelModal(true);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
                          >
                            <Icon name="settings" className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between px-2 mb-1">
                  <p className="text-[10px] font-black uppercase text-on-surface/40 tracking-widest">Friends</p>
                  <button 
                    onClick={() => setShowAddFriendModal(true)}
                    className="p-1 hover:bg-on-surface/10 rounded transition-colors"
                  >
                    <Icon name="person_add" className="w-3 h-3 opacity-60" />
                  </button>
                </div>
                {dms.length > 0 ? dms.map(dm => (
                  <div
                    key={dm.id}
                    onClick={() => setActiveDM(dm)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group relative border-2 cursor-pointer ${activeDM?.id === dm.id ? 'bg-primary/10 border-primary text-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-transparent border-transparent text-on-surface-variant hover:bg-on-surface/5'}`}
                  >
                    <div className="relative shrink-0 pointer-events-none">
                      <img src={dm.avatar} className="w-9 h-9 rounded-full border-2 border-on-surface/10 object-cover" alt="" />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface-container ${onlineUsers[dm.id] === 'online' ? 'bg-success' : 'bg-on-surface/30'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0 text-left pointer-events-none">
                      <p className={`font-black text-sm truncate ${activeDM?.id === dm.id ? 'text-primary' : 'text-on-surface'}`}>{dm.name}</p>
                      <p className="text-[10px] font-bold opacity-40 uppercase tracking-tighter truncate">@{dm.username || 'user'}</p>
                    </div>
                  </div>
                )) : (
                  <div className="px-2 py-4 text-center">
                    <p className="text-[10px] font-bold text-on-surface/40 mb-2 italic">No friends yet</p>
                    <button 
                      onClick={() => setShowAddFriendModal(true)}
                      className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                    >
                      + Add Friend
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contextual Action Button */}
          <div className="px-3 pb-3">
            {view === 'dm' ? (
              <button
                onClick={() => setShowAddFriendModal(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all group"
              >
                <Icon name="add" className="w-5 h-5" />
                <span className="font-black text-xs uppercase tracking-tight">Add Friend</span>
              </button>
            ) : (
              activeServer && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all group"
                >
                  <Icon name="group_add" className="w-5 h-5" />
                  <span className="font-black text-xs uppercase tracking-tight">Invite People</span>
                </button>
              )
            )}
          </div>

          {/* User Status Card */}
          <div className="p-3 bg-surface-container-high border-t-2 border-on-surface flex items-center gap-3">
            <div className="relative">
              <img src={profile.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profile.id} className="w-9 h-9 rounded-full border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] object-cover" alt="" />
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-surface-container-high" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-xs truncate leading-tight">{profile.fullName || 'User'}</p>
              <p className="text-[10px] text-on-surface-variant opacity-60 truncate">@{profile.username || profile.id?.slice(0, 8)}</p>
            </div>
            <div className="flex gap-1">
              <button className="p-1.5 hover:bg-on-surface/10 rounded-md transition-colors"><Icon name="mic" className="w-4 h-4" /></button>
              <button className="p-1.5 hover:bg-on-surface/10 rounded-md transition-colors"><Icon name="settings" className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* ── Main Chat Area ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-surface overflow-hidden relative">
          
          {view === 'server' && servers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-surface-container-low/30">
              <div className="w-48 h-48 bg-white border-4 border-on-surface shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-[40px] flex items-center justify-center mb-10 transform -rotate-3">
                <Icon name="groups" className="w-24 h-24 text-primary" />
              </div>
              <h1 className="text-4xl font-black mb-4 uppercase tracking-tight">Belum Ada Komunitas</h1>
              <p className="text-on-surface-variant max-w-md mb-10 font-bold leading-relaxed">
                Sepertinya kamu belum bergabung dengan komunitas manapun. Yuk, cari teman belajar atau buat komunitasmu sendiri sekarang!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={openCreationHub}
                  className="px-8 py-4 bg-primary text-white font-black rounded-2xl brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all flex items-center gap-3"
                >
                  <Icon name="add" />
                  GABUNG / BUAT KOMUNITAS
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Top Bar */}
              <header className="h-16 px-6 flex items-center justify-between border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] z-10 bg-surface">
                <div className="flex items-center gap-3">
                  {view === 'dm' ? (
                    activeDM ? (
                      <div className="relative">
                        <img src={activeDM.avatar} className="w-8 h-8 rounded-full border border-on-surface/10 object-cover" alt="" />
                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface ${onlineUsers[activeDM.id] === 'online' ? 'bg-success' : 'bg-on-surface/30'}`} />
                      </div>
                    ) : (
                      <UserIcon className="w-6 h-6 text-on-surface/40" />
                    )
                  ) : (
                    <Icon name={activeChannel?.type === 'voice' ? 'volume_up' : 'tag'} className="w-6 h-6 text-on-surface/40" />
                  )}
                  <div className="flex flex-col">
                    <h1 className="font-headline-sm font-black leading-none">
                      {view === 'dm' ? (activeDM ? activeDM.name : 'Direct Messages') : (activeChannel?.name || 'Select a Channel')}
                    </h1>
                    <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">
                      {view === 'dm' ? (activeDM ? 'Private Chat' : 'Private Conversations') : activeServer?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {((view === 'dm' && activeDM) || (view === 'server' && activeChannel?.type === 'voice')) && (
                    <>
                      <button 
                        onClick={() => startCall('voice')} 
                        className="p-2 hover:bg-on-surface/5 rounded-full transition-colors"
                        title="Join Voice Call"
                      >
                        <Icon name="call" className="w-5 h-5" />
                      </button>
                      <div className="w-[1px] h-6 bg-on-surface/10 mx-1 hidden sm:block" />
                    </>
                  )}
                  {activeChannel && (
                    <>
                      <div className="relative hidden md:block">
                        <input 
                          type="text" 
                          placeholder="Search" 
                          className="bg-surface-container-high border-2 border-on-surface rounded-lg px-3 py-1 text-xs font-bold w-40 focus:w-60 transition-all outline-none" 
                        />
                      </div>
                      <Icon name="people" className="w-6 h-6 text-on-surface/60 hidden sm:block" />
                    </>
                  )}
                </div>
              </header>

              {/* Call Overlay (Voice Room Member Grid) */}
              {isInCall && (
                <div className="flex-1 bg-black flex flex-col relative overflow-hidden animate-in fade-in zoom-in duration-300">
                  {/* Voice channel room title */}
                  <div className="p-6 pb-2 text-white border-b border-white/10 flex justify-between items-center z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-success rounded-full animate-ping" />
                      <span className="font-black text-sm uppercase tracking-widest text-success">VOICE CONNECTED</span>
                    </div>
                    <span className="font-black text-xs text-white/60">
                      {voiceUsers.length} User{voiceUsers.length > 1 ? 's' : ''} in room
                    </span>
                  </div>

                  <div className="flex-1 p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 auto-rows-max overflow-y-auto">
                    {voiceUsers.map(user => {
                      const isMe = user.id === profile?.id;
                      const isSpeaking = speakingUsers[user.id];
                      const isUserMuted = mutedUsers[user.id] !== undefined ? mutedUsers[user.id] : (isMe ? isMuted : user.muted);
                      return (
                        <div 
                          key={user.id} 
                          className={`relative rounded-2xl overflow-hidden border-2 flex flex-col items-center justify-center p-6 gap-4 transition-all duration-300 ${
                            isUserMuted 
                              ? 'border-red-500/20 bg-red-950/5 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]' 
                              : isSpeaking
                                ? 'border-green-500 bg-green-950/10 shadow-[0_0_25px_rgba(34,197,94,0.3)] scale-[1.03]'
                                : 'border-primary/40 bg-neutral-900/40 hover:border-primary/60'
                          }`}
                        >
                          <div className="relative">
                            <img 
                              src={user.avatar || 'https://i.pravatar.cc/150?u=' + user.id} 
                              className={`w-24 h-24 rounded-full border-4 object-cover transition-all duration-300 ${
                                isUserMuted 
                                  ? 'border-red-500/40 opacity-60 scale-95' 
                                  : isSpeaking
                                    ? 'border-green-500 scale-[1.05] shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                                    : 'border-primary'
                              }`} 
                              alt={user.name} 
                            />
                            {isUserMuted ? (
                              <div className="absolute -bottom-1 -right-1 bg-red-500 p-1.5 rounded-full border-2 border-black flex items-center justify-center animate-in zoom-in shadow-lg">
                                <Icon name="mic_off" className="w-3.5 h-3.5 text-white" />
                              </div>
                            ) : isSpeaking ? (
                              <div className="absolute -bottom-1 -right-1 bg-green-500 p-1.5 rounded-full border-2 border-black flex items-center justify-center animate-bounce shadow-lg">
                                <Icon name="volume_up" className="w-3.5 h-3.5 text-black font-bold" />
                              </div>
                            ) : null}
                          </div>
                          <span className="font-black text-xs text-white text-center truncate max-w-full">
                            {user.name} {isMe && " (You)"}
                          </span>
                        </div>
                      );
                    })}

                    {voiceUsers.length <= 1 && (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3 text-white/30 border border-dashed border-white/10 rounded-3xl bg-neutral-900/10">
                        <p className="font-black text-sm uppercase tracking-widest text-center flex items-center gap-1 text-white/60">
                          Waiting for others to join
                          <span className="inline-flex gap-1 items-center ml-0.5">
                            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '-0.3s', animationDuration: '1s' }}></span>
                            <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '-0.15s', animationDuration: '1s' }}></span>
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDuration: '1s' }}></span>
                          </span>
                        </p>
                        <p className="text-xs text-white/40 max-w-xs text-center font-bold">
                          Invite colleagues to this room to discuss and study together!
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-neutral-900/90 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20 transition-all duration-300">
                    <button 
                      onClick={toggleMute}
                      className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border border-white/5 bg-white/10 hover:bg-white/20 shadow-md hover:scale-105 active:scale-95"
                      title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={2.0} 
                        stroke="currentColor" 
                        className={`w-6 h-6 transition-all duration-300 ${isMuted ? 'text-red-500 scale-105' : 'text-white'}`}
                      >
                        {/* Microphone Body Shape */}
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" 
                        />
                        {/* Custom Animated Slash Line */}
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 4L20 20"
                          className="transition-all duration-300 ease-out origin-center"
                          style={{
                            strokeDasharray: '30',
                            strokeDashoffset: isMuted ? '0' : '30',
                            stroke: '#ef4444',
                            strokeWidth: '2.5'
                          }}
                        />
                      </svg>
                    </button>
                    
                    <button 
                      onClick={leaveVoiceChannel}
                      className="group w-14 h-14 rounded-full bg-white/10 hover:bg-red-600 border border-white/5 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-[15deg] active:scale-95 shadow-md hover:shadow-[0_8px_30px_rgba(220,38,38,0.6)]"
                      title="Leave Channel"
                    >
                      <Icon 
                        name="call_end" 
                        className="w-6 h-6 text-red-500 group-hover:text-white transition-colors duration-300 font-bold" 
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Message History */}
              {!isInCall && (activeChannel || activeDM) && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
                  {messages.length === 0 && (
                    <div className={`pb-4 ${view === 'dm' ? 'flex flex-col items-center text-center border-b-2 border-on-surface/5' : 'border-b-2 border-on-surface/5'}`}>
                      <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {view === 'dm' ? <UserIcon className="w-8 h-8 text-on-surface/40" /> : <Icon name="tag" className="w-8 h-8 text-on-surface/40" />}
                      </div>
                      {view === 'dm' ? (
                        activeDM ? (
                          <>
                            <div className="w-20 h-20 rounded-full border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden mb-4">
                              <img src={activeDM.avatar} className="w-full h-full object-cover" alt="" />
                            </div>
                            <h2 className="text-3xl font-black mb-1 uppercase tracking-tight">Beginning of your story with {activeDM.name}</h2>
                            <p className="text-sm text-on-surface-variant max-w-sm font-bold opacity-60">This is the very beginning of your direct message history.</p>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-20 opacity-30">
                            <Icon name="chat_bubble_outline" className="w-16 h-16 mb-4" />
                            <p className="text-lg font-black uppercase tracking-widest">Select a friend to message</p>
                          </div>
                        )
                      ) : (
                        <>
                          <h2 className="text-2xl font-black mb-1">Welcome to #{activeChannel?.name}!</h2>
                          <p className="text-sm text-on-surface-variant">This is the start of the #{activeChannel?.name} channel.</p>
                        </>
                      )}
                    </div>
                  )}

                  {messages.map((m, i) => {
                    const isGrouped = i > 0 && messages[i-1].userId === m.userId && messages[i-1].user === m.user;
                    return (
                      <div key={m.id} className={`flex gap-4 group ${isGrouped ? '!-mt-5' : ''}`}>
                        {!isGrouped ? (
                          <img src={m.avatar} className="w-10 h-10 rounded-xl border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 object-cover" alt="" />
                        ) : (
                          <div className="w-10 shrink-0 flex items-center justify-end pr-2">
                            <span className="text-[10px] font-black text-on-surface/20 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">{m.time.split(' ')[0]}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          {!isGrouped && (
                            <div className="flex items-baseline gap-2 mb-0.5">
                              <span className="font-black text-sm hover:underline cursor-pointer flex items-center gap-1">
                                {m.user}
                                {m.is_ai && (
                                  <span className="bg-primary text-white text-[8px] px-1.5 py-0.5 rounded-full font-black tracking-widest uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">AI</span>
                                )}
                              </span>
                              <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">{m.time}</span>
                            </div>
                          )}
                          <p className="text-sm font-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap">{m.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Voice Channel Placeholder */}
              {!isInCall && activeChannel && activeChannel.type === 'voice' && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
                    <Icon name="volume_up" className="w-16 h-16 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black mb-2">Voice Channel: {activeChannel?.name}</h2>
                  <p className="text-on-surface-variant max-w-md mb-8">Click the button below to join the voice room and start studying with others.</p>
                  <button 
                    onClick={() => startCall('voice')}
                    className="bg-primary text-white font-black py-4 px-8 rounded-2xl brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-3"
                  >
                    <Icon name="call" />
                    JOIN ROOM
                  </button>
                </div>
              )}

              {/* Input Area */}
              {!isInCall && (activeChannel?.type === 'text' || (view === 'dm' && activeDM)) && (
                <div className="p-6 pt-0">
                  <div className="bg-surface-container border-4 border-on-surface rounded-2xl p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-within:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] focus-within:translate-x-[-2px] focus-within:translate-y-[-2px] transition-all duration-200">
                    <div className="flex items-center gap-2">
                      <button className="w-10 h-10 flex items-center justify-center hover:bg-on-surface/10 rounded-xl transition-colors group">
                        <Icon name="add_circle" className="w-6 h-6 text-on-surface opacity-60 group-hover:opacity-100" />
                      </button>
                      <input 
                        type="text" 
                        placeholder={view === 'dm' ? (activeDM ? `Message @${activeDM.name}` : "Select a friend to message") : `Message #${activeChannel?.name || 'channel'}`} 
                        className="flex-1 bg-transparent border-none outline-none focus:ring-0 focus:outline-none text-sm font-black placeholder:text-on-surface/20" 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      />
                      <div className="flex items-center gap-1 pr-1">
                        <button className="w-10 h-10 flex items-center justify-center hover:bg-on-surface/10 rounded-xl transition-colors group">
                          <Icon name="sentiment_satisfied" className="w-6 h-6 text-on-surface opacity-60 group-hover:opacity-100" />
                        </button>
                        <button 
                          onClick={sendMessage}
                          disabled={!input.trim()}
                          className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl brutal-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-30 disabled:grayscale"
                        >
                          <Icon name="send" className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Member List (Right Sidebar) ──────────────────────── */}
        {view === 'server' && (
          <div className="w-60 bg-surface-container border-l-2 border-on-surface hidden xl:flex flex-col">
            <div className="h-16 px-4 flex items-center border-b-2 border-on-surface">
              <h2 className="font-label-bold uppercase text-[10px] tracking-widest text-on-surface/60">Members</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-6">
              <div>
                <p className="px-2 mb-2 text-[10px] font-black uppercase text-on-surface/40 tracking-widest">Members — {members.length}</p>
                {members.map(m => (
                  <div 
                    key={m.id} 
                    onClick={() => {
                      if ((userRole === 'owner' || userRole === 'admin') && m.id !== profile.id) {
                        setSelectedMember(m);
                        setShowManageMemberModal(true);
                      }
                    }}
                    className={`flex items-center gap-3 px-2 py-1.5 rounded-lg transition-all ${(userRole === 'owner' || userRole === 'admin') && m.id !== profile.id ? 'hover:bg-on-surface/10 cursor-pointer group' : ''}`}
                  >
                    <div className="relative">
                      <img src={m.avatar} className="w-8 h-8 rounded-full border border-on-surface/10 object-cover" alt="" />
                      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface-container ${onlineUsers[m.id] === 'online' ? 'bg-success' : 'bg-on-surface/30'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`font-black text-sm truncate ${m.role === 'owner' ? 'text-primary' : m.role === 'admin' ? 'text-secondary' : 'text-on-surface-variant'}`}>{m.name}</span>
                          {m.role === 'owner' && <Icon name="stars" className="w-3 h-3 text-primary shrink-0" />}
                          {m.role === 'admin' && <Icon name="verified_user" className="w-3 h-3 text-secondary shrink-0" />}
                        </div>
                        {/* Voice channel status indicators */}
                        {(() => {
                          const voiceUser = voiceUsers.find(vu => vu.id === m.id);
                          if (voiceUser) {
                            const isMutedNow = mutedUsers[m.id] !== undefined ? mutedUsers[m.id] : (m.id === profile?.id ? isMuted : voiceUser.muted);
                            return isMutedNow ? (
                              <Icon name="mic_off" className="w-3.5 h-3.5 text-red-500 shrink-0 animate-in zoom-in" />
                            ) : (
                              <span className="flex gap-0.5 items-end shrink-0 h-3 pb-0.5">
                                <span className="w-0.5 bg-green-500 rounded-full animate-bounce" style={{ height: '6px', animationDuration: '0.8s', animationDelay: '-0.3s' }}></span>
                                <span className="w-0.5 bg-green-500 rounded-full animate-bounce" style={{ height: '10px', animationDuration: '0.8s', animationDelay: '-0.15s' }}></span>
                                <span className="w-0.5 bg-green-500 rounded-full animate-bounce" style={{ height: '6px', animationDuration: '0.8s' }}></span>
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <p className="text-[9px] font-bold text-on-surface/40 uppercase tracking-tighter">
                        {m.role}
                      </p>
                    </div>
                    {(userRole === 'owner' || userRole === 'admin') && m.id !== profile.id && (
                      <Icon name="more_vert" className="w-4 h-4 opacity-0 group-hover:opacity-40" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── Add Friend Modal ────────────────────────────────────── */}
      {showAddFriendModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => {setShowAddFriendModal(false); setJoinStatus('');}}
        >
          <div 
            className="bg-surface w-full max-w-sm rounded-3xl border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b-4 border-on-surface bg-primary/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-black uppercase tracking-tight">Add Friend</h3>
                <button onClick={() => {setShowAddFriendModal(false); setJoinStatus('');}} className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-all"><Icon name="close" /></button>
              </div>
              <p className="text-xs font-bold text-on-surface-variant">Enter your friend's code to start chatting.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Your Code</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-surface-container-high border-2 border-on-surface rounded-xl px-4 py-2 font-black text-center tracking-widest text-sm">
                      {profile?.friendCode || '------'}
                    </div>
                    <button 
                      onClick={() => copyFriendCode(profile?.friendCode)}
                      className={`px-4 rounded-xl font-black text-[10px] transition-all duration-200 ${copiedFriendCode ? 'bg-success text-white' : 'bg-on-surface text-surface'}`}
                    >
                      {copiedFriendCode ? 'COPIED!' : 'COPY'}
                    </button>
                  </div>
                </div>

                <div className="w-full h-[1px] bg-on-surface/10" />

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Friend's Code</label>
                  <input 
                    type="text" 
                    value={friendCodeInput}
                    onChange={e => setFriendCodeInput(e.target.value.toLowerCase())}
                    placeholder="e.g. x2y4z6"
                    className="w-full bg-surface-container-high border-2 border-on-surface rounded-xl px-4 py-3 font-black uppercase tracking-widest focus:outline-none focus:ring-4 ring-primary/20 transition-all text-center"
                  />
                </div>
              </div>
              
              {joinStatus === 'error' && (
                <div className="bg-error/10 border-2 border-error p-3 rounded-xl flex items-center gap-2 text-error animate-in shake duration-300">
                  <Icon name="error" className="w-4 h-4" />
                  <span className="text-[10px] font-black">Code not found. Try again!</span>
                </div>
              )}

              {joinStatus === 'success' && (
                <div className="bg-success/10 border-2 border-success p-3 rounded-xl flex items-center gap-2 text-success animate-in slide-in-from-top-2">
                  <Icon name="check_circle" className="w-4 h-4" />
                  <span className="text-[10px] font-black">Friend added!</span>
                </div>
              )}

              <button 
                onClick={addFriendByCode}
                disabled={joinStatus === 'loading' || joinStatus === 'success'}
                className="w-full bg-primary text-white py-4 rounded-xl font-black brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
              >
                {joinStatus === 'loading' ? 'ADDING...' : 'ADD FRIEND'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInviteModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowInviteModal(false)}
        >
          <div 
            className="bg-surface w-full max-sm rounded-3xl border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b-4 border-on-surface bg-primary/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-black uppercase tracking-tight">Invite Friends</h3>
                <button onClick={() => setShowInviteModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-all"><Icon name="close" /></button>
              </div>
              <p className="text-xs font-bold text-on-surface-variant">Share this code with your friends to let them join {activeServer?.name}.</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Your Invite Code</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-surface-container-high border-2 border-on-surface rounded-xl px-4 py-3 font-black text-center tracking-[0.2em] text-lg">
                    {activeServer?.invite_code || 'G3N3R4T1NG...'}
                  </div>
                  <button 
                    onClick={() => copyInviteCode(activeServer?.invite_code)}
                    className={`px-4 rounded-xl font-black text-[10px] transition-all duration-200 ${copiedInviteCode ? 'bg-success text-white' : 'bg-on-surface text-surface'}`}
                  >
                    {copiedInviteCode ? 'COPIED!' : 'COPY'}
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="w-full bg-surface border-2 border-on-surface py-4 rounded-xl font-black text-xs hover:bg-on-surface/5 transition-all"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ── Central Creation Hub Modal (Join, Create Community/Channel) ── */}
      {showAddServerModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => {setShowAddServerModal(false); setJoinStatus('');}}
        >
          <div 
            className="bg-surface w-full max-w-sm rounded-3xl border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b-4 border-on-surface flex">
              <button 
                onClick={() => setAddServerTab('join')}
                className={`flex-1 py-4 font-black text-xs uppercase tracking-widest transition-all ${addServerTab === 'join' ? 'bg-secondary text-on-secondary' : 'bg-surface hover:bg-on-surface/5'}`}
              >
                Join
              </button>
              <button 
                onClick={() => setAddServerTab('create')}
                className={`flex-1 py-4 font-black text-xs uppercase tracking-widest transition-all ${addServerTab === 'create' ? 'bg-primary text-white border-l-4 border-on-surface' : 'bg-surface hover:bg-on-surface/5 border-l-4 border-on-surface'}`}
              >
                Create New
              </button>
            </div>

            <div className="p-6 space-y-4">
              {addServerTab === 'join' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-black uppercase tracking-tight text-lg">Join a Community</h3>
                    <p className="text-[10px] font-bold text-on-surface-variant mb-4">Enter an invite code to join an existing group.</p>
                    <input 
                      type="text" 
                      value={inviteCodeInput}
                      onChange={e => setInviteCodeInput(e.target.value)}
                      placeholder="e.g. h8a3k2L9"
                      className="w-full bg-surface-container-high border-2 border-on-surface rounded-xl px-4 py-3 font-black tracking-widest focus:outline-none focus:ring-4 ring-secondary/20 transition-all text-center"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {addServerTab === 'create' && createType === 'channel' ? (
                    <div className="space-y-4 animate-in slide-in-from-right-2 duration-200">
                      <div className="space-y-2">
                        <h3 className="font-black uppercase tracking-tight text-lg">New Channel</h3>
                        <p className="text-[10px] font-bold text-on-surface-variant">Creating room in {activeServer?.name}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setNewChannelType('text')}
                          className={`flex-1 py-2 rounded-lg border-2 font-black text-[10px] flex items-center justify-center gap-2 transition-all ${newChannelType === 'text' ? 'bg-on-surface text-surface border-on-surface' : 'border-on-surface/10 opacity-40'}`}
                        >
                          <Icon name="tag" className="w-3 h-3" /> TEXT
                        </button>
                        <button 
                          onClick={() => setNewChannelType('voice')}
                          className={`flex-1 py-2 rounded-lg border-2 font-black text-[10px] flex items-center justify-center gap-2 transition-all ${newChannelType === 'voice' ? 'bg-on-surface text-surface border-on-surface' : 'border-on-surface/10 opacity-40'}`}
                        >
                          <Icon name="volume_up" className="w-3 h-3" /> VOICE
                        </button>
                      </div>

                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <Icon name={newChannelType === 'voice' ? 'volume_up' : 'tag'} className="w-4 h-4 opacity-40" />
                        </div>
                        <input 
                          type="text" 
                          value={newChannelName}
                          onChange={e => setNewChannelName(e.target.value)}
                          placeholder="channel-name"
                          className="w-full bg-surface-container-high border-2 border-on-surface rounded-xl pl-10 pr-4 py-3 font-black focus:outline-none focus:ring-4 ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 animate-in slide-in-from-left-2 duration-200">
                      <h3 className="font-black uppercase tracking-tight text-lg">New Community</h3>
                      <p className="text-[10px] font-bold text-on-surface-variant mb-4">Give your new server a name.</p>
                      <input 
                        type="text" 
                        value={newServerName}
                        onChange={e => setNewServerName(e.target.value)}
                        placeholder="e.g. Study Group"
                        className="w-full bg-surface-container-high border-2 border-on-surface rounded-xl px-4 py-3 font-black focus:outline-none focus:ring-4 ring-primary/20 transition-all"
                      />
                    </div>
                  )}
                </div>
              )}
              
              {joinStatus === 'error' && (
                <div className="bg-error/10 border-2 border-error p-3 rounded-xl flex items-center gap-2 text-error animate-in shake duration-300">
                  <Icon name="error" className="w-4 h-4" />
                  <span className="text-[10px] font-black">Something went wrong. Try again!</span>
                </div>
              )}

              {joinStatus === 'success' && (
                <div className="bg-success/10 border-2 border-success p-3 rounded-xl flex items-center gap-2 text-success animate-in slide-in-from-top-2">
                  <Icon name="check_circle" className="w-4 h-4" />
                  <span className="text-[10px] font-black">Success! Done.</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {setShowAddServerModal(false); setJoinStatus('');}}
                  className="flex-1 bg-surface border-2 border-on-surface py-3 rounded-xl font-black text-xs hover:bg-on-surface/5 transition-all"
                >
                  CANCEL
                </button>
                <button 
                  onClick={() => {
                    if (addServerTab === 'join') joinCommunityByCode();
                    else if (createType === 'community') createCommunity();
                    else createChannel();
                  }}
                  disabled={joinStatus === 'loading' || joinStatus === 'success' || (addServerTab === 'join' ? !inviteCodeInput : (createType === 'community' ? !newServerName : !newChannelName))}
                  className={`flex-[2] py-3 rounded-xl font-black brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:translate-x-0 disabled:shadow-none text-xs ${addServerTab === 'join' ? 'bg-secondary text-on-secondary' : 'bg-primary text-white'}`}
                >
                  {joinStatus === 'loading' ? 'PROCESSING...' : (addServerTab === 'join' ? 'JOIN' : 'CREATE')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Manage Member Modal ────────────────────────────────── */}
      {showManageMemberModal && selectedMember && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowManageMemberModal(false)}
        >
          <div 
            className="bg-surface w-full max-w-sm rounded-3xl border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 bg-on-surface text-surface flex items-center gap-4">
              <img src={selectedMember.avatar} className="w-16 h-16 rounded-full border-4 border-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] object-cover" alt="" />
              <div>
                <h3 className="font-black text-xl leading-tight">{selectedMember.name}</h3>
                <p className="text-xs font-bold opacity-60">@{selectedMember.username}</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {joinStatus === 'success' ? (
                <div className="bg-success text-white py-6 rounded-2xl font-black text-center animate-bounce flex flex-col items-center gap-2">
                  <Icon name="check_circle" className="w-8 h-8" />
                  <span>ACTION SUCCESSFUL!</span>
                </div>
              ) : (
                <>
                  {/* Community Role Section */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Community Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => promoteMember(selectedMember.id, 'member')}
                        disabled={selectedMember.role === 'owner'}
                        className={`py-3 rounded-xl font-black text-xs border-2 transition-all ${selectedMember.role === 'member' ? 'bg-on-surface text-surface border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' : 'border-on-surface/10 hover:border-on-surface disabled:opacity-30'}`}
                      >
                        MEMBER
                      </button>
                      <button 
                        onClick={() => promoteMember(selectedMember.id, 'admin')}
                        disabled={selectedMember.role === 'owner'}
                        className={`py-3 rounded-xl font-black text-xs border-2 transition-all ${selectedMember.role === 'admin' ? 'bg-secondary text-on-secondary border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' : 'border-on-surface/10 hover:border-secondary disabled:opacity-30'}`}
                      >
                        ADMIN
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  {selectedMember.role !== 'owner' && (
                    <div className="bg-error/5 border-2 border-dashed border-error/20 p-4 rounded-2xl space-y-3">
                      <p className="text-[10px] font-black text-error uppercase tracking-widest text-center">Danger Zone</p>
                      <button 
                        onClick={() => kickMember(selectedMember.id)}
                        className="w-full bg-error text-white py-3 rounded-xl font-black text-xs hover:scale-[1.02] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                      >
                        KICK MEMBER
                      </button>
                    </div>
                  )}
                </>
              )}

              <button 
                onClick={() => setShowManageMemberModal(false)}
                className="w-full bg-surface border-2 border-on-surface py-4 rounded-xl font-black text-xs hover:bg-on-surface/5 transition-all"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Edit Channel Modal ────────────────────────────────── */}
      {showEditChannelModal && editingChannel && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowEditChannelModal(false)}
        >
          <div 
            className="bg-surface w-full max-w-sm rounded-3xl border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b-4 border-on-surface">
              <h3 className="font-black text-xl uppercase tracking-tight">Channel Settings</h3>
              <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Editing #{editingChannel.name}</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Channel Name</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Icon name={editingChannel.type === 'voice' ? 'volume_up' : 'tag'} className="w-4 h-4 opacity-40" />
                  </div>
                  <input 
                    type="text" 
                    value={editNameInput}
                    onChange={e => setEditNameInput(e.target.value)}
                    className="w-full bg-surface-container-high border-2 border-on-surface rounded-xl pl-10 pr-4 py-3 font-black focus:outline-none focus:ring-4 ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                {joinStatus === 'confirm-delete' ? (
                   <div className="flex-1 flex gap-2 animate-in zoom-in-95">
                    <button 
                      onClick={() => setJoinStatus('')}
                      className="flex-1 bg-surface border-2 border-on-surface py-3 rounded-xl font-black text-xs"
                    >
                      NO
                    </button>
                    <button 
                      onClick={deleteChannel}
                      className="flex-1 bg-error text-white py-3 rounded-xl font-black text-xs"
                    >
                      YES, DELETE
                    </button>
                  </div>
                ) : joinStatus === 'loading' ? (
                  <div className="flex-1 bg-surface-container-high border-2 border-on-surface py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    SAVING...
                  </div>
                ) : joinStatus === 'success' ? (
                  <div className="flex-1 bg-success text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 animate-in zoom-in-95">
                    <Icon name="check_circle" className="w-4 h-4" /> DONE!
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => setJoinStatus('confirm-delete')}
                      className="bg-error/10 border-2 border-error text-error p-3 rounded-xl hover:bg-error hover:text-white transition-all flex items-center justify-center"
                      title="Delete Channel"
                    >
                      <Icon name="delete" className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setShowEditChannelModal(false)}
                      className="flex-1 bg-surface border-2 border-on-surface py-3 rounded-xl font-black text-xs hover:bg-on-surface/5 transition-all"
                    >
                      CANCEL
                    </button>
                    <button 
                      onClick={updateChannel}
                      disabled={!editNameInput.trim() || editNameInput === editingChannel.name}
                      className="flex-[2] bg-primary text-white py-3 rounded-xl font-black brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] transition-all disabled:opacity-50 text-xs"
                    >
                      SAVE CHANGES
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Community Modal ──────────────────────────────── */}
      {showEditCommunityModal && activeServer && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowEditCommunityModal(false)}
        >
          <div 
            className="bg-surface w-full max-w-sm rounded-3xl border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b-4 border-on-surface">
              <h3 className="font-black text-xl uppercase tracking-tight">Community Settings</h3>
              <p className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Managing {activeServer?.name}</p>
            </div>
            
            <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Community Name</label>
                    <input 
                      type="text" 
                      value={editNameInput}
                      onChange={e => setEditNameInput(e.target.value)}
                      className="w-full bg-surface-container-high border-2 border-on-surface rounded-xl px-4 py-3 font-black focus:outline-none focus:ring-4 ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Community Icon</label>
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-2xl bg-surface-container-high border-2 border-on-surface overflow-hidden flex items-center justify-center shrink-0">
                        {editIconInput?.startsWith('http') ? (
                          <img src={editIconInput} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <Icon name={editIconInput || 'groups'} className="w-8 h-8 text-on-surface/20" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="block">
                          <span className="sr-only">Choose profile photo</span>
                          <input type="file" onChange={handleIconUpload} className="block w-full text-xs text-on-surface/40
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-xl file:border-2 file:border-on-surface
                            file:text-xs file:font-black
                            file:bg-surface file:text-on-surface
                            hover:file:bg-on-surface/5 cursor-pointer
                          "/>
                        </label>
                        <p className="text-[10px] text-on-surface/40 font-bold italic">Upload JPG, PNG or GIF. Max 2MB.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Accent Color</label>
                      <input 
                        type="color" 
                        value={editColorInput}
                        onChange={(e) => setEditColorInput(e.target.value)}
                        className="w-full h-12 bg-surface-container-high border-2 border-on-surface rounded-xl p-1 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40">Preset Icon</label>
                      <select 
                        value={!editIconInput?.startsWith('http') ? editIconInput : 'groups'}
                        onChange={(e) => setEditIconInput(e.target.value)}
                        className="w-full h-12 bg-surface-container-high border-2 border-on-surface rounded-xl px-2 font-black text-xs"
                      >
                        <option value="groups">Default</option>
                        <option value="school">School</option>
                        <option value="code">Code</option>
                        <option value="rocket">Rocket</option>
                        <option value="palette">Art</option>
                        <option value="sports_esports">Gaming</option>
                      </select>
                    </div>
                  </div>
                </div>

              <div className="bg-error/5 border-2 border-dashed border-error/20 p-4 rounded-2xl space-y-3">
                <p className="text-[10px] font-black text-error uppercase tracking-widest text-center">Danger Zone</p>
                {joinStatus === 'confirm-delete' ? (
                  <div className="space-y-2 animate-in zoom-in-95">
                    <p className="text-[10px] font-bold text-error text-center">Are you ABSOLUTELY sure? This is permanent.</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setJoinStatus('')}
                        className="flex-1 bg-surface border-2 border-on-surface py-2 rounded-lg font-black text-[10px]"
                      >
                        NO, CANCEL
                      </button>
                      <button 
                        onClick={deleteCommunity}
                        className="flex-1 bg-error text-white py-2 rounded-lg font-black text-[10px]"
                      >
                        YES, DELETE
                      </button>
                    </div>
                  </div>
                ) : joinStatus === 'success' ? (
                  <div className="bg-success text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 animate-in slide-in-from-bottom-2">
                    <Icon name="check_circle" className="w-4 h-4" /> DELETED!
                  </div>
                ) : (
                  <button 
                    onClick={() => setJoinStatus('confirm-delete')}
                    className="w-full bg-error text-white py-3 rounded-xl font-black text-xs hover:bg-error/90 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                  >
                    DELETE COMMUNITY
                  </button>
                )}
              </div>

              {/* Footer Area with Fixed Height to Prevent Jumping */}
              <div className="min-h-[60px] flex flex-col justify-center">
                {joinStatus === 'settings-success' ? (
                  <div className="bg-success text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 animate-in zoom-in-95 duration-300">
                    <Icon name="check_circle" className="w-4 h-4" /> SETTINGS UPDATED!
                  </div>
                ) : (
                  <div className="flex gap-3 animate-in fade-in duration-300">
                    <button 
                      onClick={() => setShowEditCommunityModal(false)}
                      className="flex-1 bg-surface border-2 border-on-surface py-3 rounded-xl font-black text-xs hover:bg-on-surface/5 transition-all"
                    >
                      CANCEL
                    </button>
                    <button 
                      onClick={updateCommunity}
                      disabled={
                        !editNameInput.trim() || 
                        (editNameInput === activeServer?.name && 
                         editColorInput === activeServer?.accent_color && 
                         editIconInput === activeServer?.icon && 
                         joinStatus !== 'loading')
                      }
                      className="flex-[2] bg-primary text-white py-3 rounded-xl font-black brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] transition-all disabled:opacity-50 text-xs"
                    >
                      {joinStatus === 'loading' ? 'SAVING...' : 'SAVE CHANGES'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
