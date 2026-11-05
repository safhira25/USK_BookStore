const params = new URLSearchParams(window.location.search);
const fromCart = params.get('from') === 'cart';
const bookId = params.get('id');
let quantity = Math.max(1, parseInt(params.get('qty') || '1', 10));

const user = requireAuth(['user']);
if (!user) throw new Error('Unauthorized');

let cartItems = [];
let book = null;
let checkout = null;
let selectedPayment = '';
let bankMenuOpen = false;

const BANK_CHOICES = {
  mandiri: { label: 'Mandiri', account: '1370012345678' },
  bri: { label: 'BRI', account: '0045678901234' },
  ovo: { label: 'OVO', account: '0896-8990-3045' },
  bca: { label: 'BCA', account: '1234567890' },
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatIdDateTime(date) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${pad2(date.getHours())}:${pad2(date.getMinutes())} WIB`;
}

function getTransferSchedule() {
  const now = new Date();
  const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return {
    orderDate: formatIdDateTime(now),
    deadline: formatIdDateTime(deadline),
    dateShort: `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`,
  };
}

function renderTransferBox(total) {
  const bank = BANK_CHOICES[selectedPayment];
  const schedule = getTransferSchedule();
  const amount = formatPrice(total || 0);
  if (!bank) {
    return `<div class="transfer-box hidden" id="transferBox"></div>`;
  }
  return `
    <div class="transfer-box" id="transferBox">
      <h3>Detail Transfer ${bank.label}</h3>
      <p>Transfer ke ${bank.label} sesuai nominal, lalu klik Bayar Sekarang. Bukti TF diunggah di halaman berikutnya.</p>
      <div class="transfer-details">
        <div><span>Bank</span><strong>${bank.label}</strong></div>
        <div><span>No. Rekening</span><strong>${bank.account}</strong></div>
        <div><span>Atas Nama</span><strong>${escapeHtml(user.name)}</strong></div>
        <div><span>Nominal Transfer</span><strong class="transfer-amount">${amount}</strong></div>
        <div><span>Tanggal Pesanan</span><strong>${schedule.orderDate}</strong></div>
        <div><span>Tanggal (DD/MM/YYYY)</span><strong>${schedule.dateShort}</strong></div>
        <div><span>Batas Pembayaran</span><strong>${schedule.deadline}</strong></div>
      </div>
      <p class="transfer-note">Transfer sebelum batas waktu agar pesanan tidak dibatalkan otomatis.</p>
    </div>
  `;
}

function calcCheckout(bookItem, qty) {
  const order = bookItem.price * qty;
  const taxes = 5000;
  const delivery = 10000;
  return { order, taxes, delivery, total: order + taxes + delivery, totalQty: qty };
}

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

function getCheckoutQuery() {
  return fromCart ? 'from=cart' : `id=${encodeURIComponent(bookId)}&qty=${quantity}`;
}

function renderQtyControl(currentQty, id, maxStock) {
  return `
    <div class="qty-control checkout-qty-control" data-id="${id || ''}">
      <button type="button" class="qty-minus" data-id="${id || ''}" aria-label="Kurangi" ${currentQty <= 1 ? 'disabled' : ''}>−</button>
      <span class="qty-value">${currentQty}</span>
      <button type="button" class="qty-plus" data-id="${id || ''}" aria-label="Tambah" ${currentQty >= maxStock ? 'disabled' : ''}>+</button>
    </div>
  `;
}

function renderBookPreview() {
  if (fromCart) {
    return `
      <div class="checkout-cart-preview">
        ${cartItems
          .map((item) => {
            const stock = getBooks().find((b) => b.id === item.id)?.stock ?? item.qty;
            return `
          <div class="checkout-book-preview checkout-book-preview-with-qty" data-id="${item.id}">
            <img src="${item.cover}" alt="${item.title}">
            <div class="checkout-book-preview-body">
              <h3>${item.title}</h3>
              <p>${item.author}</p>
              <span class="checkout-item-price">${formatPrice(item.price)} / buku</span>
              <div class="checkout-qty-row">
                <span class="checkout-qty-label">Jumlah</span>
                ${renderQtyControl(item.qty, item.id, stock)}
              </div>
            </div>
          </div>
        `;
          })
          .join('')}
      </div>
    `;
  }

  return `
    <div class="checkout-book-preview checkout-book-preview-with-qty">
      <img src="${book.cover}" alt="${book.title}">
      <div class="checkout-book-preview-body">
        <h3>${book.title}</h3>
        <p>${book.author}</p>
        <span class="checkout-item-price">${formatPrice(book.price)} / buku</span>
        <div class="checkout-qty-row">
          <span class="checkout-qty-label">Jumlah</span>
          ${renderQtyControl(quantity, '', book.stock)}
        </div>
      </div>
    </div>
  `;
}

function getOrderLabel() {
  return fromCart ? `Pesanan (${checkout.totalQty} buku)` : `Pesanan (${quantity} buku)`;
}

function renderOrderSummary() {
  return `
    <h2>Ringkasan Pesanan</h2>
    ${renderBookPreview()}
    <div class="summary-lines payment-summary-lines">
      <div class="summary-line">
        <span id="orderLabel">${getOrderLabel()}</span>
        <strong id="sumOrder">${formatPrice(checkout.order)}</strong>
      </div>
      <div class="summary-line">
        <span>Pajak</span>
        <strong id="sumTax">${formatPrice(checkout.taxes)}</strong>
      </div>
      <div class="summary-line">
        <span>Biaya Pengiriman</span>
        <strong id="sumDelivery">${formatPrice(checkout.delivery)}</strong>
      </div>
    </div>
    <div class="summary-divider"></div>
    <div class="summary-line summary-total">
      <span>Total:</span>
      <strong id="sumTotal">${formatPrice(checkout.total)}</strong>
    </div>
    <div class="summary-line summary-eta">
      <span>Estimasi waktu pengiriman:</span>
      <strong>2 - 5 hari</strong>
    </div>
    <div class="checkout-footer">
      <div class="checkout-footer-price">
        <span>Total Harga</span>
        <strong id="footerTotal">${formatPrice(checkout.total)}</strong>
      </div>
      <button type="button" class="btn checkout-btn" id="payBtn">Bayar Sekarang</button>
    </div>
  `;
}

function attachQtyListeners() {
  document.querySelectorAll('.qty-minus').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (fromCart) {
        const item = cartItems.find((i) => i.id === btn.dataset.id);
        if (!item || item.qty <= 1) return;
        updateCartQty(user.id, btn.dataset.id, item.qty - 1);
      } else if (quantity > 1) {
        quantity -= 1;
      }
      refreshPaymentView();
    });
  });

  document.querySelectorAll('.qty-plus').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (fromCart) {
        const item = cartItems.find((i) => i.id === btn.dataset.id);
        const stockBook = getBooks().find((b) => b.id === btn.dataset.id);
        if (!item || !stockBook || item.qty >= stockBook.stock) return;
        updateCartQty(user.id, btn.dataset.id, item.qty + 1);
      } else if (quantity < book.stock) {
        quantity += 1;
      }
      refreshPaymentView();
    });
  });
}

function refreshPaymentView() {
  recalcCheckout();
  const isValid = fromCart
    ? cartItems.length > 0 && cartItems.every((item) => {
        const b = getBooks().find((bk) => bk.id === item.id);
        return b && b.stock >= item.qty;
      })
    : book && book.stock >= quantity;

  if (!isValid || !checkout) {
    document.getElementById('paymentContent').classList.add('hidden');
    document.getElementById('paymentError').classList.remove('hidden');
    return;
  }

  document.getElementById('paymentError').classList.add('hidden');
  document.getElementById('paymentContent').classList.remove('hidden');

  const summary = document.getElementById('paymentOrderSummary');
  if (summary) {
    summary.innerHTML = renderOrderSummary();
    document.getElementById('payBtn').addEventListener('click', handlePay);
    attachQtyListeners();
  }
}

function renderSidebar() {
  const sidebar = document.getElementById('paymentSidebar');
  sidebar.innerHTML = `
    <div class="sidebar-avatar" onclick="location.href='account.html'"></div>
    <nav class="sidebar-nav">
      <button class="nav-item" type="button" onclick="location.href='user.html'" title="Beranda">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z"/></svg>
      </button>
      <button class="nav-item" type="button" onclick="location.href='cart.html'" title="Keranjang">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      </button>
      <button class="nav-item active" title="Pembayaran">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
      </button>
    </nav>
  `;
  applyAvatar(sidebar.querySelector('.sidebar-avatar'), user);
}

function renderPaymentPage() {
  const isValid = fromCart
    ? cartItems.length > 0 && cartItems.every((item) => {
        const b = getBooks().find((bk) => bk.id === item.id);
        return b && b.stock >= item.qty;
      })
    : book && book.stock >= quantity;

  if (!isValid || !checkout) {
    document.getElementById('paymentContent').classList.add('hidden');
    document.getElementById('paymentError').classList.remove('hidden');
    return;
  }

  document.getElementById('paymentContent').innerHTML = `
    <section class="payment-methods-panel">
      <h2 class="payment-section-title">Metode Bank</h2>
      <div class="payment-method-card">
        <button type="button" class="payment-method-row payment-method-row-arrow ${BANK_CHOICES[selectedPayment] ? 'active' : ''} ${bankMenuOpen ? 'is-open' : ''}" data-toggle="bank">
          <div class="payment-method-icon payment-method-icon-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div class="payment-method-info">
            <strong>Transfer Bank</strong>
            <span>${BANK_CHOICES[selectedPayment] ? BANK_CHOICES[selectedPayment].label + ' ' + BANK_CHOICES[selectedPayment].account : 'Pilih bank tujuan'}</span>
          </div>
          <span class="payment-method-chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </button>
        <div class="payment-bank-choices ${bankMenuOpen ? '' : 'hidden'}" id="bankChoices">
          <button type="button" class="payment-method-row ${selectedPayment === 'mandiri' ? 'active' : ''}" data-payment="mandiri">
            <div class="payment-method-icon">
              <img class="bank-brand-logo" src="assets/logo-mandiri.svg" alt="Mandiri">
            </div>
            <div class="payment-method-info">
              <strong>Mandiri</strong>
              <span>1370012345678</span>
            </div>
          </button>
          <button type="button" class="payment-method-row ${selectedPayment === 'bri' ? 'active' : ''}" data-payment="bri">
            <div class="payment-method-icon">
              <img class="bank-brand-logo" src="assets/logo-bri-mark.png" alt="BRI">
            </div>
            <div class="payment-method-info">
              <strong>BRI</strong>
              <span>0045678901234</span>
            </div>
          </button>
          <button type="button" class="payment-method-row ${selectedPayment === 'ovo' ? 'active' : ''}" data-payment="ovo">
            <div class="payment-method-icon">
              <div class="payment-logo ovo-logo">OVO</div>
            </div>
            <div class="payment-method-info">
              <strong>OVO</strong>
              <span>0896-8990-3045</span>
            </div>
          </button>
          <button type="button" class="payment-method-row ${selectedPayment === 'bca' ? 'active' : ''}" data-payment="bca">
            <div class="payment-method-icon">
              <div class="payment-logo bca-logo">BCA</div>
            </div>
            <div class="payment-method-info">
              <strong>BCA</strong>
              <span>1234567890</span>
            </div>
          </button>
          ${renderTransferBox(checkout?.total)}
        </div>
        <button type="button" class="payment-method-row payment-method-row-arrow ${selectedPayment === 'cod' ? 'active' : ''}" data-payment="cod">
          <div class="payment-method-icon payment-method-icon-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          </div>
          <div class="payment-method-info">
            <strong>COD (Bayar di Tempat)</strong>
            <span>Bayar saat pesanan diterima</span>
          </div>
          <span class="payment-method-chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </button>
      </div>
    </section>

    <aside class="checkout-panel checkout-summary payment-summary" id="paymentOrderSummary">
      ${renderOrderSummary()}
    </aside>
  `;

  document.querySelector('[data-toggle="bank"]')?.addEventListener('click', () => {
    bankMenuOpen = !bankMenuOpen;
    renderPaymentPage();
  });

  document.querySelectorAll('[data-payment]').forEach((row) => {
    row.addEventListener('click', () => {
      selectedPayment = row.dataset.payment;
      if (selectedPayment === 'cod') bankMenuOpen = false;
      renderPaymentPage();
    });
  });

  attachQtyListeners();
  document.getElementById('payBtn').addEventListener('click', handlePay);
}

function goPaymentSuccess(order) {
  const pay = encodeURIComponent(selectedPayment || order.paymentMethod || '');
  window.location.href = `payment-success.html?order=${encodeURIComponent(order.id)}&pay=${pay}&v=1021`;
}

function handlePay() {
  if (!selectedPayment) {
    alert('Pilih Transfer Bank, lalu tunjuk bank tujuannya.');
    bankMenuOpen = true;
    renderPaymentPage();
    return;
  }
  if (selectedPayment === 'bank') {
    alert('Tunjuk salah satu: Mandiri, BRI, OVO, atau BCA.');
    bankMenuOpen = true;
    renderPaymentPage();
    return;
  }
  const extras = {
    paymentMethod: selectedPayment,
    paymentProof: '',
    total: checkout?.total,
  };

  try {
    if (fromCart) {
      const order = createOrderFromCart(user.id, user.name, extras);
      if (!order) {
        alert('Pesanan tidak valid atau stok tidak mencukupi.');
        return;
      }
      goPaymentSuccess(order);
      return;
    }

    const order = createOrder(user.name, book, quantity, user.id, extras);
    goPaymentSuccess(order);
  } catch (error) {
    alert('Gagal menyimpan pesanan. Coba lagi.');
  }
}

document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = `checkout.html?${getCheckoutQuery()}`;
});

document.getElementById('errorBackBtn').addEventListener('click', () => {
  window.location.href = fromCart ? 'cart.html' : 'user.html';
});

renderSidebar();
renderPaymentPage();
