// File: js/komik-page.js
// Deskripsi: Skrip halaman katalog komik.
const user = requireAuth(['user']);
if (!user) throw new Error('Unauthorized');

applyAvatar(document.getElementById('sidebarAvatar'), user);
document.getElementById('sidebarAvatar').addEventListener('click', () => {
  window.location.href = 'akun.html';
});

// Urutan tampilan buku komik.
const KOMIK_ORDER = ['7', '9', '10', '11'];

// Menampilkan katalog komik.
function renderKomikPage() {
  const books = getBooksByCategory('Komik').sort((a, b) => {
    const ia = KOMIK_ORDER.indexOf(a.id);
    const ib = KOMIK_ORDER.indexOf(b.id);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return String(a.title).localeCompare(String(b.title), 'id');
  });

  const container = document.getElementById('komikContent');
  container.innerHTML = books.map((book) => renderBookCard(book, user.id)).join('');

  attachBookCardEvents(container, user.id, {
    fromPage: 'komik',
    onAddCart: (bookId) => {
      const book = getBookById(bookId);
      showToast(`"${book.title}" ditambahkan ke keranjang!`);
    },
  });
}

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

document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = 'pengguna.html';
});

renderKomikPage();
