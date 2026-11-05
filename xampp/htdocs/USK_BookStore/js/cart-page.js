const user = requireAuth(['user']);
if (!user) throw new Error('Unauthorized');

let payMethod = 'bank';

applyAvatar(document.getElementById('sidebarAvatar'), user);
document.getElementById('sidebarAvatar').addEventListener('click', () => {
  window.location.href = 'account.html';
});

function renderCart() {
  const items = getCartItems(user.id);
  const container = document.getElementById('cartContent');

  if (items.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <h2>Keranjang kosong</h2>
        <p>Belum ada buku di keranjang Anda.</p>
        <button class="btn btn-primary btn-sm" type="button" onclick="location.href='user.html'">Mulai Belanja</button>
      </div>
    `;
    return;
  }

  const totals = calcCartTotals(items);

  container.innerHTML = `
    <section class="cart-items-panel">
      ${items
        .map(
          (item) => `
        <article class="cart-item" data-id="${item.id}">
          <img class="cart-item-cover" src="${item.cover}" alt="${item.title}">
          <div class="cart-item-info">
            <h3>${item.title}</h3>
            <p class="cart-item-author">${item.author}</p>
            <p class="cart-item-price">${formatPrice(item.price)}</p>
          </div>
          <div class="cart-item-qty">
            <div class="qty-control">
              <button type="button" class="qty-minus" data-id="${item.id}" aria-label="Kurangi">−</button>
              <span class="qty-value">${item.qty}</span>
              <button type="button" class="qty-plus" data-id="${item.id}" aria-label="Tambah">+</button>
            </div>
          </div>
        </article>
      `
        )
        .join('')}
    </section>

    <aside class="cart-summary-panel">
      <h2>Ringkasan Pesanan</h2>
      <div class="cart-summary-lines">
        <div class="cart-summary-line">
          <span>Pesanan (${totals.totalQty} buku)</span>
          <strong id="sumOrder">${formatPrice(totals.order)}</strong>
        </div>
        <div class="cart-summary-line">
          <span>Pajak</span>
          <strong id="sumTax">${formatPrice(totals.taxes)}</strong>
        </div>
        <div class="cart-summary-line">
          <span>Biaya Pengiriman</span>
          <strong id="sumDelivery">${formatPrice(totals.delivery)}</strong>
        </div>
      </div>
      <div class="cart-summary-divider"></div>
      <div class="cart-summary-line cart-summary-total">
        <span>Total:</span>
        <strong id="sumTotal">${formatPrice(totals.total)}</strong>
      </div>
      <div class="cart-pay-methods" role="radiogroup" aria-label="Metode Pembayaran">
        <span class="cart-pay-label">Metode Pembayaran</span>
        <label class="cart-pay-option">
          <input type="radio" name="payMethod" value="bank" ${payMethod === 'bank' ? 'checked' : ''}>
          <span>Transfer Bank</span>
        </label>
        <label class="cart-pay-option">
          <input type="radio" name="payMethod" value="cash" ${payMethod === 'cash' ? 'checked' : ''}>
          <span>Tunai</span>
        </label>
      </div>
      <button type="button" class="cart-checkout-btn" id="checkoutBtn">Pesan Sekarang</button>
    </aside>
  `;

  container.querySelectorAll('.qty-minus').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = items.find((i) => i.id === btn.dataset.id);
      updateCartQty(user.id, btn.dataset.id, item.qty - 1);
      renderCart();
    });
  });

  container.querySelectorAll('.qty-plus').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = items.find((i) => i.id === btn.dataset.id);
      const book = getBooks().find((b) => b.id === btn.dataset.id);
      if (item.qty >= book.stock) return;
      updateCartQty(user.id, btn.dataset.id, item.qty + 1);
      renderCart();
    });
  });

  container.querySelectorAll('input[name="payMethod"]').forEach((input) => {
    input.addEventListener('change', () => {
      payMethod = input.value;
    });
  });

  document.getElementById('checkoutBtn').addEventListener('click', () => {
    const order = createOrderFromCart(user.id, user.name, {
      paymentMethod: payMethod,
      paymentProof: '',
      total: totals.total,
    });
    if (!order) {
      alert('Pesanan tidak valid atau stok tidak mencukupi.');
      renderCart();
      return;
    }
    if (payMethod === 'cash') {
      window.location.href = 'account.html?tab=orders';
      return;
    }
    window.location.href = `payment-success.html?order=${encodeURIComponent(order.id)}&pay=bank`;
  });
}

document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = 'user.html';
});

renderCart();
