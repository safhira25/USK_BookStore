(function () {
  const STAR_PATH =
    'M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';

  let currentOrder = null;
  let currentUser = null;
  let selectedRating = 0;

  function starButton(index) {
    return `
      <button type="button" class="review-star" data-star="${index}" aria-label="${index} bintang">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="${STAR_PATH}"/></svg>
      </button>
    `;
  }

  function ensureReviewUI() {
    if (document.getElementById('reviewOverlay')) return;

    const notice = document.createElement('div');
    notice.id = 'reviewNotice';
    notice.className = 'review-notice';
    notice.innerHTML = `
      <button type="button" class="review-notice-body" id="reviewNoticeOpen">
        <span class="review-notice-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </span>
        <span>
          <strong>Pesanan selesai</strong>
          <p id="reviewNoticeText">Paket sudah diterima. Klik untuk memberi rating dan ulasan.</p>
        </span>
      </button>
      <button type="button" class="review-notice-close" id="reviewNoticeClose" aria-label="Tutup notifikasi">×</button>
    `;
    document.body.appendChild(notice);

    const overlay = document.createElement('div');
    overlay.id = 'reviewOverlay';
    overlay.className = 'review-overlay';
    overlay.innerHTML = `
      <form class="review-card" id="reviewForm">
        <button type="button" class="review-modal-close" id="reviewModalClose" aria-label="Tutup rating">×</button>
        <h2>Nilai pengalaman Anda</h2>
        <p>Kami sangat menghargai masukan Anda. Beri rating dan ulasan setelah paket diterima.</p>
        <div class="review-stars" id="reviewStars">${[1, 2, 3, 4, 5].map(starButton).join('')}</div>
        <textarea id="reviewComment" placeholder="Berikan ulasan anda" maxlength="400"></textarea>
        <p class="review-error" id="reviewError">Pilih bintang dan tulis ulasan terlebih dahulu.</p>
        <button class="review-send" type="submit">Kirim</button>
      </form>
    `;
    document.body.appendChild(overlay);

    document.getElementById('reviewNoticeOpen').addEventListener('click', () => {
      if (currentOrder && currentUser) openReviewModal(currentOrder, currentUser);
    });

    document.getElementById('reviewNoticeClose').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dismissNotice();
    });

    document.getElementById('reviewModalClose').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeReviewModal();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeReviewModal();
    });

    overlay.querySelectorAll('.review-star').forEach((btn) => {
      btn.addEventListener('click', () => setRating(Number(btn.dataset.star)));
      btn.addEventListener('mouseenter', () => paintStars(Number(btn.dataset.star)));
    });
    overlay.querySelector('.review-stars').addEventListener('mouseleave', () => paintStars(selectedRating));

    document.getElementById('reviewForm').addEventListener('submit', submitReview);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeReviewModal();
        dismissNotice();
      }
    });
  }

  function paintStars(value) {
    document.querySelectorAll('#reviewStars .review-star').forEach((btn) => {
      btn.classList.toggle('is-active', Number(btn.dataset.star) <= value);
    });
  }

  function setRating(value) {
    selectedRating = value;
    paintStars(value);
  }

  function hideNotice() {
    document.getElementById('reviewNotice')?.classList.remove('is-visible');
  }

  function dismissNotice() {
    if (currentOrder) {
      sessionStorage.setItem(`usk_review_dismiss_${currentOrder.id}`, '1');
    }
    hideNotice();
  }

  function showNotice(order) {
    ensureReviewUI();
    currentOrder = order;
    const text = document.getElementById('reviewNoticeText');
    if (text) {
      text.textContent = `Paket ${order.id} (${order.book}) sudah diterima. Klik untuk memberi rating dan ulasan.`;
    }
    document.getElementById('reviewNotice')?.classList.add('is-visible');
  }

  function closeReviewModal() {
    document.getElementById('reviewOverlay')?.classList.remove('is-open');
  }

  function openReviewModal(order, user) {
    ensureReviewUI();
    currentOrder = order;
    currentUser = user;
    selectedRating = 0;
    paintStars(0);
    const comment = document.getElementById('reviewComment');
    const error = document.getElementById('reviewError');
    if (comment) comment.value = '';
    error?.classList.remove('is-visible');
    document.getElementById('reviewOverlay')?.classList.add('is-open');
  }

  function pendingReviewOrders(user) {
    if (!user || typeof getOrders !== 'function' || typeof getReviewByOrderId !== 'function') return [];
    return getOrders()
      .filter((order) => order.customer === user.name && order.status === 'completed' && !getReviewByOrderId(order.id))
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.id).localeCompare(String(a.id)));
  }

  function submitReview(e) {
    e.preventDefault();
    const comment = document.getElementById('reviewComment')?.value.trim() || '';
    const error = document.getElementById('reviewError');
    if (!selectedRating || !comment || !currentOrder || !currentUser) {
      error?.classList.add('is-visible');
      return;
    }

    addReview({
      orderId: currentOrder.id,
      userId: currentUser.id,
      userName: currentUser.name,
      bookTitle: currentOrder.book,
      rating: selectedRating,
      comment,
    });

    closeReviewModal();
    hideNotice();
    sessionStorage.setItem(`usk_review_dismiss_${currentOrder.id}`, '1');

    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.textContent = 'Ulasan terkirim ke admin';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);

    document.dispatchEvent(new CustomEvent('usk-review-submitted', { detail: { orderId: currentOrder.id } }));
  }

  window.openReviewModal = openReviewModal;
  window.initReviewPrompt = function (user, options = {}) {
    currentUser = user;
    const pending = pendingReviewOrders(user);
    const order =
      options.order ||
      (options.orderId && pending.find((item) => item.id === options.orderId)) ||
      pending[0];
    if (!order || (typeof getReviewByOrderId === 'function' && getReviewByOrderId(order.id))) {
      hideNotice();
      return null;
    }
    if (!sessionStorage.getItem(`usk_review_dismiss_${order.id}`)) {
      showNotice(order);
    }
    if (options.autoOpen) {
      openReviewModal(order, user);
    }
    return order;
  };
})();
