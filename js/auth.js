// File: js/auth.js
// Deskripsi: Skrip masuk, daftar, sesi, dan foto profil.
const AUTH_KEY = 'usk_bookstore_auth';
const USERS_KEY = 'usk_bookstore_users';
const PROFILE_PHOTOS_KEY = 'usk_bookstore_profile_photos';
const AUTH_API_URL = 'api/auth.php';

// Akun bawaan admin dan pengguna.
const DEFAULT_USERS = [
  {
    id: '1',
    name: 'Admin',
    email: 'admin@usk.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Safhira Ardelia.P',
    email: 'user@usk.com',
    password: 'user123',
    role: 'user',
  },
];

// Menyiapkan daftar pengguna awal.
function initUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return;
  }

  const users = JSON.parse(localStorage.getItem(USERS_KEY));
  const demoUser = users.find((u) => u.email === 'user@usk.com');
  if (demoUser && demoUser.name === 'John Doe') {
    demoUser.name = 'Safhira Ardelia.P';
    saveUsers(users);
  }

  const current = getCurrentUser();
  if (current?.email === 'user@usk.com' && current.name === 'John Doe') {
    setCurrentUser({ ...current, name: 'Safhira Ardelia.P' });
  }
}

// Mengambil seluruh data pengguna.
function getUsers() {
  initUsers();
  return JSON.parse(localStorage.getItem(USERS_KEY));
}

// Menyimpan daftar pengguna.
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Mengambil akun yang sedang masuk.
function getCurrentUser() {
  const data = localStorage.getItem(AUTH_KEY);
  return data ? JSON.parse(data) : null;
}

// Menyimpan sesi akun yang sedang masuk.
function setCurrentUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

// Mengeluarkan akun dan kembali ke halaman awal.
function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = 'index.html';
}

// Memastikan halaman hanya dibuka peran yang diizinkan.
function requireAuth(allowedRoles = []) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'daftar.html?need=1';
    return null;
  }
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    window.location.href = user.role === 'admin' ? 'pengelola.html' : 'pengguna.html';
    return null;
  }
  return user;
}

// Mengarahkan pengunjung yang belum masuk ke halaman daftar.
function requireAccount(message) {
  const user = getCurrentUser();
  if (user) return user;
  const query = message ? `?need=1&msg=${encodeURIComponent(message)}` : '?need=1';
  window.location.href = `daftar.html${query}`;
  return null;
}

// Mengirim permintaan masuk atau daftar ke server.
async function requestAuthApi(action, payload) {
  try {
    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: 'Tidak dapat terhubung ke server XAMPP. Pastikan Apache dan MySQL aktif.',
    };
  }
}

// Memeriksa email serta kata sandi, lalu masuk ke akun.
async function signIn(email, password) {
  const serverResult = await requestAuthApi('signin', { email, password });
  if (serverResult.success) {
    setCurrentUser(serverResult.user);
    return { success: true, user: serverResult.user };
  }

  const users = getUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return { success: false, message: serverResult.message || 'Email atau password salah.' };
  }

  const session = { id: user.id, name: user.name, email: user.email, role: user.role };
  setCurrentUser(session);
  return { success: true, user: session };
}

// Mendaftarkan akun pengguna baru.
async function signUp(name, email, password) {
  // Registrasi hanya untuk role user — tidak ada pilihan admin.
  const serverResult = await requestAuthApi('signup', { name, email, password, role: 'user' });
  if (serverResult.success) {
    localStorage.removeItem(AUTH_KEY);
    return { success: true };
  }

  const users = getUsers();
  if (users.some((u) => u.email === email)) {
    return { success: false, message: serverResult.message || 'Email sudah terdaftar.' };
  }
  if (password.length < 6) {
    return { success: false, message: serverResult.message || 'Password minimal 6 karakter.' };
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
    role: 'user',
  };
  users.push(newUser);
  saveUsers(users);
  localStorage.removeItem(AUTH_KEY);

  return { success: true };
}

// Mengambil inisial nama untuk avatar.
function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Mengambil semua foto profil yang tersimpan.
function getProfilePhotos() {
  return JSON.parse(localStorage.getItem(PROFILE_PHOTOS_KEY) || '{}');
}

// Mengambil foto profil satu pengguna.
function getProfilePhoto(userId) {
  return getProfilePhotos()[userId] || null;
}

// Menyimpan foto profil.
function setProfilePhoto(userId, dataUrl) {
  const photos = getProfilePhotos();
  photos[userId] = dataUrl;
  localStorage.setItem(PROFILE_PHOTOS_KEY, JSON.stringify(photos));
}

// Menghapus foto profil.
function removeProfilePhoto(userId) {
  const photos = getProfilePhotos();
  delete photos[userId];
  localStorage.setItem(PROFILE_PHOTOS_KEY, JSON.stringify(photos));
}

// Menampilkan foto atau inisial pada avatar.
function applyAvatar(element, user) {
  if (!element || !user) return;

  const photo = getProfilePhoto(user.id);
  element.classList.toggle('has-photo', Boolean(photo));
  element.textContent = '';
  element.innerHTML = '';

  if (photo) {
    const img = document.createElement('img');
    img.src = photo;
    img.alt = user.name;
    element.appendChild(img);
  } else {
    element.textContent = getInitials(user.name);
  }

  element.title = user.name;
}

// Memasang tombol tampil dan sembunyi pada kata sandi.
function initPasswordToggles(root = document) {
  const eyeOpen =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  const eyeOff =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

  root.querySelectorAll('.password-field').forEach((wrap) => {
    const input = wrap.querySelector('input');
    const button = wrap.querySelector('.password-toggle');
    if (!input || !button || button.dataset.bound === '1') return;
    button.dataset.bound = '1';
    button.innerHTML = eyeOpen;
    button.setAttribute('aria-label', 'Tampilkan password');
    button.type = 'button';

    button.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.innerHTML = show ? eyeOff : eyeOpen;
      button.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
      button.setAttribute('aria-pressed', show ? 'true' : 'false');
    });
  });
}

initUsers();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initPasswordToggles());
} else {
  initPasswordToggles();
}

