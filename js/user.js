// File: js/user.js
// Deskripsi: Skrip beranda pengguna untuk katalog, pencarian, dan keranjang.
const currentUser = requireAuth(['user']);
if (!currentUser) throw new Error('Unauthorized');

document.getElementById('userName').textContent = currentUser.name;
document.getElementById('welcomeName').textContent = currentUser.name.split(' ')[0];
applyAvatar(document.getElementById('userAvatar'), currentUser);
document.getElementById('userAvatar').addEventListener('click', () => {
  window.location.href = 'akun.html';
});

const categoryIcons = {
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
  novel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  komik: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  cerpen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
};

let activeCategory = 'All';
let searchQuery = '';

// Menentukan ikon sebuah kategori.
function categoryIconKey(value) {
  const key = String(value || '').toLowerCase();
  if (key.includes('komik') || key.includes('manga')) return 'komik';
  if (key.includes('cerpen')) return 'cerpen';
  if (key === 'all' || key === 'semua') return 'grid';
  return 'novel';
}

// Mengambil kategori yang tampil di beranda pengguna.
function getUserCategories() {
  return getBrowsableCategories().map((cat) => ({
    ...cat,
    icon: categoryIconKey(cat.value),
  }));
}

// Memperbarui angka pada ikon keranjang.
function updateCartBadge() {
  const cart = getCart(currentUser.id);
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('cartBadge').textContent = total;
  document.getElementById('statCartCount').textContent = total;
}

// Memperbarui angka ringkasan di beranda.
function updateStats() {
  document.getElementById('statBooksCount').textContent = getBooks().length;
  updateCartBadge();
}

// Menampilkan daftar kategori.
function renderCategories() {
  const container = document.getElementById('categories');
  const categories = getUserCategories();
  container.innerHTML = categories
    .map(
      (cat) => `
    <button class="category-chip ${cat.value === activeCategory ? 'active' : ''}" data-category="${cat.value}" type="button">
      <span class="category-icon">${categoryIcons[cat.icon] || categoryIcons.novel}</span>
      <span>${cat.label}</span>
    </button>
  `
    )
    .join('');

  container.querySelectorAll('.category-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const page = typeof getCategoryPage === 'function' ? getCategoryPage(chip.dataset.category) : '';
      if (page) {
        window.location.href = page;
        return;
      }
      activeCategory = chip.dataset.category;
      renderCategories();
      renderBooks();
    });
  });
}

// Menyaring buku sesuai pencarian atau kategori.
function filterBooks() {
  let books = getBooks();
  if (activeCategory !== 'All') {
    books = books.filter((b) => b.category === activeCategory);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    books = books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        getCategoryLabel(b.category).toLowerCase().includes(q)
    );
  }
  return books;
}

// Menjalankan pencarian buku.
function performSearch() {
  searchQuery = document.getElementById('searchInput').value.trim();
  if (!searchQuery) {
    renderBooks();
    return;
  }
  const books = filterBooks();
  if (books.length === 0) {
    window.location.href = `tidak-ditemukan.html?q=${encodeURIComponent(searchQuery)}`;
    return;
  }
  renderBooks();
}

// Mengambil judul bagian katalog.
function getSectionTitle() {
  if (searchQuery) return `Hasil Pencarian`;
  if (activeCategory === 'All') return 'Populer';
  return getCategoryLabel(activeCategory);
}

// Mengambil keterangan di bawah judul katalog.
function getSectionSubtitle() {
  if (searchQuery) return `"${searchQuery}" — ${filterBooks().length} buku ditemukan`;
  if (activeCategory === 'All') return 'Buku pilihan terbaik untukmu hari ini';
  return `Kategori ${getCategoryLabel(activeCategory)}`;
}

// Menampilkan daftar buku.
function renderBooks() {
  const books = filterBooks();
  const grid = document.getElementById('bookGrid');

  document.getElementById('sectionTitle').textContent = getSectionTitle();
  document.getElementById('sectionSubtitle').textContent = getSectionSubtitle();

  if (books.length === 0) {
    if (searchQuery) {
      grid.innerHTML = `
        <div class="empty-state search-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <p>Buku yang anda ketik tidak ada di pencarian</p>
          <span>Tekan Enter atau tombol Cari untuk melihat halaman pencarian.</span>
        </div>`;
    } else {
      grid.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <p>Tidak ada buku ditemukan.</p>
          <span>Coba kata kunci atau kategori lain.</span>
        </div>`;
    }
    return;
  }

  grid.innerHTML = books.map((book) => renderBookCard(book, currentUser.id)).join('');

  attachBookCardEvents(grid, currentUser.id, {
    onAddCart: (bookId) => {
      updateCartBadge();
      const book = getBooks().find((b) => b.id === bookId);
      showToast(`"${book.title}" ditambahkan ke keranjang!`);
    },
  });
}

// Menambahkan buku ke keranjang.
function addBookToCart(bookId, qty = 1) {
  addToCart(currentUser.id, bookId, qty);
  updateCartBadge();
  const book = getBooks().find((b) => b.id === bookId);
  showToast(`"${book.title}" ditambahkan ke keranjang!`);
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
  }, 2500);
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  renderBooks();
});

document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    performSearch();
  }
});

document.getElementById('searchBtn').addEventListener('click', () => {
  performSearch();
});

document.getElementById('cartBtn').addEventListener('click', () => {
  window.location.href = 'keranjang.html';
});

document.getElementById('loveNavBtn').addEventListener('click', () => {
  window.location.href = 'favorit.html';
});

document.getElementById('viewAllLink')?.addEventListener('click', (e) => {
  e.preventDefault();
  activeCategory = 'All';
  searchQuery = '';
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  renderCategories();
  renderBooks();
  document.querySelector('.book-scroll-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('prevBtn').addEventListener('click', () => {
  document.querySelector('.book-scroll-wrap')?.scrollBy({ left: -300, behavior: 'smooth' });
});

document.getElementById('nextBtn').addEventListener('click', () => {
  document.querySelector('.book-scroll-wrap')?.scrollBy({ left: 300, behavior: 'smooth' });
});

if (typeof initUserChat === 'function') {
  try {
    initUserChat(currentUser);
  } catch (error) {
    console.error(error);
  }
}
if (typeof initReviewPrompt === 'function') {
  initReviewPrompt(currentUser);
}
renderCategories();
renderBooks();
updateStats();
