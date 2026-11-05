function renderBookCard(book, userId) {
  const loved = isLoved(userId, book.id);
  const rating = (book.rating || 4.5).toFixed(1);

  return `
    <article class="book-card" data-id="${book.id}">
      <div class="book-cover-wrap">
        <img class="book-cover" src="${book.cover}" alt="${book.title}" loading="lazy">
        <button class="book-add-btn" type="button" data-id="${book.id}">+ Keranjang</button>
      </div>
      <h3>${book.title}</h3>
      <div class="book-footer">
        <span class="book-rating">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          ${rating}
        </span>
        <button class="book-love-btn ${loved ? 'loved' : ''}" type="button" data-id="${book.id}" aria-label="${loved ? 'Hapus dari Love' : 'Tambah ke Love'}">
          <svg viewBox="0 0 24 24" fill="${loved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
    </article>
  `;
}

function attachBookCardEvents(container, userId, options = {}) {
  const { onLoveToggle, onAddCart, fromPage } = options;

  const detailUrl = (bookId) => {
    const base = `book-detail.html?id=${bookId}`;
    if (fromPage === 'komik') return `${base}&from=komik`;
    if (fromPage === 'novel') return `${base}&from=novel`;
    if (fromPage === 'cerpen') return `${base}&from=cerpen`;
    return base;
  };

  container.querySelectorAll('.book-add-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(userId, btn.dataset.id, 1);
      if (onAddCart) onAddCart(btn.dataset.id);
    });
  });

  container.querySelectorAll('.book-love-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const nowLoved = toggleLove(userId, btn.dataset.id);
      btn.classList.toggle('loved', nowLoved);
      btn.setAttribute('aria-label', nowLoved ? 'Hapus dari Love' : 'Tambah ke Love');
      btn.querySelector('svg').setAttribute('fill', nowLoved ? 'currentColor' : 'none');
      if (onLoveToggle) onLoveToggle(btn.dataset.id, nowLoved);
    });
  });

  container.querySelectorAll('.book-card').forEach((card) => {
    card.addEventListener('click', () => {
      window.location.href = detailUrl(card.dataset.id);
    });
  });
}
