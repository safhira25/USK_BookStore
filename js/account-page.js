// File: js/account-page.js
// Deskripsi: Skrip halaman akun, pesanan, alamat, dan profil.
const user = requireAuth(['user']);
if (!user) throw new Error('Unauthorized');

const params = new URLSearchParams(window.location.search);
let activeSection = params.get('tab') || 'orders';
let orderFilter = 'all';

document.getElementById('profileName').textContent = user.name;
document.getElementById('profileEmail').textContent = user.email;

const sections = {
  orders: renderOrders,
  wishlist: renderWishlist,
  address: renderAddress,
  payment: renderPayment,
  about: renderAbout,
};

// Memperbarui foto atau inisial pada avatar.
function updateAvatars() {
  applyAvatar(document.getElementById('profileAvatar'), user);
  applyAvatar(document.getElementById('sidebarAvatar'), user);
  document.getElementById('removePhotoBtn').classList.toggle('hidden', !getProfilePhoto(user.id));
}

// Menyiapkan unggah foto profil.
function initProfilePhoto() {
  const fileInput = document.getElementById('profilePhotoInput');
  const openPicker = () => fileInput.click();

  document.getElementById('profileAvatar').addEventListener('click', openPicker);
  document.getElementById('changePhotoBtn').addEventListener('click', openPicker);

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran foto maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhoto(user.id, reader.result);
      updateAvatars();
    };
    reader.readAsDataURL(file);
    fileInput.value = '';
  });

  document.getElementById('removePhotoBtn').addEventListener('click', () => {
    removeProfilePhoto(user.id);
    updateAvatars();
  });

  updateAvatars();
}

// Berpindah bagian pada halaman akun.
function switchSection(section) {
  activeSection = section;
  document.querySelectorAll('.account-menu-item[data-section]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.section === section);
  });
  const render = sections[section];
  if (render) render();
}

document.querySelectorAll('.account-menu-item[data-section]').forEach((btn) => {
  btn.addEventListener('click', () => switchSection(btn.dataset.section));
});

document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = 'pengguna.html';
});

document.getElementById('logoutBtn').addEventListener('click', logout);

// Mengambil nama penerima paket.
function recipientName() {
  const value = String(user?.name || '').trim();
  if (!value || /bookstore/i.test(value)) return 'Safhira';
  return value.split(/\s+/)[0];
}

// Mengubah kode status menjadi tulisan.
function statusLabel(status) {
  const labels = { pending: 'Menunggu', shipped: 'Dikirim', completed: 'Selesai' };
  return labels[status] || status;
}

// Mengubah tanggal pesanan menjadi tulisan.
function formatOrderDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Mencari buku berdasarkan judul.
function findBookByTitle(title) {
  return getBooks().find((book) => book.title === title);
}

// Menampilkan tampilan saat data masih kosong.
function emptyState(icon, message, actionLabel, actionHref) {
  return `
    <div class="account-empty">
      <div class="account-empty-icon">${icon}</div>
      <p>${message}</p>
      <button class="btn btn-primary btn-sm" type="button" onclick="location.href='${actionHref}'">${actionLabel}</button>
    </div>
  `;
}

// Menampilkan daftar pesanan pengguna.
function renderOrders() {
  const allOrders = getOrders().filter((o) => o.customer === user.name);
  const orders = orderFilter === 'all' ? allOrders : allOrders.filter((o) => o.status === orderFilter);
  const panel = document.getElementById('accountContent');
  const completed = allOrders.filter((o) => o.status === 'completed').length;
  const shipped = allOrders.filter((o) => o.status === 'shipped').length;
  const pending = allOrders.filter((o) => o.status === 'pending').length;

  const filters = [
    ['all', 'Semua'],
    ['pending', 'Menunggu'],
    ['shipped', 'Dikirim'],
    ['completed', 'Selesai'],
  ];

  panel.innerHTML = `
    <p class="account-kicker">Riwayat belanja</p>
    <h2>Pesanan Saya</h2>
    <p class="account-content-desc">Pantau status pembelian buku dan lacak pengiriman dengan tampilan yang lebih rapi.</p>
    ${
      allOrders.length === 0
        ? emptyState(
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
            'Belum ada pesanan.',
            'Belanja Sekarang',
            'pengguna.html'
          )
        : `
          <div class="account-stats">
            <div class="account-stat"><strong>${allOrders.length}</strong><span>Total pesanan</span></div>
            <div class="account-stat"><strong>${completed}</strong><span>Selesai</span></div>
            <div class="account-stat"><strong>${shipped}</strong><span>Dikirim</span></div>
            <div class="account-stat"><strong>${pending}</strong><span>Menunggu</span></div>
          </div>
          <div class="account-filters">
            ${filters
              .map(
                ([value, label]) =>
                  `<button type="button" class="account-filter${orderFilter === value ? ' is-active' : ''}" data-filter="${value}">${label}</button>`
              )
              .join('')}
          </div>
          ${
            orders.length === 0
              ? `<div class="account-empty"><p>Tidak ada pesanan dengan status ini.</p></div>`
              : `<div class="account-order-list">${orders.map(renderOrderCard).join('')}</div>`
          }
        `
    }
  `;

  panel.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      orderFilter = btn.dataset.filter;
      renderOrders();
    });
  });

  panel.querySelectorAll('[data-review-order]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const order = allOrders.find((item) => item.id === btn.dataset.reviewOrder);
      if (order) openReviewModal(order, user);
    });
  });
}

