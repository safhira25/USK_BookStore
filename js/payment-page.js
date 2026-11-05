// File: js/payment-page.js
// Deskripsi: Skrip halaman pembayaran transfer bank.
const params = new URLSearchParams(window.location.search);
const fromCart = params.get('from') === 'cart';
const bookId = params.get('id');
let quantity = Math.max(1, parseInt(params.get('qty') || '1', 10));

// Memastikan hanya akun yang sesuai yang boleh membuka halaman ini.
const user = requireAuth(['user']);
if (!user) throw new Error('Unauthorized');

// Data rekening untuk pembayaran transfer.
const BANK_NAME = 'BCA';
const BANK_HOLDER = 'USK BOOKSTORE';
const BANK_ACCOUNT = '1234567890';

let cartItems = [];
let book = null;
let checkout = null;
let paymentProofData = '';

// Menghitung rincian harga pesanan.
function calcCheckout(bookItem, qty) {
  const order = bookItem.price * qty;
  const taxes = 5000;
  const delivery = 10000;
  return { order, taxes, delivery, total: order + taxes + delivery, totalQty: qty };
}

// Menghitung ulang total saat jumlah barang berubah.
function recalcCheckout() {
  if (fromCart) {
    cartItems = getCartItems(user.id);
    checkout = cartItems.length > 0 ? calcCartTotals(cartItems) : null;
    return;
  }
  book = getBookById(bookId);
  if (book) {
    quantity = Math.min(Math.max(1, quantity), book.stock);
    checkout = calcCheckout(book, quantity);
  } else {
    checkout = null;
  }
}

recalcCheckout();

// Menyusun data pesanan yang dibawa ke halaman berikutnya.
function getCheckoutQuery() {
  return fromCart ? 'from=cart' : `id=${encodeURIComponent(bookId)}&qty=${quantity}`;
}

// Memeriksa apakah data pembayaran sudah lengkap.
function isCheckoutValid() {
  if (!checkout) return false;
  if (fromCart) {
    return cartItems.length > 0 && cartItems.every((item) => {
      const stockBook = getBooks().find((entry) => entry.id === item.id);
      return stockBook && stockBook.stock >= item.qty;
    });
  }
  return Boolean(book && book.stock >= quantity);
}

