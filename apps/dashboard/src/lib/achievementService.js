import { supabase } from './supabaseClient';
import { showToast } from './toast';

/**
 * Memeriksa dan memberikan achievement kepada user jika memenuhi syarat.
 * @param {string} userId - ID User
 * @param {string} achievementId - ID Lencana (pioneer, first_step, scholar, author, top_student)
 */
export const awardAchievement = async (userId, achievementId) => {
  try {
    // 1. Cek apakah user sudah punya lencana ini
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .maybeSingle();

    if (existing) return; // Sudah punya, tidak perlu diberikan lagi

    // 2. Berikan lencana
    const { error: awardError } = await supabase
      .from('user_achievements')
      .insert({ user_id: userId, achievement_id: achievementId });

    if (awardError) throw awardError;

    // 3. Ambil detail lencana untuk notifikasi
    const { data: achievement } = await supabase
      .from('achievements')
      .select('title')
      .eq('id', achievementId)
      .single();

    // 4. Kirim notifikasi sistem (Tabel notifications)
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Lencana Baru Diraih! 🎉',
      content: `Selamat! Kamu mendapatkan lencana "${achievement?.title || achievementId}". Cek di halaman Achievements!`,
      type: 'achievement',
      link_to: '/achievements'
    });

    showToast(`Selamat! Kamu mendapatkan lencana ${achievement?.title || achievementId}! 🏆`, 'success');

  } catch (error) {
    console.error('Error awarding achievement:', error);
  }
};

/**
 * Melakukan pengecekan menyeluruh terhadap syarat lencana
 */
export const checkAchievements = async (userId) => {
  if (!userId) return;

  // 1. Cek Pioneer (Selalu berikan jika belum ada)
  await awardAchievement(userId, 'pioneer');

  // 2. Cek First Step & Top Student (Berdasarkan Enrollments)
  const { data: enrolls } = await supabase.from('enrollments').select('progress').eq('user_id', userId);
  if (enrolls && enrolls.length >= 1) await awardAchievement(userId, 'first_step');
  if (enrolls && enrolls.length >= 5) await awardAchievement(userId, 'top_student');
  
  // 3. Cek Scholar (Berdasarkan Kursus Selesai)
  if (enrolls && enrolls.some(e => e.progress >= 100)) await awardAchievement(userId, 'scholar');

  // 4. Cek Author (Berdasarkan Postingan Blog)
  const { count: postCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId);
  
  if (postCount >= 1) await awardAchievement(userId, 'author');
};