// Menampilkan satu kartu pesanan.
function renderOrderCard(order) {
  const book = findBookByTitle(order.book);
  const cover = book?.cover
    ? `<img src="${book.cover}" alt="${order.book}">`
    : `<span>${(order.book || 'B').charAt(0)}</span>`;

  return `
    <article class="account-order-card">
      <div class="account-order-cover">${cover}</div>
      <div class="account-order-meta">
        <span class="account-order-id">${order.id}</span>
        <h3>${order.book}</h3>
        <p>${formatOrderDate(order.date)}${book?.author ? ` · ${book.author}` : ''}</p>
      </div>
      <div class="account-order-side">
        <div class="account-order-total">${formatPrice(order.total)}</div>
        <div class="account-order-actions">
          <span class="status-badge ${order.status}">${statusLabel(order.status)}</span>
          ${
            order.status === 'completed'
              ? getReviewByOrderId(order.id)
                ? `<span class="account-reviewed">★ ${getReviewByOrderId(order.id).rating}/5</span>`
                : `<button type="button" class="account-review-btn" data-review-order="${order.id}">Beri ulasan</button>`
              : ''
          }
          <a class="account-track-link" href="lacak.html?order=${encodeURIComponent(order.id)}">Lacak →</a>
        </div>
      </div>
    </article>
  `;
}

// Menampilkan daftar buku favorit.
function renderWishlist() {
  const books = getLovedBooks(user.id);
  const panel = document.getElementById('accountContent');

  panel.innerHTML = `
    <div class="account-panel-head">
      <div>
        <p class="account-kicker">Koleksi favorit</p>
        <h2>Wishlist</h2>
        <p class="account-content-desc">Buku yang ingin Anda baca dan beli nanti, ditata seperti rak koleksi pribadi.</p>
      </div>
      ${books.length ? `<span class="account-count">${books.length} judul</span>` : ''}
    </div>
    ${
      books.length === 0
        ? emptyState(
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
            'Wishlist masih kosong.',
            'Jelajahi Buku',
            'pengguna.html'
          )
        : `<div class="account-wishlist-grid">${books.map(renderWishlistCard).join('')}</div>`
    }
  `;

  const grid = panel.querySelector('.account-wishlist-grid');
  if (!grid) return;

  grid.querySelectorAll('.wish-cart').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(user.id, btn.dataset.id, 1);
      btn.textContent = 'Ditambahkan';
      setTimeout(() => {
        btn.textContent = 'Tambah ke keranjang';
      }, 1400);
    });
  });

  grid.querySelectorAll('.wish-love').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLove(user.id, btn.dataset.id);
      renderWishlist();
    });
  });

  grid.querySelectorAll('.wish-card').forEach((card) => {
    card.addEventListener('click', () => {
      window.location.href = `detail-buku.html?id=${card.dataset.id}&from=account`;
    });
  });
}

// Menampilkan satu kartu buku favorit.
function renderWishlistCard(book) {
  const rating = (book.rating || 4.5).toFixed(1);
  return `
    <article class="wish-card" data-id="${book.id}">
      <div class="wish-cover">
        <img src="${book.cover}" alt="${book.title}">
        <button class="wish-love" type="button" data-id="${book.id}" aria-label="Hapus dari wishlist">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      <div class="wish-body">
        <span class="wish-cat">${book.category || 'Buku'}</span>
        <h3>${book.title}</h3>
        <p class="wish-author">${book.author || ''}</p>
        <div class="wish-meta">
          <strong>${formatPrice(book.price)}</strong>
          <span>★ ${rating}</span>
        </div>
        <button class="wish-cart" type="button" data-id="${book.id}">Tambah ke keranjang</button>
      </div>
    </article>
  `;
}

