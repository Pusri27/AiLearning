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

  const icon = isError 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`;

  el.innerHTML = `
    <span style="display:flex;align-items:center;justify-content:center">${icon}</span>
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

export const showConfirm = (msg) => {
  return new Promise((resolve) => {
    // Remove existing confirm if any
    const existing = document.getElementById('harin-confirm-dialog');
    if (existing) existing.remove();

    // Create backdrop wrapper
    const backdrop = document.createElement('div');
    backdrop.id = 'harin-confirm-dialog';
    Object.assign(backdrop.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(26, 28, 28, 0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: '999999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      opacity: '0',
      transition: 'opacity 0.2s ease',
    });

    // Create dialog container
    const dialog = document.createElement('div');
    Object.assign(dialog.style, {
      backgroundColor: '#ffffff',
      border: '4px solid #1a1a1a',
      borderRadius: '24px',
      boxShadow: '8px 8px 0px 0px rgba(26, 28, 28, 1)',
      padding: '32px',
      maxWidth: '440px',
      width: '90%',
      transform: 'scale(0.9)',
      transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    });

    // Title / Warning Icon Header
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    });

    const iconWrapper = document.createElement('div');
    Object.assign(iconWrapper.style, {
      backgroundColor: '#FFE4E6',
      border: '2px solid #E11D48',
      borderRadius: '12px',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#E11D48',
      flexShrink: '0',
    });
    iconWrapper.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    `;

    const title = document.createElement('h3');
    title.textContent = 'Konfirmasi Tindakan';
    Object.assign(title.style, {
      margin: '0',
      fontSize: '20px',
      fontWeight: '900',
      color: '#1a1a1a',
    });

    header.appendChild(iconWrapper);
    header.appendChild(title);

    // Message
    const message = document.createElement('p');
    message.textContent = msg;
    Object.assign(message.style, {
      margin: '0',
      fontSize: '15px',
      fontWeight: '700',
      color: '#4b5563',
      lineHeight: '1.5',
    });

    // Buttons Container
    const btnContainer = document.createElement('div');
    Object.assign(btnContainer.style, {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
    });

    // Cancel Button
    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Batal';
    Object.assign(btnCancel.style, {
      padding: '10px 20px',
      borderRadius: '12px',
      border: '2px solid #1a1a1a',
      backgroundColor: '#ffffff',
      color: '#1a1a1a',
      fontWeight: '800',
      fontSize: '14px',
      cursor: 'pointer',
      boxShadow: '2px 2px 0px 0px rgba(26,28,28,1)',
      transition: 'all 0.1s ease',
    });
    btnCancel.onmouseenter = () => btnCancel.style.backgroundColor = '#f3f4f6';
    btnCancel.onmouseleave = () => btnCancel.style.backgroundColor = '#ffffff';

    // Confirm Button
    const btnConfirm = document.createElement('button');
    btnConfirm.textContent = 'Yakin, Hapus';
    if (!msg.toLowerCase().includes('hapus') && !msg.toLowerCase().includes('kick')) {
      btnConfirm.textContent = 'Ya, Lanjutkan';
    }
    Object.assign(btnConfirm.style, {
      padding: '10px 20px',
      borderRadius: '12px',
      border: '2px solid #1a1a1a',
      backgroundColor: '#FF6B4A',
      color: '#1a1a1a',
      fontWeight: '800',
      fontSize: '14px',
      cursor: 'pointer',
      boxShadow: '2px 2px 0px 0px rgba(26,28,28,1)',
      transition: 'all 0.1s ease',
    });
    btnConfirm.onmouseenter = () => btnConfirm.style.backgroundColor = '#ff542e';
    btnConfirm.onmouseleave = () => btnConfirm.style.backgroundColor = '#FF6B4A';

    const cleanUp = (result) => {
      backdrop.style.opacity = '0';
      dialog.style.transform = 'scale(0.9)';
      setTimeout(() => {
        backdrop.remove();
        resolve(result);
      }, 200);
    };

    btnCancel.onclick = () => cleanUp(false);
    btnConfirm.onclick = () => cleanUp(true);

    const escListener = (e) => {
      if (e.key === 'Escape') {
        window.removeEventListener('keydown', escListener);
        cleanUp(false);
      }
    };
    window.addEventListener('keydown', escListener);

    btnContainer.appendChild(btnCancel);
    btnContainer.appendChild(btnConfirm);

    dialog.appendChild(header);
    dialog.appendChild(message);
    dialog.appendChild(btnContainer);

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    requestAnimationFrame(() => {
      backdrop.style.opacity = '1';
      dialog.style.transform = 'scale(1)';
    });
  });
};
