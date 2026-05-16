import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';
import Icon from '../components/Icon';

import { useUserProfile } from '../context/UserProfileContext';

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const isGuest = profile.isGuest;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data?.user?.id));
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setPost(data);
        // Increment view count (fire-and-forget, don't block UI)
        supabase
          .from('posts')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', id)
          .then(({ error: updErr }) => {
            if (updErr) console.error('[BlogPost] views increment error:', updErr);
          });
      }
      setLoading(false);
    };
    fetchPost();
  }, [id]);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const executeDelete = async () => {
    await supabase.from('posts').delete().eq('id', id);
    navigate('/blog');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-14 h-14 border-4 border-on-surface border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex h-screen items-center justify-center bg-background flex-col gap-4">
        <Icon name="article" className="w-20 h-20 opacity-20" />
        <h2 className="font-headline-lg">Artikel tidak ditemukan</h2>
        <button onClick={() => navigate('/blog')} className="px-6 py-2 bg-primary text-white rounded-lg border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          Kembali ke Blog
        </button>
      </div>
    );
  }

  const paragraphs = post.content.split('\n').filter(p => p.trim());
  const displayParagraphs = isGuest ? paragraphs.slice(0, 3) : paragraphs;

  return (
    <div className="bg-background text-on-surface font-plus-jakarta flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Hero Image */}
        <div className="relative h-72 md:h-96 border-b-4 border-on-surface overflow-hidden">
          <img
            src={post.image_url || 'https://images.unsplash.com/photo-1454165833767-01754ee98221?auto=format&fit=crop&q=80&w=1200'}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {/* Back Button */}
          <button
            onClick={() => navigate('/blog')}
            className="absolute top-6 left-6 flex items-center gap-2 bg-white/90 text-on-surface border-2 border-on-surface px-4 py-2 rounded-lg font-label-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <Icon name="arrow_back" className="w-5 h-5" />
            <span className="text-sm">Kembali</span>
          </button>
          {/* Category badge */}
          <div className="absolute bottom-6 left-6">
            <span className="bg-primary-container text-on-primary-container border-2 border-on-surface px-3 py-1 font-label-bold text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {post.category}
            </span>
          </div>
        </div>

        {/* Article Content */}
        <article className="max-w-3xl mx-auto px-6 md:px-10 py-10 pb-24">
          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-on-surface-variant font-bold mb-4">
            <span>
              {formatDate(post.created_at)}
              {post.updated_at && post.updated_at !== post.created_at && (
                <span className="italic opacity-70 ml-2">(Diedit)</span>
              )}
            </span>
            <span>·</span>
            <span>{Math.ceil(post.content.split(' ').length / 200)} min baca</span>
          </div>

          {/* Title */}
          <h1 className="font-headline-xl text-on-background leading-tight mb-8 text-3xl md:text-4xl font-black">
            {post.title}
          </h1>

          {/* Divider */}
          <div className="border-t-4 border-on-surface mb-8" />

          {/* Body */}
          <div className="prose prose-lg max-w-none text-on-surface leading-relaxed space-y-6 relative">
            {displayParagraphs.map((paragraph, i) => (
              <p key={i} className="font-body-lg text-on-surface-variant text-lg leading-8">
                {paragraph}
              </p>
            ))}

            {isGuest && (
              <div className="relative">
                {/* The blurred paragraph part */}
                <p className="font-body-lg text-on-surface-variant text-lg leading-8 blur-[4px] select-none opacity-40">
                  {paragraphs[3] || 'Lanjutan konten artikel yang sangat menarik dan mendalam untuk dibaca sampai tuntas...'}
                </p>
                
                {/* The login prompt card */}
                <div className="absolute -top-10 left-0 right-0 pt-20 pb-10 bg-gradient-to-t from-background via-background/95 to-transparent flex flex-col items-center text-center px-4">
                  <div className="bg-surface border-4 border-on-surface p-8 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm space-y-4">
                    <div className="w-16 h-16 bg-secondary-container text-secondary rounded-full flex items-center justify-center mx-auto border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <Icon name="lock" className="w-8 h-8" />
                    </div>
                    <h3 className="font-headline-md text-xl font-black">Lanjutkan Membaca</h3>
                    <p className="text-sm font-bold text-on-surface-variant">
                      Daftar atau masuk untuk membaca seluruh artikel ini dan ribuan artikel bermanfaat lainnya.
                    </p>
                    <div className="flex flex-col gap-2 pt-2">
                      <button 
                        onClick={() => navigate('/signup')}
                        className="bg-primary text-white font-black py-3 rounded-lg border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                      >
                        Daftar Gratis
                      </button>
                      <button 
                        onClick={() => navigate('/login')}
                        className="text-on-surface font-bold text-sm hover:underline"
                      >
                        Masuk
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Share / Actions */}
          {!isGuest && (
            <div className="border-t-4 border-on-surface mt-12 pt-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 border-2 border-on-surface px-4 py-2 rounded-lg font-label-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <Icon name="favorite" className="w-4 h-4 text-error" />
                  Suka
                </button>
                <button className="flex items-center gap-2 border-2 border-on-surface px-4 py-2 rounded-lg font-label-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <Icon name="share" className="w-4 h-4" />
                  Bagikan
                </button>
                <button className="flex items-center gap-2 border-2 border-on-surface px-4 py-2 rounded-lg font-label-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <Icon name="bookmark" className="w-4 h-4" />
                  Simpan
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                {currentUserId === post.author_id && (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => navigate(`/edit-post/${post.id}`)}
                      className="flex items-center gap-2 border-2 border-primary text-primary px-4 py-2 rounded-lg font-label-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      <Icon name="edit" className="w-4 h-4" />
                      Edit
                    </button>
                    <button 
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-2 border-2 border-error text-error px-4 py-2 rounded-lg font-label-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-error-container"
                    >
                      <Icon name="delete" className="w-4 h-4" />
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => navigate('/blog')}
              className="flex items-center gap-2 text-primary font-label-bold text-sm hover:underline"
            >
              <Icon name="arrow_back" className="w-4 h-4" />
              Kembali ke Blog
            </button>
          </div>
        </article>
      </main>

      {/* Custom Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-plus-jakarta">
          <div className="bg-surface border-4 border-on-surface w-full max-w-sm rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col">
            <div className="bg-error p-6 flex flex-col items-center justify-center text-on-error border-b-4 border-on-surface">
              <Icon name="warning" className="w-16 h-16 mb-2" />
              <h3 className="font-headline-md font-black text-center text-xl">Hapus Artikel?</h3>
            </div>
            <div className="p-6 bg-surface-container-lowest text-center">
              <p className="font-body-lg text-on-surface-variant font-bold">
                Tindakan ini tidak dapat dibatalkan. Artikel ini akan dihapus secara permanen dari Harin.
              </p>
            </div>
            <div className="flex gap-4 p-6 pt-0 bg-surface-container-lowest">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 border-2 border-on-surface text-on-surface font-label-bold rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all bg-surface active:translate-x-0 active:translate-y-0 active:shadow-none"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 px-4 py-3 border-2 border-on-surface text-on-error font-label-bold rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all bg-error active:translate-x-0 active:translate-y-0 active:shadow-none"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPost;