// Mengamankan teks agar aman ditampilkan di halaman.
function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Menampilkan daftar alamat pengiriman.
function renderAddress() {
  const addresses = getAddresses(user.id, user.name);
  const panel = document.getElementById('accountContent');

  panel.innerHTML = `
    <div class="account-panel-head">
      <div>
        <p class="account-kicker">Pengiriman</p>
        <h2>Alamat Pengiriman</h2>
        <p class="account-content-desc">Tambah, ubah, dan pilih alamat yang akan dipakai saat memesan.</p>
      </div>
      <div class="address-head-actions">
        <span class="account-count">${addresses.length} alamat</span>
        <button type="button" class="btn btn-primary btn-sm address-add-btn" id="addAddressBtn">+ Tambah Alamat</button>
      </div>
    </div>
    <div class="address-list">
      ${addresses.map(renderAddressCard).join('')}
    </div>
    <div class="address-form-overlay" id="addressFormOverlay" hidden>
      <form class="address-form" id="addressForm">
        <button type="button" class="review-modal-close" id="closeAddressForm" aria-label="Tutup">×</button>
        <h3 id="addressFormTitle">Tambah Alamat</h3>
        <p class="address-form-note">Isi data penerima agar paket sampai ke alamat yang tepat.</p>
        <input type="hidden" id="addressId">
        <div class="address-form-grid">
          <label>Label
            <input type="text" id="addressLabel" placeholder="Rumah, Kantor, Kost" required>
          </label>
          <label>Nama penerima
            <input type="text" id="addressRecipient" placeholder="Safhira" required>
          </label>
          <label>Telepon
            <input type="text" id="addressPhone" placeholder="+62 812-3456-7890" required>
          </label>
          <label>Kota / wilayah
            <input type="text" id="addressCity" placeholder="Medan, Sumatera Utara" required>
          </label>
        </div>
        <label>Alamat lengkap
          <textarea id="addressLine" placeholder="Nama jalan, nomor, kelurahan" required></textarea>
        </label>
        <label class="address-default-check">
          <input type="checkbox" id="addressDefault">
          Jadikan alamat utama
        </label>
        <button type="submit" class="btn btn-primary">Simpan Alamat</button>
      </form>
    </div>
  `;

  document.getElementById('addAddressBtn').addEventListener('click', () => openAddressForm());
  document.getElementById('closeAddressForm').addEventListener('click', closeAddressForm);
  document.getElementById('addressFormOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'addressFormOverlay') closeAddressForm();
  });
  document.getElementById('addressForm').addEventListener('submit', saveAddressForm);

  panel.querySelectorAll('[data-edit-address]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = addresses.find((addr) => addr.id === btn.dataset.editAddress);
      if (item) openAddressForm(item);
    });
  });
  panel.querySelectorAll('[data-delete-address]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!confirm('Hapus alamat ini?')) return;
      deleteAddress(user.id, btn.dataset.deleteAddress, user.name);
      renderAddress();
    });
  });
  panel.querySelectorAll('[data-default-address]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setDefaultAddress(user.id, btn.dataset.defaultAddress, user.name);
      renderAddress();
    });
  });
}

// Menampilkan satu kartu alamat.
function renderAddressCard(item) {
  return `
    <article class="address-card ${item.isDefault ? 'is-default' : ''}">
      <div class="address-card-map">
        <div class="address-pin" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div>
          <span class="address-badge">${item.isDefault ? 'Alamat utama' : escapeHtml(item.label)}</span>
          <p>${escapeHtml(item.city || item.label)}</p>
        </div>
      </div>
      <div class="address-card-body">
        <h3>${escapeHtml(item.recipient)}</h3>
        <p class="address-phone">${escapeHtml(item.phone)}</p>
        <p class="address-line">${escapeHtml(item.address)}</p>
        <div class="address-actions">
          <button class="address-action" type="button" data-edit-address="${item.id}">Edit</button>
          ${item.isDefault ? '' : `<button class="address-action" type="button" data-default-address="${item.id}">Jadikan utama</button>`}
          ${item.isDefault ? '' : `<button class="address-action is-danger" type="button" data-delete-address="${item.id}">Hapus</button>`}
        </div>
      </div>
    </article>
  `;
}