// Mengubah tanggal pembayaran menjadi tulisan yang mudah dibaca.
function formatPayDate(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}.${pad(date.getMinutes())}`;
}

// Menampilkan ringkasan tagihan sebelum dibayar.
function previewInvoice() {
  const next = getOrders().length + 1;
  return `ORD-${String(next).padStart(3, '0')}`;
}

// Menampilkan menu samping.
function renderSidebar() {
  const sidebar = document.getElementById('paymentSidebar');
  sidebar.innerHTML = `
    <div class="sidebar-avatar" onclick="location.href='akun.html'"></div>
    <nav class="sidebar-nav">
      <button class="nav-item" type="button" onclick="location.href='pengguna.html'" title="Beranda">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z"/></svg>
      </button>
      <button class="nav-item" type="button" onclick="location.href='keranjang.html'" title="Keranjang">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      </button>
      <button class="nav-item active" title="Pembayaran">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
      </button>
    </nav>
  `;
  applyAvatar(sidebar.querySelector('.sidebar-avatar'), user);
}

// Menampilkan halaman pembayaran.
function renderPaymentPage() {
  if (!isCheckoutValid()) {
    document.getElementById('paymentContent').classList.add('hidden');
    document.getElementById('paymentError').classList.remove('hidden');
    return;
  }

  document.getElementById('paymentError').classList.add('hidden');
  document.getElementById('paymentContent').classList.remove('hidden');
  document.getElementById('paymentContent').innerHTML = `
    <section class="pay-layout">
      <div class="pay-stack">
        <article class="pay-card">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10h18"/><path d="M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><path d="M7 15h4"/></svg>
            Transfer Bank
          </h2>
          <div class="pay-bank">
            <p class="pay-bank-label">Bank tujuan</p>
            <p class="pay-bank-name">${BANK_NAME}</p>
            <p class="pay-bank-holder">Atas nama ${BANK_HOLDER}</p>
            <p class="pay-bank-number">${BANK_ACCOUNT}</p>
            <button type="button" class="pay-copy" id="copyAccountBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span>Salin nomor rekening</span>
            </button>
          </div>
          <div class="pay-total-row">
            <span>Total yang harus dibayar</span>
            <strong>${formatPrice(checkout.total)}</strong>
          </div>
          <div class="pay-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <p>Transfer sesuai nominal tagihan. Setelah itu, unggah bukti transfer yang jelas dan pastikan nominal serta penerimanya terlihat.</p>
          </div>
        </article>

        <article class="pay-card">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            Bukti Transfer
          </h2>
          <p class="pay-proof-lead">Pilih foto atau screenshot bukti transfer</p>
          <label class="pay-file">
            <input type="file" id="proofInput" accept="image/jpeg,image/png,image/webp">
          </label>
          <p class="pay-proof-hint">Format JPG, PNG, atau WEBP. Maksimal 2 MB. Bukti akan diperiksa admin sebelum pesanan diproses.</p>
          <div class="proof-preview ${paymentProofData ? '' : 'hidden'}" id="proofPreviewWrap">
            <img id="proofPreview" alt="Pratinjau bukti transfer" src="${paymentProofData || ''}">
          </div>
        </article>
      </div>

      <aside class="pay-stack">
        <article class="pay-card">
          <h2>Detail Pesanan</h2>
          <div class="pay-meta">
            <div class="pay-meta-row">
              <span>Nomor pesanan</span>
              <strong>${previewInvoice()}</strong>
            </div>
            <div class="pay-meta-row">
              <span>Tanggal</span>
              <strong>${formatPayDate(new Date())}</strong>
            </div>
            <div class="pay-meta-row">
              <span>Metode</span>
              <strong>Transfer Bank</strong>
            </div>
            <div class="pay-meta-row">
              <span>Status pesanan</span>
              <strong>Menunggu Pembayaran</strong>
            </div>
          </div>
        </article>

        <article class="pay-card">
          <h2>Cara Pembayaran</h2>
          <ol class="pay-steps">
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10h18"/><path d="M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/></svg>
              <span>Transfer ke rekening yang tertera.</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Unggah bukti transfer sesuai nominal tagihan.</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg>
              <span>Tunggu admin memeriksa pembayaran.</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
              <span>Pesanan diproses setelah pembayaran dikonfirmasi.</span>
            </li>
          </ol>
          <button type="button" class="pay-orders-btn" id="payBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>
            Lihat Pesanan Saya
          </button>
        </article>
      </aside>
    </section>
  `;

  document.getElementById('copyAccountBtn').addEventListener('click', copyAccountNumber);
  document.getElementById('proofInput').addEventListener('change', onProofSelected);
  document.getElementById('payBtn').addEventListener('click', handlePay);
}

// Menyalin nomor rekening ke papan tempel.
async function copyAccountNumber() {
  const label = document.querySelector('#copyAccountBtn span');
  try {
    await navigator.clipboard.writeText(BANK_ACCOUNT);
  } catch (error) {
    const field = document.createElement('textarea');
    field.value = BANK_ACCOUNT;
    document.body.appendChild(field);
    field.select();
    document.execCommand('copy');
    field.remove();
  }
  if (!label) return;
  label.textContent = 'Nomor rekening tersalin';
  setTimeout(() => {
    label.textContent = 'Salin nomor rekening';
  }, 1600);
}

// Menyimpan bukti transfer yang dipilih pengguna.
function onProofSelected(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    alert('Format bukti transfer harus JPG, PNG, atau WEBP.');
    event.target.value = '';
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    alert('Ukuran bukti bayar maksimal 2MB.');
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    paymentProofData = String(reader.result || '');
    const wrap = document.getElementById('proofPreviewWrap');
    const img = document.getElementById('proofPreview');
    if (img) img.src = paymentProofData;
    wrap?.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

// Memproses tombol bayar.
function handlePay() {
  if (!paymentProofData) {
    alert('Unggah bukti transfer terlebih dahulu.');
    document.getElementById('proofInput')?.focus();
    return;
  }

  const extras = {
    paymentMethod: 'bank',
    paymentProof: paymentProofData,
    total: checkout?.total,
  };

  try {
    if (fromCart) {
      const order = createOrderFromCart(user.id, user.name, extras);
      if (!order) {
        alert('Pesanan tidak valid atau stok tidak mencukupi.');
        return;
      }
      window.location.href = `pembayaran-berhasil.html?order=${encodeURIComponent(order.id)}`;
      return;
    }

    const order = createOrder(user.name, book, quantity, user.id, extras);
    window.location.href = `pembayaran-berhasil.html?order=${encodeURIComponent(order.id)}`;
  } catch (error) {
    alert('Gagal menyimpan pesanan. Ukuran bukti bayar mungkin terlalu besar (maks. 2MB).');
  }
}

document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = `penyelesaian.html?${getCheckoutQuery()}`;
});

document.getElementById('errorBackBtn').addEventListener('click', () => {
  window.location.href = fromCart ? 'keranjang.html' : 'pengguna.html';
});

renderSidebar();
renderPaymentPage();
