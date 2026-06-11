import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useUserProfile } from '../context/UserProfileContext';
import Icon from './Icon';
import { showToast } from '../lib/toast';

const NotificationDropdown = () => {
  const { profile } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const uid = session.user.id;
    const userCreatedAt = session.user.created_at;

    // Fetch notifications and check if they are in notification_reads
    let query = supabase
      .from('notifications')
      .select('*, notification_reads!left(user_id)');

    if (profile?.role === 'teacher') {
      // Teachers only see notifications explicitly sent to them, excluding student-centric ones
      query = query.eq('user_id', uid).neq('type', 'achievement').neq('type', 'blog');
    } else {
      // Students see theirs + broadcasts
      query = query.or(`user_id.eq.${uid},user_id.is.null`);
    }

    const { data: notifs, error } = await query
      .gte('created_at', userCreatedAt)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && notifs) {
      // Map data: mark as read if notification_reads has an entry for current user
      const formatted = notifs.map(n => ({
        ...n,
        is_read_by_me: n.notification_reads && n.notification_reads.some(r => r.user_id === uid)
      }));
      setNotifications(formatted);
      setUnreadCount(formatted.filter(n => !n.is_read_by_me).length);
    }
  };

  useEffect(() => {
    // Request native notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (profile?.role !== undefined) {
      fetchNotifications();
    }

    // Dengarkan event kustom dari listener global untuk me-refresh list secara real-time
    const handleNewNotif = () => {
      console.log("🔔 [NotificationDropdown] New notification event received, reloading list...");
      fetchNotifications();
    };
    window.addEventListener('harin-new-notification', handleNewNotif);

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('harin-new-notification', handleNewNotif);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profile?.role, profile?.id]);

  const markAsRead = async (notifId) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Update local state instantly
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read_by_me: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Persist to notification_reads table
    await supabase
      .from('notification_reads')
      .upsert({ user_id: session.user.id, notification_id: notifId }, { onConflict: 'user_id,notification_id' });
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Baru saja';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m yang lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}j yang lalu`;
    return new Date(date).toLocaleDateString();
  };

  const getIcon = (type) => {
    switch(type) {
      case 'course': return 'school';
      case 'blog': return 'article';
      case 'achievement': return 'military_tech';
      default: return 'notifications';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className="relative p-2 border-2 border-on-surface bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      >
        <Icon name="notifications" className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-error text-on-error text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-on-surface">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 bg-surface-container-lowest border-2 border-on-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-[100] max-h-[480px] flex flex-col">
          <div className="p-4 border-b-2 border-on-surface bg-surface-container-low flex justify-between items-center">
            <h3 className="font-label-bold uppercase text-xs tracking-wider">Notifikasi Terbaru</h3>
            <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform">
              <Icon name="close" className="w-4 h-4" />
            </button>
          </div>

          {('Notification' in window) && Notification.permission !== 'granted' && (
            <div className="p-3 bg-primary-container/20 border-b-2 border-on-surface text-center">
              <button 
                onClick={async () => {
                  const perm = await Notification.requestPermission();
                  if (perm === 'granted') {
                    new Notification("Notifikasi Aktif!", {
                      body: "Kamu akan menerima pemberitahuan langsung di desktop laptopmu.",
                      icon: "/favicon.svg"
                    });
                  }
                  // Force reload list to hide the button
                  fetchNotifications();
                }}
                className="w-full bg-[#FFB800] text-on-background text-[10px] font-black uppercase py-2 px-3 rounded-lg border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                🔔 Aktifkan Notifikasi Desktop
              </button>
            </div>
          )}

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center gap-2 opacity-40">
                <Icon name="notifications_off" className="w-8 h-8" />
                <p className="text-xs font-bold">Tidak ada notifikasi</p>
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    if (!notif.is_read_by_me) markAsRead(notif.id);
                    if (notif.link_to) navigate(notif.link_to);
                    setIsOpen(false);
                  }}
                  className={`p-4 border-b border-on-surface/10 hover:bg-surface-container cursor-pointer transition-colors flex gap-3 ${!notif.is_read_by_me ? 'bg-primary-container/10' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full border-2 border-on-surface bg-surface flex items-center justify-center shrink-0">
                    <Icon name={getIcon(notif.type)} className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black line-clamp-1">{notif.title}</p>
                    <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5 leading-relaxed">{notif.content}</p>
                    <p className="text-[9px] text-on-surface-variant/60 mt-1 font-bold">{getTimeAgo(notif.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t-2 border-on-surface bg-surface-container-low text-center flex justify-between items-center px-4">
            <button className="py-1 text-[10px] font-black uppercase text-primary hover:underline">
              Lihat Semua Notifikasi
            </button>
            <button 
              onClick={() => {
                console.log("🧪 [Test Notif] Button clicked!");
                console.log("🧪 [Test Notif] 'Notification' in window:", 'Notification' in window);
                if ('Notification' in window) {
                  console.log("🧪 [Test Notif] Current permission state:", Notification.permission);
                  if (Notification.permission === 'granted') {
                    console.log("🧪 [Test Notif] Creating Notification object...");
                    try {
                      const n = new Notification("Uji Coba Notifikasi 🧪", {
                        body: "Ini adalah notifikasi uji coba instan dari Harin Learning!",
                        icon: "/favicon.svg"
                      });
                      console.log("🧪 [Test Notif] Created successfully:", n);
                      showToast("Uji Coba Notifikasi Terkirim! 🧪", "success");
                      alert("Notifikasi uji coba dikirim! Jika tidak muncul di pojok layar, silakan periksa:\n1. Focus Mode / Jangan Ganggu (Do Not Disturb) di macOS Anda.\n2. Pengaturan Notifikasi Chrome di System Settings macOS Anda.");
                    } catch (e) {
                      console.error("🧪 [Test Notif] Error creating Notification:", e);
                      alert("Gagal membuat objek Notifikasi: " + e.message);
                    }
                  } else {
                    console.log("🧪 [Test Notif] Requesting permission...");
                    Notification.requestPermission().then(perm => {
                      console.log("🧪 [Test Notif] Permission request result:", perm);
                      if (perm === 'granted') {
                        try {
                          new Notification("Uji Coba Notifikasi 🧪", {
                            body: "Izin berhasil diberikan! Ini notifikasi uji cobamu.",
                            icon: "/favicon.svg"
                          });
                          showToast("Izin Diberikan & Kuis Terkirim! 🧪", "success");
                          alert("Izin berhasil diberikan dan notifikasi uji coba dikirim!");
                        } catch (e) {
                          alert("Izin diberikan, tapi gagal mengirim notifikasi: " + e.message);
                        }
                      } else {
                        alert("Izin notifikasi ditolak oleh browser (Status: " + perm + ").\n\nUntuk mengaktifkannya:\n1. Klik ikon gembok di sebelah kiri URL bar browser Anda.\n2. Ubah opsi 'Notification' menjadi 'Allow'.");
                      }
                    });
                  }
                } else {
                  alert("Browser ini tidak mendukung Notification API.");
                }
              }}
              className="py-1 text-[10px] font-black uppercase text-secondary hover:underline cursor-pointer"
            >
              Test Notifikasi 🧪
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
