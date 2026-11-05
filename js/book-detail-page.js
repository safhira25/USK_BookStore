// File: js/book-detail-page.js
// Deskripsi: Skrip halaman rincian buku dan tombol pembelian.
const params = new URLSearchParams(window.location.search);
const bookId = params.get('id');
const fromAdmin = params.get('from') === 'admin';
const fromKomik = params.get('from') === 'komik';
const fromNovel = params.get('from') === 'novel';
const fromCerpen = params.get('from') === 'cerpen';
const fromLanding = params.get('from') === 'landing';

const user = getCurrentUser();
if (fromAdmin && (!user || user.role !== 'admin')) {
  window.location.href = user ? 'pengguna.html' : 'index.html';
} else if (user && user.role === 'admin' && !fromAdmin) {
  window.location.href = 'pengelola.html';
}

let quantity = 1;
let book = getBookById(bookId);

// Menentukan halaman untuk tombol kembali.
function getBackUrl() {
  if (fromAdmin) return 'pengelola.html';
  if (fromLanding || !user) return 'index.html';
  if (fromKomik || book?.category === 'Komik') return 'komik.html';
  if (fromNovel || book?.category === 'Novel') return 'novel.html';
  if (fromCerpen || book?.category === 'Cerpen') return 'cerpen.html';
  return 'pengguna.html';
}

// Membuka halaman pendaftaran.
function goCreateAccount() {
  window.location.href = 'daftar.html?need=1';
}

// Menampilkan menu samping.
function renderSidebar() {
  const sidebar = document.getElementById('detailSidebar');

  if (fromAdmin && user) {
    document.getElementById('appShell').classList.add('admin-shell');
    sidebar.classList.add('admin-sidebar');
    sidebar.innerHTML = `
      <div class="admin-brand">
        <div class="sidebar-avatar">${getInitials(user.name)}</div>
        <div class="admin-brand-text">
          <strong>Admin</strong>
          <span>USK BookStore</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <button class="nav-item" type="button" onclick="location.href='pengelola.html'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
          <span>Dasbor</span>
        </button>
        <button class="nav-item active" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          <span>Detail Buku</span>
        </button>
        <button class="admin-logout" type="button" onclick="logout()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Keluar
        </button>
      </nav>
    `;
    return;
  }

  if (!user) {
    sidebar.innerHTML = `
      <div class="sidebar-avatar has-photo" title="BookStore">
        <img src="assets/logo.png" alt="BookStore">
      </div>
      <nav class="sidebar-nav">
        <button class="nav-item" type="button" onclick="location.href='index.html'" title="Beranda">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z"/></svg>
        </button>
        <button class="nav-item active" title="Detail Buku">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </button>
      </nav>
    `;
    return;
  }

  sidebar.innerHTML = `
    <div class="sidebar-avatar" onclick="location.href='akun.html'"></div>
    <nav class="sidebar-nav">
      <button class="nav-item" type="button" onclick="location.href='pengguna.html'" title="Beranda">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z"/></svg>
      </button>
      <button class="nav-item" type="button" onclick="location.href='novel.html'" title="Novel">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      </button>
      <button class="nav-item" type="button" onclick="location.href='komik.html'" title="Komik">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
      </button>
      <button class="nav-item active" title="Detail Buku">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      </button>
      <button class="nav-item" type="button" onclick="location.href='favorit.html'" title="Love">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </button>
      <button class="nav-item" type="button" onclick="location.href='keranjang.html'" title="Keranjang">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      </button>
    </nav>
    <button class="sidebar-subscribe" type="button">BERLANGGANAN</button>
  `;
  applyAvatar(sidebar.querySelector('.sidebar-avatar'), user);
}

