/**
 * Harin Learning – Shared Toast & Error Utility
 * Replaces all native alert()/confirm() with friendly in-app messages.
 */

// ── Friendly error mapper ─────────────────────────────────────────
export const friendlyError = (err) => {
  if (!err) return 'Terjadi kesalahan. Silakan coba lagi.';
  const msg = (err?.message || err?.msg || String(err)).toLowerCase();

  if (msg.includes('invalid login') || msg.includes('invalid credentials'))
    return 'Email atau password salah.';
  if (msg.includes('email already') || msg.includes('already registered'))
    return 'Email sudah terdaftar. Gunakan email lain.';
  if (msg.includes('password'))
    return 'Password tidak memenuhi syarat (minimal 6 karakter).';
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch'))
    return 'Koneksi bermasalah. Periksa koneksi internet kamu.';
  if (msg.includes('rate limit') || msg.includes('too many'))
    return 'Terlalu banyak percobaan. Tunggu beberapa menit.';
  if (msg.includes('username') && msg.includes('unique'))
    return 'Username sudah dipakai. Coba username lain.';
  if (msg.includes('jwt') || msg.includes('token') || msg.includes('session expired'))
    return 'Sesi kamu sudah habis. Silakan login ulang.';
  if (msg.includes('row-level') || msg.includes('rls') || msg.includes('permission'))
    return 'Kamu tidak punya izin untuk tindakan ini.';
  if (msg.includes('violates unique') || msg.includes('duplicate key'))
    return 'Data sudah ada atau duplikat. Periksa kembali.';
  if (msg.includes('not found') || msg.includes('does not exist'))
    return 'Data tidak ditemukan. Mungkin sudah dihapus.';
  if (msg.includes('foreign key') || msg.includes('relation'))
    return 'Tidak bisa menghapus data karena masih terkait dengan data lain.';

  // Fallback — never expose raw technical detail
  return 'Sesuatu tidak berjalan dengan baik. Silakan coba lagi.';
};

// ── Minimal DOM toast injector ────────────────────────────────────
// Used in non-React contexts (e.g. plain JS files).
// In React components, use the <Toast /> component from Settings or a shared component.
let _toastTimer = null;

export const showToast = (msg, type = 'success') => {
  // Remove existing toast
  const existing = document.getElementById('harin-toast');
  if (existing) existing.remove();
  clearTimeout(_toastTimer);

  const el = document.createElement('div');
  el.id = 'harin-toast';

  const isError = type === 'error';
  Object.assign(el.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) scale(0.9)',
    zIndex: '99999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '20px 32px',
    borderRadius: '16px',
    border: '4px solid #1a1a1a',
    boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontSize: '16px',
    fontWeight: '900',
    maxWidth: '400px',
    width: '90%',
    backgroundColor: isError ? '#FF6B4A' : '#C4B5FD',
    color: '#1a1a1a',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    opacity: '0',
  });

  el.innerHTML = `
    <span style="font-size:18px">${isError ? '⚠️' : '✅'}</span>
    <span>${msg}</span>
  `;

  document.body.appendChild(el);
  requestAnimationFrame(() => { 
    el.style.opacity = '1'; 
    el.style.transform = 'translate(-50%, -50%) scale(1)';
  });

  _toastTimer = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translate(-50%, -50%) scale(0.9)';
    setTimeout(() => el.remove(), 300);
  }, 3500);
};
