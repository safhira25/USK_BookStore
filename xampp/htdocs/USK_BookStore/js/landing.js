const categoryIcons = {
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
  novel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  komik: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  cerpen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
};

let activeCategory = 'All';
let searchQuery = '';

function goLogin() {
  window.location.href = 'signin.html';
}

function goCreateAccount() {
  window.location.href = 'signup.html?need=1';
}

function categoryIconKey(value) {
  const key = String(value || '').toLowerCase();
  if (key.includes('komik') || key.includes('manga')) return 'komik';
  if (key.includes('cerpen')) return 'cerpen';
  if (key === 'all' || key === 'semua') return 'grid';
  return 'novel';
}

function getLandingCategories() {
  return getBrowsableCategories().map((cat) => ({
    ...cat,
    icon: categoryIconKey(cat.value),
  }));
}

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

function performSearch() {
  searchQuery = document.getElementById('searchInput').value.trim();
  renderBooks();
}

function getSectionTitle() {
  if (searchQuery) return 'Hasil Pencarian';
  if (activeCategory === 'All') return 'Populer';
  return getCategoryLabel(activeCategory);
}

function getSectionSubtitle() {
  if (searchQuery) return `"${searchQuery}" — ${filterBooks().length} buku ditemukan`;
  if (activeCategory === 'All') return 'Buku pilihan terbaik untukmu hari ini';
  return `Kategori ${getCategoryLabel(activeCategory)}`;
}

function renderCategories() {
  const container = document.getElementById('categories');
  const categories = getLandingCategories();
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
      activeCategory = chip.dataset.category;
      renderCategories();
      renderBooks();
    });
  });
}

function renderBooks() {
  const books = filterBooks();
  const grid = document.getElementById('bookGrid');

  document.getElementById('sectionTitle').textContent = getSectionTitle();
  document.getElementById('sectionSubtitle').textContent = getSectionSubtitle();
  document.getElementById('statBooksCount').textContent = getBooks().length;

  if (books.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <p>Tidak ada buku ditemukan.</p>
        <span>Coba kata kunci atau kategori lain.</span>
      </div>`;
    return;
  }

  grid.innerHTML = books.map((book) => renderBookCard(book, '')).join('');

  // Lihat buku bebas. Keranjang dan love butuh akun.
  grid.querySelectorAll('.book-add-btn, .book-love-btn').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      goCreateAccount();
    });
  });

  grid.querySelectorAll('.book-card').forEach((card) => {
    card.addEventListener('click', () => {
      window.location.href = `book-detail.html?id=${encodeURIComponent(card.dataset.id)}&from=landing`;
    });
  });
}

const logo = document.getElementById('landingLogo');
if (logo) {
  logo.addEventListener('click', goLogin);
  logo.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goLogin();
    }
  });
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

document.getElementById('searchBtn').addEventListener('click', performSearch);

document.getElementById('prevBtn').addEventListener('click', () => {
  document.querySelector('.book-scroll-wrap')?.scrollBy({ left: -300, behavior: 'smooth' });
});

document.getElementById('nextBtn').addEventListener('click', () => {
  document.querySelector('.book-scroll-wrap')?.scrollBy({ left: 300, behavior: 'smooth' });
});

renderCategories();
renderBooks();
