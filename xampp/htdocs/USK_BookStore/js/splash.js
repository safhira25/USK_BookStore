const AUTH_KEY = 'usk_bookstore_auth';
const STATUS_EL = document.getElementById('splashStatus');
const STAGE_EL = document.getElementById('splashStage');

const messages = [
  'Menyiapkan koleksi...',
  'Menata rak buku digital...',
  'Hampir siap...',
];

let messageIndex = 0;
const messageTimer = setInterval(() => {
  messageIndex = (messageIndex + 1) % messages.length;
  if (STATUS_EL) STATUS_EL.textContent = messages[messageIndex];
}, 800);

function nextPage() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    const user = raw ? JSON.parse(raw) : null;
    if (user?.role === 'admin') return 'admin.html';
    if (user) return 'user.html';
  } catch (err) {
    /* tampilkan landing */
  }
  // Pengunjung baru masuk ke landing, bukan langsung daftar/login.
  return 'index.html';
}

function leaveSplash() {
  clearInterval(messageTimer);
  STAGE_EL?.classList.add('is-leaving');
  setTimeout(() => {
    window.location.href = nextPage();
  }, 420);
}

window.addEventListener('load', () => {
  setTimeout(leaveSplash, 2600);
});
