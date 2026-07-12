import React, { useState, useEffect, useRef } from 'react';
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
  const { profile } = useUserProfile();
  const [servers, setServers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);
  const [dms, setDms] = useState([]);
  const [activeServer, setActiveServer] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [view, setView] = useState('server'); // 'server' or 'dm'
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState('voice'); // 'voice' or 'video'
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState({}); // { userId: status }
  const [userRole, setUserRole] = useState('member'); // 'owner', 'admin', 'member'
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

  const scrollRef = useRef(null);

  // 1. Fetch Communities (Servers)
  useEffect(() => {
    const fetchServers = async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (data && data.length > 0) {
        setServers(data);
        setActiveServer(data[0]);
      }
      setIsLoading(false);
    };

    fetchServers();
  }, []);

  const fetchServers = async () => {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (data && data.length > 0) {
      setServers(data);
      if (!activeServer) setActiveServer(data[0]);
    }
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

  const fetchMembers = async () => {
    if (!profile?.id || !activeServer?.id) return;
    const { data } = await supabase
      .from('community_members')
      .select('*, profiles:user_id(full_name, avatar_url, username)')
      .eq('community_id', activeServer.id);
    
    if (data) {
      setMembers(data.map(m => ({
        id: m.user_id,
        name: m.profiles?.full_name || 'Anonymous',
        username: m.profiles?.username || '',
        avatar: m.profiles?.avatar_url || 'https://i.pravatar.cc/150?u=' + m.user_id,
        role: m.role
      })));

      const me = data.find(m => m.user_id === profile.id);
      if (me) setUserRole(me.role);
    }

    const { data: chanAdmins } = await supabase
      .from('channel_admins')
      .select('channel_id')
      .eq('user_id', profile.id);
    
    if (chanAdmins) setAdminChannels(chanAdmins.map(a => a.channel_id));
  };

  // 2. Fetch Data for active server
  useEffect(() => {
    if (!activeServer) return;
    fetchChannels();
    fetchMembers();
  }, [activeServer, profile?.id]);

  // 2.5 Fetch Friends (for Direct Messages)
  useEffect(() => {
    const fetchFriends = async () => {
      const { data } = await supabase
        .from('friends')
        .select('friend_id, profiles:friend_id(full_name, avatar_url)')
        .eq('user_id', profile?.id);
      
      if (data) {
        setDms(data.map(f => ({
          id: f.friend_id,
          name: f.profiles?.full_name || 'Anonymous',
          avatar: f.profiles?.avatar_url || 'https://i.pravatar.cc/150?u=' + f.friend_id,
          status: 'online'
        })));
      }
    };

    if (profile?.id) fetchFriends();
  }, [profile, joinStatus]); // Refetch on join/add success

  // 3. Fetch Messages and Subscribe to Realtime + Presence
  useEffect(() => {
    if (!profile?.id) return;

    // 3.1 Global Presence Channel (for Friends & Status)
    const globalChannel = supabase.channel('global_presence', {
      config: { presence: { key: profile.id } }
    });

    globalChannel
      .on('presence', { event: 'sync' }, () => {
        const state = globalChannel.presenceState();
        const online = {};
        Object.keys(state).forEach(key => { online[key] = 'online'; });
        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await globalChannel.track({
            user_id: profile.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    // 3.2 Channel Specific Messages
    let messageChannel = null;
    if (activeChannel && activeChannel.type !== 'voice') {
      const fetchMessages = async () => {
        const { data } = await supabase
          .from('community_messages')
          .select('*, profiles:user_id(full_name, avatar_url)')
          .eq('channel_id', activeChannel.id)
          .order('created_at', { ascending: true })
          .limit(50);
        
        if (data) {
          setMessages(data.map(m => ({
            id: m.id,
            user: m.profiles?.full_name || 'Anonymous',
            text: m.text,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatar: m.profiles?.avatar_url || 'https://i.pravatar.cc/150?u=' + m.user_id,
            userId: m.user_id
          })));
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

    return () => {
      supabase.removeChannel(globalChannel);
      if (messageChannel) supabase.removeChannel(messageChannel);
    };
  }, [activeChannel, profile?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !activeChannel) return;

    const textToSend = input;
    setInput(''); // Optimistic clear

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

  const startCall = (type) => {
    setCallType(type);
    setIsInCall(true);
  };

  const copyInviteCode = (code) => {
    if (code) {
      navigator.clipboard.writeText(code);
    }
  };

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

    try {
      // Use the RPC function we created in SQL
      const { data, error } = await supabase.rpc('join_community', { invite_code_input: inviteCodeInput });

      if (error) throw error;

      if (data) {
        setJoinStatus('success');
        setInviteCodeInput('');
        await fetchServers(); // Refresh server list
        // Find the new server and set it active
        const { data: newServer } = await supabase.from('communities').select('*').eq('id', data).single();
        if (newServer) setActiveServer(newServer);
        
        setTimeout(() => {
          setShowJoinModal(false);
          setJoinStatus('');
        }, 1500);
      } else {
        setJoinStatus('error');
      }
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

      <main className="flex-1 flex overflow-hidden">
        
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
            <button
              key={server.id}
              onClick={() => { setActiveServer(server); setView('server'); }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 group relative overflow-hidden ${activeServer?.id === server.id && view === 'server' ? 'border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-on-surface/10 hover:rounded-xl hover:border-on-surface'}`}
              style={{ backgroundColor: (server.accent_color || '#3b82f6') + (activeServer?.id === server.id && view === 'server' ? '' : '20') }}
            >
              {server.icon?.startsWith('http') ? (
                <img src={server.icon} className="w-full h-full object-cover" alt="" />
              ) : (
                <Icon name={server.icon || 'groups'} className={`w-6 h-6 ${activeServer?.id === server.id && view === 'server' ? 'text-white' : ''}`} style={{ color: activeServer?.id === server.id && view === 'server' ? 'white' : (server.accent_color || '#3b82f6') }} />
              )}
              
              <div className="absolute left-16 px-3 py-1.5 bg-on-surface text-surface text-xs font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                {server.name}
              </div>
            </button>
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
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg font-label-bold text-sm transition-all ${activeChannel?.id === ch.id ? 'bg-on-surface text-surface' : 'text-on-surface-variant hover:bg-on-surface/5'}`}
                        >
                          <Icon name="tag" className="w-4 h-4 opacity-60" />
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

                  {/* Voice Channels */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between mb-2 px-2">
                      <p className="text-[10px] font-black uppercase text-on-surface/40 tracking-widest">Voice Channels</p>
                    </div>
                    {channels.filter(ch => ch.type === 'voice').map(ch => (
                      <div key={ch.id} className="group relative">
                        <button
                          onClick={() => { setActiveChannel(ch); setIsInCall(true); }}
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
                  <button
                    key={dm.id}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-on-surface/5 transition-all group"
                  >
                    <div className="relative">
                      <img src={dm.avatar} className="w-8 h-8 rounded-full border border-on-surface/10 object-cover" alt="" />
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-container ${onlineUsers[dm.id] === 'online' ? 'bg-success' : 'bg-on-surface/30'}`} />
                    </div>
                    <span className="font-label-bold text-sm text-on-surface-variant group-hover:text-on-surface truncate">{dm.name}</span>
                  </button>
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
          
          {/* Top Bar */}
          <header className="h-16 px-6 flex items-center justify-between border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] z-10 bg-surface">
            <div className="flex items-center gap-3">
              {view === 'dm' ? <UserIcon className="w-6 h-6 text-on-surface/40" /> : <Icon name={activeChannel?.type === 'voice' ? 'volume_up' : 'tag'} className="w-6 h-6 text-on-surface/40" />}
              <div className="flex flex-col">
                <h1 className="font-headline-sm font-black leading-none">
                  {view === 'dm' ? 'Direct Messages' : (activeChannel?.name || 'Select a Channel')}
                </h1>
                <p className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">
                  {view === 'dm' ? 'Private Conversations' : activeServer?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {activeServer && (
                <button 
                  onClick={() => setShowInviteModal(true)} 
                  className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-xl font-black text-xs hover:bg-primary hover:text-white transition-all border-2 border-primary/20"
                >
                  <Icon name="person_add" className="w-4 h-4" />
                  INVITE
                </button>
              )}
              {activeChannel && (
                <>
                  <button onClick={() => startCall('voice')} className="p-2 hover:bg-on-surface/5 rounded-full transition-colors"><Icon name="call" className="w-5 h-5" /></button>
                  <button onClick={() => startCall('video')} className="p-2 hover:bg-on-surface/5 rounded-full transition-colors"><Icon name="videocam" className="w-5 h-5" /></button>
                  <button className="p-2 hover:bg-on-surface/5 rounded-full transition-colors hidden sm:block"><Icon name="push_pin" className="w-5 h-5" /></button>
                  <div className="w-[1px] h-6 bg-on-surface/10 mx-1 hidden sm:block" />
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

          {/* Call Overlay (Remains same UI) */}
          {isInCall && (
            <div className="flex-1 bg-black flex flex-col relative overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 bg-surface-container-lowest flex items-center justify-center group">
                  {callType === 'video' ? (
                    <img src={profile.avatar || 'https://i.pravatar.cc/150?u=me'} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <img src={profile.avatar || 'https://i.pravatar.cc/150?u=me'} className="w-32 h-32 rounded-full border-4 border-primary animate-pulse" alt="" />
                      <span className="font-black text-white">{profile.fullName || 'You'}</span>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white">You</div>
                </div>
                <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 bg-surface-container-lowest flex items-center justify-center group">
                  {members.filter(m => m.id !== profile?.id).length > 0 ? (
                    <div className="flex flex-col items-center gap-4">
                      <img src={members.filter(m => m.id !== profile?.id)[0].avatar} className="w-32 h-32 rounded-full border-4 border-white/20 object-cover" alt="" />
                      <span className="font-black text-white">{members.filter(m => m.id !== profile?.id)[0].name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 opacity-40">
                      <div className="w-32 h-32 rounded-full border-4 border-dashed border-white/20 flex items-center justify-center">
                        <Icon name="person_add" className="w-12 h-12 text-white" />
                      </div>
                      <span className="font-black text-white italic">Waiting for others...</span>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white">
                    {members.filter(m => m.id !== profile?.id).length > 0 ? 'Peer' : 'Room'}
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-surface-container-lowest/80 backdrop-blur-xl border-2 border-white/10 p-4 rounded-3xl shadow-2xl">
                <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"><Icon name="mic" className="text-white" /></button>
                <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"><Icon name="videocam" className="text-white" /></button>
                <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"><Icon name="screen_share" className="text-white" /></button>
                <button 
                  onClick={() => setIsInCall(false)}
                  className="w-16 h-12 rounded-2xl bg-error text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  <Icon name="call_end" />
                </button>
              </div>
            </div>
          )}

          {/* Message History */}
          {!isInCall && activeChannel && activeChannel.type === 'text' && (
            <div className={`flex-1 overflow-y-auto p-6 space-y-6 ${view === 'dm' ? 'flex flex-col justify-center items-center' : ''}`} ref={scrollRef}>
              <div className={`pb-4 ${view === 'dm' ? 'flex flex-col items-center text-center' : 'border-b-2 border-on-surface/5'}`}>
                <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {view === 'dm' ? <UserIcon className="w-8 h-8 text-on-surface/40" /> : <Icon name="tag" className="w-8 h-8 text-on-surface/40" />}
                </div>
                {view === 'dm' ? (
                  <>
                    <h2 className="text-3xl font-black mb-2 uppercase tracking-tight">Your Direct Messages</h2>
                    <p className="text-sm text-on-surface-variant max-w-sm font-bold opacity-60">Select a friend from the left sidebar to start a private conversation.</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-black mb-1">Welcome to #{activeChannel?.name}!</h2>
                    <p className="text-sm text-on-surface-variant">This is the start of the #{activeChannel?.name} channel.</p>
                  </>
                )}
              </div>

              {messages.map((m, i) => (
                <div key={m.id} className={`flex gap-4 group ${i > 0 && messages[i-1].userId === m.userId ? '!-mt-5' : ''}`}>
                  {i === 0 || messages[i-1].userId !== m.userId ? (
                    <img src={m.avatar} className="w-10 h-10 rounded-xl border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 object-cover" alt="" />
                  ) : (
                    <div className="w-10 shrink-0 flex items-center justify-end pr-2">
                      <span className="text-[10px] font-black text-on-surface/20 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">{m.time.split(' ')[0]}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    {(i === 0 || messages[i-1].userId !== m.userId) && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-black text-sm hover:underline cursor-pointer">{m.user}</span>
                        <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">{m.time}</span>
                      </div>
                    )}
                    <p className="text-sm font-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              ))}
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
          {!isInCall && activeChannel?.type === 'text' && (
            <div className="p-6 pt-0">
              <div className="bg-surface-container border-4 border-on-surface rounded-2xl p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-within:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] focus-within:translate-x-[-2px] focus-within:translate-y-[-2px] transition-all duration-200">
                <div className="flex items-center gap-2">
                  <button className="w-10 h-10 flex items-center justify-center hover:bg-on-surface/10 rounded-xl transition-colors group">
                    <Icon name="add_circle" className="w-6 h-6 text-on-surface opacity-60 group-hover:opacity-100" />
                  </button>
                  <input 
                    type="text" 
                    placeholder={`Message #${activeChannel?.name || 'channel'}`} 
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
                      <div className="flex items-center gap-1.5">
                        <span className={`font-black text-sm truncate ${m.role === 'owner' ? 'text-primary' : m.role === 'admin' ? 'text-secondary' : 'text-on-surface-variant'}`}>{m.name}</span>
                        {m.role === 'owner' && <Icon name="stars" className="w-3 h-3 text-primary" />}
                        {m.role === 'admin' && <Icon name="verified_user" className="w-3 h-3 text-secondary" />}
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
                      onClick={() => copyInviteCode(profile?.friendCode)}
                      className="bg-on-surface text-surface px-4 rounded-xl font-black text-[10px]"
                    >
                      COPY
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
                    className="bg-on-surface text-surface px-4 rounded-xl font-black text-[10px]"
                  >
                    COPY
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
                      onChange={e => setInviteCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. h8a3k2L9"
                      className="w-full bg-surface-container-high border-2 border-on-surface rounded-xl px-4 py-3 font-black uppercase tracking-widest focus:outline-none focus:ring-4 ring-secondary/20 transition-all text-center"
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