// Membuka formulir alamat.
function openAddressForm(item) {
  const overlay = document.getElementById('addressFormOverlay');
  document.getElementById('addressFormTitle').textContent = item ? 'Edit Alamat' : 'Tambah Alamat';
  document.getElementById('addressId').value = item?.id || '';
  document.getElementById('addressLabel').value = item?.label || '';
  document.getElementById('addressRecipient').value = item?.recipient || recipientName();
  document.getElementById('addressPhone').value = item?.phone || '';
  document.getElementById('addressCity').value = item?.city || '';
  document.getElementById('addressLine').value = item?.address || '';
  document.getElementById('addressDefault').checked = item?.isDefault || false;
  overlay.hidden = false;
}

// Menutup formulir alamat.
function closeAddressForm() {
  const overlay = document.getElementById('addressFormOverlay');
  if (overlay) overlay.hidden = true;
}

// Menyimpan alamat dari formulir.
function saveAddressForm(e) {
  e.preventDefault();
  upsertAddress(
    user.id,
    {
      id: document.getElementById('addressId').value || undefined,
      label: document.getElementById('addressLabel').value.trim(),
      recipient: document.getElementById('addressRecipient').value.trim(),
      phone: document.getElementById('addressPhone').value.trim(),
      city: document.getElementById('addressCity').value.trim(),
      address: document.getElementById('addressLine').value.trim(),
      isDefault: document.getElementById('addressDefault').checked,
    },
    user.name
  );
  closeAddressForm();
  renderAddress();
}

// Menampilkan riwayat cara bayar.
function renderPayment() {
  document.getElementById('accountContent').innerHTML = `
    <div class="account-panel-head">
      <div>
        <p class="account-kicker">Pembayaran</p>
        <h2>Metode Pembayaran</h2>
        <p class="account-content-desc">Kartu tersimpan untuk checkout yang lebih cepat dan aman.</p>
      </div>
    </div>
    <div class="account-payment-list">
      <article class="pay-card is-primary">
        <div class="pay-card-top">
          <span class="pay-chip"></span>
          <span class="account-payment-default">Utama</span>
        </div>
        <p class="payment-number">6091  ••••  ••••  7613</p>
        <div class="pay-card-bottom">
          <div>
            <p class="payment-type">Pemegang kartu</p>
            <strong>${recipientName()}</strong>
          </div>
          <div class="payment-logo mastercard-logo"><span></span><span></span></div>
        </div>
      </article>
      <article class="pay-card is-secondary">
        <div class="pay-card-top">
          <span class="pay-chip"></span>
        </div>
        <p class="payment-number">4567  ••••  ••••  9089</p>
        <div class="pay-card-bottom">
          <div>
            <p class="payment-type">Pemegang kartu</p>
            <strong>${recipientName()}</strong>
          </div>
          <div class="payment-logo visa-logo">VISA</div>
        </div>
      </article>
    </div>
  `;
}

// Menampilkan keterangan akun.
function renderAbout() {
  document.getElementById('accountContent').innerHTML = `
    <div class="account-panel-head">
      <div>
        <p class="account-kicker">BookStore</p>
        <h2>Tentang Aplikasi</h2>
        <p class="account-content-desc">Toko buku online untuk pembaca Novel, Komik, dan Cerpen.</p>
      </div>
    </div>

    <div class="about-hero">
      <div class="about-hero-mark">B</div>
      <div>
        <p class="about-hero-kicker">Toko buku digital</p>
        <h3>BookStore</h3>
        <p>Dirancang untuk pengalaman belanja buku yang tenang, rapi, dan nyaman — dari menemukan judul favorit hingga mengikuti pengiriman.</p>
      </div>
    </div>

    <div class="about-features">
      <article>
        <span>01</span>
        <h4>Katalog pilihan</h4>
        <p>Novel, komik, dan cerpen ditata rapi agar mudah dijelajahi.</p>
      </article>
      <article>
        <span>02</span>
        <h4>Pesanan terpantau</h4>
        <p>Lacak paket dari gudang hingga sampai di alamat Anda.</p>
      </article>
      <article>
        <span>03</span>
        <h4>Ulasan pembaca</h4>
        <p>Beri rating setelah paket diterima, langsung masuk ke admin.</p>
      </article>
    </div>

    <div class="about-meta-bar">
      <span>Versi 1.0.0</span>
      <span>© 2026 BookStore</span>
      <span>Medan · Indonesia</span>
    </div>
  `;
}

initProfilePhoto();
switchSection(activeSection);

if (typeof initReviewPrompt === 'function') {
  initReviewPrompt(user);
}

document.addEventListener('usk-review-submitted', () => {
  if (activeSection === 'orders') renderOrders();
});