// Menampilkan rincian buku.
function renderDetail() {
  if (!book) {
    document.getElementById('detailContent').classList.add('hidden');
    document.getElementById('detailError').classList.remove('hidden');
    return;
  }

  document.title = `${book.title} - BookStore`;
  document.getElementById('breadcrumbCategory').textContent = getCategoryLabel(book.category);
  document.getElementById('breadcrumbTitle').textContent = book.title;

  if (book.category === 'Komik') {
    document.body.classList.add('detail-komik');
    const breadcrumbCategory = document.getElementById('breadcrumbCategory');
    breadcrumbCategory.style.cursor = 'pointer';
    breadcrumbCategory.title = 'Kembali ke halaman Komik';
    breadcrumbCategory.addEventListener('click', () => {
      window.location.href = user ? 'komik.html' : 'index.html';
    });
  }

  if (book.category === 'Novel') {
    document.body.classList.add('detail-novel');
    const breadcrumbCategory = document.getElementById('breadcrumbCategory');
    breadcrumbCategory.style.cursor = 'pointer';
    breadcrumbCategory.title = 'Kembali ke halaman Novel';
    breadcrumbCategory.addEventListener('click', () => {
      window.location.href = user ? 'novel.html' : 'index.html';
    });
  }

  if (book.category === 'Cerpen') {
    document.body.classList.add('detail-cerpen');
    const breadcrumbCategory = document.getElementById('breadcrumbCategory');
    breadcrumbCategory.style.cursor = 'pointer';
    breadcrumbCategory.title = 'Kembali ke halaman Cerpen';
    breadcrumbCategory.addEventListener('click', () => {
      window.location.href = user ? 'cerpen.html' : 'index.html';
    });
  }

  const detailLabel =
    book.category === 'Komik'
      ? 'Detail Komik'
      : book.category === 'Novel'
        ? 'Detail Novel'
        : book.category === 'Cerpen'
          ? 'Detail Cerpen'
          : 'Detail Buku';
  const inStock = book.stock > 0;
  const totalPrice = formatPrice(book.price * quantity);

  document.getElementById('detailContent').innerHTML = `
    <div class="detail-hero">
      <div class="detail-cover-panel">
        <div class="detail-cover-frame">
          <img class="detail-cover" src="${book.cover}" alt="${book.title}">
        </div>
        <span class="book-category detail-cover-badge">${getCategoryLabel(book.category)}</span>
      </div>

      <div class="detail-info-panel">
        <p class="detail-label">${detailLabel}</p>
        <div class="detail-title-row">
          <h1 class="detail-title">${book.title}</h1>
          <button class="book-love-btn detail-love-btn ${user && isLoved(user.id, book.id) ? 'loved' : ''}" type="button" id="detailLoveBtn" aria-label="Suka">
            <svg viewBox="0 0 24 24" fill="${user && isLoved(user.id, book.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
        <p class="detail-author">oleh <strong>${book.author}</strong></p>

        <div class="detail-rating">
          <div class="detail-stars">${renderStars(book.rating)}</div>
          <strong>${book.rating.toFixed(1)}/5</strong>
          <span>(${formatReviews(book.reviews)})</span>
        </div>

        <div class="detail-price-box">
          <span class="detail-price-label">Harga</span>
          <p class="detail-price" id="detailPrice">${formatPrice(book.price)}</p>
          <p class="detail-subtotal hidden" id="detailSubtotal">Total ${quantity} buku: ${totalPrice}</p>
        </div>

        <p class="detail-stock ${inStock ? 'available' : 'empty'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          ${inStock ? `Stok tersedia — ${book.stock} buku` : 'Stok habis'}
        </p>

        <div class="detail-actions ${fromAdmin ? 'admin-actions' : ''}" id="detailActions"></div>
      </div>
    </div>

    <div class="detail-body-grid">
      <section class="detail-card detail-section">
        <h3>Deskripsi</h3>
        <p>${book.description}</p>
      </section>

      <section class="detail-card detail-specs">
        <h3>Informasi Buku</h3>
        <div class="detail-spec-grid">
          <div class="detail-spec-item">
            <div class="detail-meta-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
            <div><span>Bahasa</span><strong>${book.language}</strong></div>
          </div>
          <div class="detail-spec-item">
            <div class="detail-meta-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
            <div><span>Halaman</span><strong>${book.pages} halaman</strong></div>
          </div>
          <div class="detail-spec-item">
            <div class="detail-meta-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
            <div><span>Tahun Terbit</span><strong>${book.year}</strong></div>
          </div>
          <div class="detail-spec-item">
            <div class="detail-meta-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
            <div><span>Penerbit</span><strong>${book.publisher}</strong></div>
          </div>
        </div>
      </section>
    </div>
  `;

  renderActions(inStock);

  const loveBtn = document.getElementById('detailLoveBtn');
  if (loveBtn) {
    loveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!user) {
        goCreateAccount();
        return;
      }
      const nowLoved = toggleLove(user.id, book.id);
      loveBtn.classList.toggle('loved', nowLoved);
      loveBtn.querySelector('svg').setAttribute('fill', nowLoved ? 'currentColor' : 'none');
      loveBtn.setAttribute('aria-label', nowLoved ? 'Hapus dari Love' : 'Tambah ke Love');
    });
  }
}

