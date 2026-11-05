// File: js/novel-page.js
// Deskripsi: Skrip halaman katalog novel.
const user = requireAuth(['user']);
if (!user) throw new Error('Unauthorized');

applyAvatar(document.getElementById('sidebarAvatar'), user);
document.getElementById('sidebarAvatar').addEventListener('click', () => {
  window.location.href = 'akun.html';
});

// Urutan tampilan buku novel.
const NOVEL_ORDER = ['1', '2', '3', '12'];

// Menampilkan pesan singkat.
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

// Menampilkan katalog novel.
function renderNovelPage() {
  const books = getBooksByCategory('Novel').sort((a, b) => {
    const ia = NOVEL_ORDER.indexOf(a.id);
    const ib = NOVEL_ORDER.indexOf(b.id);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return String(a.title).localeCompare(String(b.title), 'id');
  });

  const container = document.getElementById('novelContent');
  container.innerHTML = books.map((book) => renderBookCard(book, user.id)).join('');

  attachBookCardEvents(container, user.id, {
    fromPage: 'novel',
    onAddCart: (bookId) => {
      const book = getBookById(bookId);
      showToast(`"${book.title}" ditambahkan ke keranjang!`);
    },
  });
}

document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = 'pengguna.html';
});

renderNovelPage();
