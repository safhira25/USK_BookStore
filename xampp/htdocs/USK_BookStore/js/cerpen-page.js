const user = requireAuth(['user']);
if (!user) throw new Error('Unauthorized');

applyAvatar(document.getElementById('sidebarAvatar'), user);
document.getElementById('sidebarAvatar').addEventListener('click', () => {
  window.location.href = 'account.html';
});

const CERPEN_ORDER = ['4', '13', '14', '15'];

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

function renderCerpenPage() {
  const books = getBooksByCategory('Cerpen').sort((a, b) => {
    const ia = CERPEN_ORDER.indexOf(a.id);
    const ib = CERPEN_ORDER.indexOf(b.id);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return String(a.title).localeCompare(String(b.title), 'id');
  });

  const container = document.getElementById('cerpenContent');
  container.innerHTML = books.map((book) => renderBookCard(book, user.id)).join('');

  attachBookCardEvents(container, user.id, {
    fromPage: 'cerpen',
    onAddCart: (bookId) => {
      const book = getBookById(bookId);
      showToast(`"${book.title}" ditambahkan ke keranjang!`);
    },
  });
}

document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = 'user.html';
});

renderCerpenPage();
