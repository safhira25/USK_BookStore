const user = requireAuth(['user']);
if (!user) throw new Error('Unauthorized');

applyAvatar(document.getElementById('sidebarAvatar'), user);
document.getElementById('sidebarAvatar').addEventListener('click', () => {
  window.location.href = 'account.html';
});

const params = new URLSearchParams(window.location.search);
const orderId = params.get('order');

function refundSentence(order) {
  if (order.refunded) {
    return `Uang ${formatPrice(order.refundAmount || order.total)} telah dikembalikan ke saldo Anda.`;
  }
  return 'Pembayaran belum masuk, jadi tidak ada uang yang dikembalikan.';
}

function cancelledTimeline(order) {
  return [
    {
      title: 'Pesanan dibatalkan',
      desc: 'Pengiriman dihentikan. Paket tidak dilanjutkan ke alamat Anda.',
      location: 'BookStore',
      timeLabel: 'Dibatalkan',
      done: true,
      current: false,
      upcoming: false,
    },
    {
      title: order.refunded ? 'Uang dikembalikan' : 'Tidak ada pengembalian dana',
      desc: refundSentence(order),
      location: 'Saldo user',
      timeLabel: 'Selesai',
      done: false,
      current: true,
      upcoming: false,
    },
  ];
}

function copyResi(resi) {
  const done = () => {
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.textContent = 'Nomor resi disalin';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(resi).then(done).catch(done);
    return;
  }
  done();
}

let lastRenderedStep = -1;

function renderTrackingPage() {
  const container = document.getElementById('trackingContent');
  const order = orderId ? getOrderById(orderId) : null;
  if (order && typeof repairCancelledRefund === 'function' && repairCancelledRefund(order)) {
    const orders = getOrders();
    const index = orders.findIndex((item) => item.id === order.id);
    if (index !== -1) {
      orders[index].refunded = true;
      orders[index].refundAmount = order.refundAmount;
      saveOrders(orders);
    }
  }

  if (!order) {
    container.innerHTML = `
      <div class="tracking-empty">
        <h2>Pesanan tidak ditemukan</h2>
        <p>ID pesanan tidak valid atau belum ada paket yang bisa dilacak.</p>
        <button class="btn btn-primary btn-sm" type="button" onclick="location.href='account.html?tab=orders'">Lihat Pesanan Saya</button>
      </div>
    `;
    return;
  }

  const cancelled = order.status === 'cancelled';
  const currentIndex = getTrackingStepIndex(order);
  const renderKey = cancelled ? 'cancelled' : String(currentIndex);
  if (renderKey === lastRenderedStep && container.innerHTML.trim()) return;
  lastRenderedStep = renderKey;

  attachOrderTracking(order, user.name);
  const timeline = cancelled ? cancelledTimeline(order) : getTrackingTimeline(order);
  const current = timeline.find((step) => step.current) || timeline[timeline.length - 1];
  const tracking = order.tracking;

  container.innerHTML = `
    <div class="tracking-status-banner">
      <div>
        <span class="tracking-status-label">${cancelled ? 'Status pesanan' : 'Posisi paket sekarang'}</span>
        <strong>${cancelled ? 'Pesanan dibatalkan' : current.title}</strong>
        <p>${cancelled ? refundSentence(order) : current.location}</p>
      </div>
      <span class="status-badge ${order.status}">${order.status === 'cancelled' ? 'Dibatalkan' : order.status === 'completed' ? 'Selesai' : order.status === 'shipped' ? 'Dikirim' : 'Diproses'}</span>
    </div>
    ${
      order.status === 'completed'
        ? `<div class="tracking-review-banner">
            ${
              getReviewByOrderId(order.id)
                ? `<p>Terima kasih, ulasan ${getReviewByOrderId(order.id).rating} bintang sudah dikirim ke admin.</p>`
                : `<p>Paket sudah diterima. Beri rating dan ulasan untuk pesanan ini.</p>
                   <button type="button" class="account-review-btn" id="trackingReviewBtn">Beri ulasan</button>`
            }
          </div>`
        : ''
    }

    <div class="tracking-grid">
      <section class="tracking-card">
        <h2>Riwayat Pengiriman</h2>
        <div class="tracking-route">
          <span>${tracking.origin}</span>
          <span class="tracking-route-line"></span>
          <span>${tracking.destination}</span>
        </div>
        <ol class="tracking-timeline">
          ${timeline
            .map(
              (step) => `
            <li class="${step.done ? 'is-done' : ''} ${step.current ? 'is-current' : ''} ${step.upcoming ? 'is-upcoming' : ''}">
              <span class="tracking-dot"></span>
              <div>
                <strong>${step.title}</strong>
                <p>${step.desc}</p>
                <span class="tracking-meta">${step.location} · ${step.timeLabel}</span>
              </div>
            </li>
          `
            )
            .join('')}
        </ol>
      </section>

      <aside class="tracking-side">
        <section class="tracking-card">
          <h2>Alamat Pengiriman</h2>
          <p class="tracking-recipient">${tracking.recipient}</p>
          <p>${tracking.phone}</p>
          <p>${tracking.address}</p>
        </section>
        <section class="tracking-card">
          <h2>Detail Pengiriman</h2>
          <div class="tracking-detail-row"><span>ID Pesanan</span><strong>${order.id}</strong></div>
          <div class="tracking-detail-row"><span>Kurir</span><strong>${tracking.courier}</strong></div>
          <div class="tracking-detail-row">
            <span>No. Resi</span>
            <strong>${tracking.resi}</strong>
            <button type="button" class="va-copy-btn" id="copyResiBtn">Salin</button>
          </div>
          <div class="tracking-detail-row"><span>Isi Paket</span><strong>${order.book}</strong></div>
          <div class="tracking-detail-row"><span>Total</span><strong>${formatPrice(order.total)}</strong></div>
        </section>
      </aside>
    </div>
  `;

  document.getElementById('copyResiBtn')?.addEventListener('click', () => copyResi(tracking.resi));
  document.getElementById('trackingReviewBtn')?.addEventListener('click', () => {
    if (typeof openReviewModal === 'function') openReviewModal(order, user);
  });
}

document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = orderId ? 'account.html?tab=orders' : 'user.html';
});

document.addEventListener('usk-review-submitted', () => {
  lastRenderedStep = -1;
  renderTrackingPage();
});

renderTrackingPage();
setInterval(renderTrackingPage, 5000);
