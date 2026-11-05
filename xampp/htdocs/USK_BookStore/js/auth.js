const AUTH_KEY = 'usk_bookstore_auth';
const USERS_KEY = 'usk_bookstore_users';
const PROFILE_PHOTOS_KEY = 'usk_bookstore_profile_photos';
const AUTH_API_URL = 'api/auth.php';

const DEFAULT_USERS = [
  {
    id: '1',
    name: 'Admin',
    email: 'admin@usk.com',
    password: 'admin123',
    role: 'admin',
  },
];

function isDemoExamAccount(value) {
  return /safhira|putri/i.test(String(value || ''));
}

function clearDemoExamData() {
  const flag = 'usk_bookstore_exam_reset';
  if (localStorage.getItem(flag) === '1') return;

  localStorage.setItem('usk_bookstore_orders', '[]');
  localStorage.setItem('usk_bookstore_reviews', '[]');
  localStorage.removeItem('usk_bookstore_chat_messages');
  localStorage.removeItem('usk_bookstore_balances');

  try {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const kept = (Array.isArray(stored) ? stored : []).filter(
      (user) => user && user.email !== 'user@usk.com' && !isDemoExamAccount(user.name) && !isDemoExamAccount(user.email)
    );
    if (!kept.some((user) => user.email === 'admin@usk.com')) {
      kept.unshift(DEFAULT_USERS[0]);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(kept));
  } catch (error) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  }

  try {
    const session = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    if (session && (session.email === 'user@usk.com' || isDemoExamAccount(session.name) || isDemoExamAccount(session.email))) {
      localStorage.removeItem(AUTH_KEY);
    }
  } catch (error) {
    localStorage.removeItem(AUTH_KEY);
  }

  localStorage.setItem(flag, '1');
}

clearDemoExamData();

function removeSasaAccount() {
  const flag = 'usk_bookstore_remove_sasa';
  if (localStorage.getItem(flag) === '1') return;

  const isSasa = (value) => {
    const text = String(value || '').trim();
    return /^sasa$/i.test(text) || /sasa@gmail\.com/i.test(text);
  };

  try {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (Array.isArray(stored)) {
      const photos = JSON.parse(localStorage.getItem(PROFILE_PHOTOS_KEY) || '{}');
      stored
        .filter((user) => user && (isSasa(user.name) || isSasa(user.email)))
        .forEach((user) => {
          delete photos[user.id];
        });
      localStorage.setItem(PROFILE_PHOTOS_KEY, JSON.stringify(photos));
      const kept = stored.filter((user) => user && !isSasa(user.name) && !isSasa(user.email));
      localStorage.setItem(USERS_KEY, JSON.stringify(kept));
    }
  } catch (error) {
    // Daftar akun tetap aman kalau data lokal tidak bisa dibaca.
  }

  try {
    const session = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    if (session && (isSasa(session.name) || isSasa(session.email))) {
      localStorage.removeItem(AUTH_KEY);
    }
  } catch (error) {
    localStorage.removeItem(AUTH_KEY);
  }

  localStorage.setItem(flag, '1');
}

removeSasaAccount();

function initUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  }
}

function getUsers() {
  initUsers();
  return JSON.parse(localStorage.getItem(USERS_KEY));
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  const data = localStorage.getItem(AUTH_KEY);
  return data ? JSON.parse(data) : null;
}

function setCurrentUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = 'index.html';
}

function requireAuth(allowedRoles = []) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'signup.html?need=1';
    return null;
  }
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    window.location.href = user.role === 'admin' ? 'admin.html' : 'user.html';
    return null;
  }
  return user;
}

function requireAccount(message) {
  const user = getCurrentUser();
  if (user) return user;
  const query = message ? `?need=1&msg=${encodeURIComponent(message)}` : '?need=1';
  window.location.href = `signup.html${query}`;
  return null;
}

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

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getProfilePhotos() {
  return JSON.parse(localStorage.getItem(PROFILE_PHOTOS_KEY) || '{}');
}

function getProfilePhoto(userId) {
  return getProfilePhotos()[userId] || null;
}

function setProfilePhoto(userId, dataUrl) {
  const photos = getProfilePhotos();
  photos[userId] = dataUrl;
  localStorage.setItem(PROFILE_PHOTOS_KEY, JSON.stringify(photos));
}

function removeProfilePhoto(userId) {
  const photos = getProfilePhotos();
  delete photos[userId];
  localStorage.setItem(PROFILE_PHOTOS_KEY, JSON.stringify(photos));
}

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

