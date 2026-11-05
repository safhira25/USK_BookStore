const params = new URLSearchParams(window.location.search);

const fromCart = params.get('from') === 'cart';

const bookId = params.get('id');

let quantity = Math.max(1, parseInt(params.get('qty') || '1', 10));



const user = requireAuth(['user']);

if (!user) throw new Error('Unauthorized');



let cartItems = [];

let book = null;

let checkout = null;



function calcCheckout(bookItem, qty) {

  const order = bookItem.price * qty;

  const taxes = 5000;

  const delivery = 10000;

  const total = order + taxes + delivery;

  return { order, taxes, delivery, total, totalQty: qty };

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



function updateSummaryUI() {

  document.getElementById('sumOrder').textContent = formatPrice(checkout.order);

  document.getElementById('sumTax').textContent = formatPrice(checkout.taxes);

  document.getElementById('sumDelivery').textContent = formatPrice(checkout.delivery);

  document.getElementById('sumTotal').textContent = formatPrice(checkout.total);

  document.getElementById('footerTotal').textContent = formatPrice(checkout.total);

  const label = document.getElementById('orderLabel');

  if (label) label.textContent = getOrderLabel();

}



function attachQtyListeners() {

  document.querySelectorAll('.qty-minus').forEach((btn) => {

    btn.addEventListener('click', () => {

      if (fromCart) {

        const item = cartItems.find((i) => i.id === btn.dataset.id);

        if (!item || item.qty <= 1) return;

        updateCartQty(user.id, btn.dataset.id, item.qty - 1);

      } else {

        if (quantity <= 1) return;

        quantity -= 1;

      }

      refreshCheckoutView();

    });

  });



  document.querySelectorAll('.qty-plus').forEach((btn) => {

    btn.addEventListener('click', () => {

      if (fromCart) {

        const item = cartItems.find((i) => i.id === btn.dataset.id);

        const stockBook = getBooks().find((b) => b.id === btn.dataset.id);

        if (!item || !stockBook || item.qty >= stockBook.stock) return;

        updateCartQty(user.id, btn.dataset.id, item.qty + 1);

      } else {

        if (quantity >= book.stock) return;

        quantity += 1;

      }

      refreshCheckoutView();

    });

  });

}



function refreshCheckoutView() {

  recalcCheckout();

  const isValid = fromCart

    ? cartItems.length > 0 && cartItems.every((item) => {

        const b = getBooks().find((bk) => bk.id === item.id);

        return b && b.stock >= item.qty;

      })

    : book && book.stock >= quantity;



  if (!isValid || !checkout) {

    document.getElementById('checkoutContent').classList.add('hidden');

    document.getElementById('checkoutError').classList.remove('hidden');

    return;

  }



  document.getElementById('checkoutError').classList.add('hidden');
  document.getElementById('checkoutContent').classList.remove('hidden');

  const orderPanel = document.querySelector('.checkout-order');
  if (orderPanel) {
    orderPanel.innerHTML = `
      <h2>Detail Pesanan</h2>
      <p class="checkout-panel-desc">Periksa buku yang akan Anda beli sebelum melanjutkan ke pembayaran.</p>
      ${renderBookPreview()}
    `;
  }

  updateSummaryUI();
  attachQtyListeners();
}



function escapeCheckout(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderCheckoutAddress() {
  const box = document.getElementById('checkoutAddress');
  if (!box || typeof getAddresses !== 'function') return;

  const addresses = getAddresses(user.id, user.name);
  const selected = getSelectedAddress(user.id, user.name);

  box.innerHTML = `
    <div class="checkout-address-head">
      <div>
        <h2>Alamat Pengiriman</h2>
        <p class="checkout-panel-desc">Pilih alamat tujuan sesuai keinginan Anda.</p>
      </div>
      <button type="button" class="btn btn-secondary btn-sm" id="checkoutAddAddress">Tambah alamat</button>
    </div>
    <div class="checkout-address-list">
      ${addresses
        .map(
          (item) => `
        <label class="checkout-address-option ${selected?.id === item.id ? 'is-active' : ''}">
          <input type="radio" name="shipAddress" value="${item.id}" ${selected?.id === item.id ? 'checked' : ''}>
          <span class="checkout-address-check" aria-hidden="true"></span>
          <span class="checkout-address-copy">
            <strong>${escapeCheckout(item.recipient)}</strong>
            <em>${escapeCheckout(item.label)}${item.isDefault ? ' · Utama' : ''}</em>
            <small>${escapeCheckout(item.phone)}</small>
            <small>${escapeCheckout(item.address)}</small>
          </span>
        </label>
      `
        )
        .join('')}
    </div>
  `;

  box.querySelectorAll('input[name="shipAddress"]').forEach((input) => {
    input.addEventListener('change', () => {
      setSelectedAddress(user.id, input.value);
      renderCheckoutAddress();
    });
  });

  document.getElementById('checkoutAddAddress')?.addEventListener('click', () => {
    window.location.href = 'account.html?tab=address';
  });
}

function renderSidebar() {

  const sidebar = document.getElementById('checkoutSidebar');

  sidebar.innerHTML = `

    <div class="sidebar-avatar" onclick="location.href='account.html'"></div>

    <nav class="sidebar-nav">

      <button class="nav-item" type="button" onclick="location.href='user.html'" title="Beranda">

        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z"/></svg>

      </button>

      <button class="nav-item" type="button" onclick="location.href='love.html'" title="Love">

        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>

      </button>

      <button class="nav-item" type="button" onclick="location.href='cart.html'" title="Keranjang">

        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>

      </button>

      <button class="nav-item active" title="Checkout">

        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>

      </button>

    </nav>

  `;

  applyAvatar(sidebar.querySelector('.sidebar-avatar'), user);

}



function renderCheckout() {

  const isValid = fromCart

    ? cartItems.length > 0 && cartItems.every((item) => {

        const b = getBooks().find((bk) => bk.id === item.id);

        return b && b.stock >= item.qty;

      })

    : book && book.stock >= quantity;



  if (!isValid || !checkout) {

    document.getElementById('checkoutContent').classList.add('hidden');

    document.getElementById('checkoutError').classList.remove('hidden');

    return;

  }



  document.title = fromCart ? 'Checkout Keranjang | BookStore' : `Checkout - ${book.title} | BookStore`;



  document.getElementById('checkoutContent').innerHTML = `

    <section class="checkout-panel checkout-address" id="checkoutAddress"></section>

    <section class="checkout-panel checkout-order">

      <h2>Detail Pesanan</h2>

      <p class="checkout-panel-desc">Periksa buku yang akan Anda beli sebelum melanjutkan ke pembayaran.</p>

      ${renderBookPreview()}

    </section>



    <aside class="checkout-panel checkout-summary">

      <h2>Ringkasan Pesanan</h2>



      <div class="summary-lines">

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

        <button type="button" class="btn checkout-btn" id="checkoutBtn">Lanjut Pembayaran</button>

      </div>

    </aside>

  `;



  attachQtyListeners();

  document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);

  renderCheckoutAddress();

}



function getCheckoutQuery() {

  return fromCart ? 'from=cart' : `id=${encodeURIComponent(bookId)}&qty=${quantity}`;

}



function handleCheckout() {

  window.location.href = `payment.html?${getCheckoutQuery()}`;

}



document.getElementById('backBtn').addEventListener('click', () => {

  if (fromCart) {

    window.location.href = 'cart.html';

    return;

  }

  window.location.href = bookId ? `book-detail.html?id=${bookId}` : 'user.html';

});



document.getElementById('errorBackBtn').addEventListener('click', () => {

  window.location.href = fromCart ? 'cart.html' : 'user.html';

});



renderSidebar();

renderCheckout();