// Menampilkan bintang penilaian.
function renderStars(rating) {
  const full = Math.floor(rating);
  let stars = '';
  for (let i = 0; i < 5; i++) {
    stars += i < full
      ? '<svg viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  }
  return stars;
}

// Menampilkan tombol beli dan keranjang.
function renderActions(inStock) {
  const actions = document.getElementById('detailActions');

  if (fromAdmin) {
    actions.innerHTML = `
      <div class="detail-action-row">
        <button class="btn btn-primary" type="button" id="adminEditBtn">Ubah Buku</button>
        <button class="btn btn-secondary" type="button" id="adminBackBtn">Kembali ke Admin</button>
      </div>
    `;
    document.getElementById('adminEditBtn').addEventListener('click', () => {
      window.location.href = `pengelola.html?edit=${book.id}`;
    });
    document.getElementById('adminBackBtn').addEventListener('click', () => {
      window.location.href = 'pengelola.html';
    });
    return;
  }

  actions.innerHTML = `
    <div class="detail-purchase-box">
      <label class="detail-qty-label">Jumlah</label>
      <div class="detail-purchase-row">
        <div class="qty-control">
          <button type="button" id="qtyMinus" aria-label="Kurangi">−</button>
          <span id="qtyValue">1</span>
          <button type="button" id="qtyPlus" aria-label="Tambah">+</button>
        </div>
        <button class="btn btn-primary detail-btn-cart" type="button" id="addCartBtn" ${!inStock ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Tambah Keranjang
        </button>
      </div>
      <button class="btn btn-outline detail-btn-buy" type="button" id="buyNowBtn" ${!inStock ? 'disabled' : ''}>Beli Sekarang</button>
    </div>
  `;

  document.getElementById('qtyMinus').addEventListener('click', () => updateQty(-1));
  document.getElementById('qtyPlus').addEventListener('click', () => updateQty(1));
  document.getElementById('addCartBtn').addEventListener('click', handleAddCart);
  document.getElementById('buyNowBtn').addEventListener('click', handleBuyNow);
}

// Mengubah jumlah barang yang akan dibeli.
function updateQty(delta) {
  const max = book.stock;
  quantity = Math.max(1, Math.min(max, quantity + delta));
  document.getElementById('qtyValue').textContent = quantity;

  const subtotalEl = document.getElementById('detailSubtotal');
  if (subtotalEl) {
    subtotalEl.textContent = `Total ${quantity} buku: ${formatPrice(book.price * quantity)}`;
    subtotalEl.classList.toggle('hidden', quantity <= 1);
  }
}

// Memproses tombol tambah ke keranjang.
function handleAddCart() {
  if (!user) {
    goCreateAccount();
    return;
  }
  addToCart(user.id, book.id, quantity);
  showToast(`${quantity}x "${book.title}" ditambahkan ke keranjang!`);
}

// Memproses tombol beli sekarang.
function handleBuyNow() {
  if (!user) {
    goCreateAccount();
    return;
  }
  window.location.href = `penyelesaian.html?id=${book.id}&qty=${quantity}`;
}

// Menampilkan pesan singkat.
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast show';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = getBackUrl();
});

document.getElementById('errorBackBtn').addEventListener('click', () => {
  window.location.href = getBackUrl();
});

renderSidebar();
renderDetail();
