// File: js/love-page.js
// Deskripsi: Skrip halaman buku favorit.
const user = requireAuth(['user']);
if (!user) throw new Error('Unauthorized');

applyAvatar(document.getElementById('sidebarAvatar'), user);
document.getElementById('sidebarAvatar').addEventListener('click', () => {
  window.location.href = 'akun.html';
});

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

// Menampilkan buku favorit.
function renderLovePage() {
  const books = getLovedBooks(user.id);
  const container = document.getElementById('loveContent');

  if (books.length === 0) {
    container.innerHTML = `
      <div class="love-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <h2>Belum ada buku favorit</h2>
        <p>Tekan ikon love pada buku untuk menyimpannya di sini.</p>
        <button class="btn btn-primary btn-sm" type="button" onclick="location.href='pengguna.html'">Jelajahi Buku</button>
      </div>
    `;
    return;
  }

  container.innerHTML = books.map((book) => renderBookCard(book, user.id)).join('');

  attachBookCardEvents(container, user.id, {
    onAddCart: (bookId) => {
      const book = getBooks().find((b) => b.id === bookId);
      showToast(`"${book.title}" ditambahkan ke keranjang!`);
    },
    onLoveToggle: (_bookId, nowLoved) => {
      if (!nowLoved) {
        renderLovePage();
      }
    },
  });
}

document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = 'pengguna.html';
});

renderLovePage();
