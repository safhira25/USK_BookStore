// File: js/admin.js
// Deskripsi: Skrip panel admin untuk buku, pesanan, ulasan, dan pengguna.
const adminUser = requireAuth(['admin']);
if (!adminUser) throw new Error('Unauthorized');

document.getElementById('adminAvatar').textContent = getInitials(adminUser.name);

// Menyusun sapaan sesuai waktu.
function greetingText() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

const firstName = String(adminUser.name || 'Admin').split(' ')[0];
const greetEl = document.getElementById('dashGreeting');
if (greetEl) greetEl.textContent = `${greetingText()}, ${firstName}`;
const dateEl = document.getElementById('dashDate');
if (dateEl) {
  dateEl.textContent = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

let editingBookId = null;
let editingCategoryValue = null;
let orderFilter = 'all';
let reviewFilter = 'all';
let dashChartMonth = null;

// Mengubah kode status menjadi tulisan.
function statusLabel(status) {
  const labels = { pending: 'Menunggu', shipped: 'Dikirim', completed: 'Selesai' };
  return labels[status] || status;
}

// Mengubah peran akun menjadi tulisan.
function roleLabel(role) {
  const labels = { admin: 'Admin', user: 'Pengguna' };
  return labels[role] || role;
}

// Berpindah menu pada panel admin.
function switchTab(tab) {
  ['dashboard', 'books', 'categories', 'orders', 'reviews', 'users', 'messages'].forEach((t) => {
    const panel = document.getElementById(`tab-${t}`);
    if (panel) panel.classList.toggle('hidden', t !== tab);
  });
  document.querySelectorAll('.admin-sidebar .nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelector('.admin-shell .main-content')?.classList.toggle('is-chat', tab === 'messages');
  if (tab === 'reviews') renderReviews();
  if (tab === 'categories') renderCategoriesTable();
  if (tab === 'books') {
    fillBookCategorySelect(document.getElementById('bookCategory')?.value);
    renderBooksTable();
  }
  if (tab === 'orders') renderOrdersTable();
}

document.querySelectorAll('.admin-sidebar .nav-item').forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.querySelectorAll('[data-goto]').forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.goto));
});

// Menampilkan ringkasan beranda admin.
function renderDashboard() {
  const books = getBooks();
  const orders = getOrders();
  const users = getUsers().filter((user) => user.role !== 'admin');
  const pending = orders.filter((o) => o.status === 'pending').length;
  const shipped = orders.filter((o) => o.status === 'shipped').length;
  const completed = orders.filter((o) => o.status === 'completed').length;
  const unreadReviews = typeof getUnreadReviewCount === 'function' ? getUnreadReviewCount() : 0;
  const lowStock = books.filter((b) => Number(b.stock) < 20);

  document.getElementById('statBooks').textContent = books.length;
  document.getElementById('statOrders').textContent = orders.length;
  document.getElementById('statUsers').textContent = users.length;
  const booksHint = document.getElementById('statBooksHint');
  if (booksHint) booksHint.textContent = `${lowStock.length} stok perlu dicek`;
  const ordersHint = document.getElementById('statOrdersHint');
  if (ordersHint) ordersHint.textContent = `${pending} menunggu diproses`;

  const revenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
  document.getElementById('statRevenue').textContent = formatPrice(revenue);

  const pills = document.getElementById('dashPills');
  if (pills) {
    pills.innerHTML = `
      <button class="dash-pill is-pending" type="button" data-goto="orders"><strong>${pending}</strong> Menunggu</button>
      <button class="dash-pill is-shipped" type="button" data-goto="orders"><strong>${shipped}</strong> Dikirim</button>
      <button class="dash-pill is-done" type="button" data-goto="orders"><strong>${completed}</strong> Selesai</button>
      <button class="dash-pill is-review" type="button" data-goto="reviews"><strong>${unreadReviews}</strong> Ulasan baru</button>
    `;
    pills.querySelectorAll('[data-goto]').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.goto));
    });
  }

  const recent = [...orders]
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.id).localeCompare(String(a.id)))
    .slice(0, 5);

  document.getElementById('recentOrders').innerHTML = recent.length
    ? recent
        .map(
          (o) => `
    <tr>
      <td class="mono">${escapeHtml(o.id)}</td>
      <td>${escapeHtml(o.customer || o.userName || 'Pengguna')}</td>
      <td>${escapeHtml(o.book || o.bookTitle || '-')}</td>
      <td>${formatPrice(o.total)}</td>
      <td><span class="status-badge ${o.status}">${statusLabel(o.status)}</span></td>
    </tr>
  `
        )
        .join('')
    : '<tr><td colspan="5" class="dash-empty">Belum ada pesanan.</td></tr>';

  const stockCount = document.getElementById('lowStockCount');
  if (stockCount) stockCount.textContent = `${lowStock.length} item`;

  document.getElementById('lowStock').innerHTML =
    lowStock.length === 0
      ? '<div class="stock-empty">Semua stok aman. Tidak ada buku di bawah 20 eksemplar.</div>'
      : lowStock
          .map(
            (b) => `
      <div class="stock-row">
        <div>
          <strong>${escapeHtml(b.title)}</strong>
          <span>${escapeHtml(b.author || '')}</span>
        </div>
        <span class="stock-pill">${b.stock} tersisa</span>
      </div>
    `
          )
          .join('');

  renderDashCharts(orders);
}

// Nama bulan singkat untuk diagram.
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTH_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Menentukan bulan sebuah pesanan.
function orderMonthKey(order) {
  const date = new Date(order.date || order.paidAt || order.createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Menghitung persen perubahan dibanding bulan lalu.
function pctChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Mengelompokkan pesanan per bulan.
function buildMonthlyBuckets(orders) {
  const year = new Date().getFullYear();
  const months = MONTH_SHORT.map((label, index) => ({
    key: `${year}-${String(index + 1).padStart(2, '0')}`,
    label,
    full: MONTH_FULL[index],
    completed: 0,
    shipped: 0,
    pending: 0,
    income: 0,
    shippedValue: 0,
    pendingValue: 0,
  }));
  const map = Object.fromEntries(months.map((item) => [item.key, item]));
  orders.forEach((order) => {
    const bucket = map[orderMonthKey(order)];
    if (!bucket) return;
    const total = Number(order.total || 0);
    if (order.status === 'completed') {
      bucket.completed += 1;
      bucket.income += total;
    } else if (order.status === 'shipped') {
      bucket.shipped += 1;
      bucket.shippedValue += total;
    } else {
      bucket.pending += 1;
      bucket.pendingValue += total;
    }
  });
  return months;
}

// Menyusun tinggi satu bagian diagram.
function stackSeg(value, max, className) {
  const height = max ? Math.max(0, (value / max) * 100) : 0;
  if (height <= 0) return '';
  return `<span class="flow-seg ${className}" style="height:${height}%"></span>`;
}

// Menampilkan tanda naik atau turun.
function changeBadge(current, previous) {
  const change = pctChange(current, previous);
  const up = change >= 0;
  return `<span class="flow-change ${up ? 'is-up' : 'is-down'}">${up ? '+' : ''}${change}% dibanding bulan lalu</span>`;
}

// Menyusun satu baris angka pada ringkasan.
function metricRow(label, value, ratio, tone) {
  return `
    <div class="flow-metric">
      <div class="flow-metric-top">
        <span>${label}</span>
        <strong>${value}</strong>
      </div>
      <div class="flow-bar"><i class="${tone}" style="width:${Math.max(6, Math.round(ratio * 100))}%"></i></div>
    </div>
  `;
}

// Menampilkan diagram batang.
function renderFlowChart(container, months, activeKey, getValues) {
  if (!container) return;
  const totals = months.map((item) => getValues(item).reduce((sum, value) => sum + value, 0));
  const max = Math.max(1, ...totals);
  container.innerHTML = months
    .map((item) => {
      const [bottom, mid, top] = getValues(item);
      return `
        <button class="flow-col ${item.key === activeKey ? 'is-active' : ''}" type="button" data-month="${item.key}">
          <div class="flow-stack">
            ${stackSeg(top, max, 'is-pending')}
            ${stackSeg(mid, max, 'is-shipped')}
            ${stackSeg(bottom, max, 'is-done')}
          </div>
          <span>${item.label}</span>
        </button>
      `;
    })
    .join('');
}

// Menampilkan diagram pesanan dan pendapatan.
function renderDashCharts(orders) {
  const months = buildMonthlyBuckets(orders);
  const nowKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const lastWithData = [...months].reverse().find((item) => item.completed + item.shipped + item.pending > 0);
  const currentBucket = months.find((item) => item.key === nowKey);
  const currentHasData = currentBucket && currentBucket.completed + currentBucket.shipped + currentBucket.pending > 0;
  if (!dashChartMonth || !months.some((item) => item.key === dashChartMonth)) {
    dashChartMonth = (currentHasData ? nowKey : lastWithData?.key) || nowKey;
  }

  const activeIndex = months.findIndex((item) => item.key === dashChartMonth);
  const current = months[activeIndex] || months[0];
  const previous = activeIndex > 0 ? months[activeIndex - 1] : null;

  renderFlowChart(document.getElementById('orderChart'), months, dashChartMonth, (item) => [
    item.completed,
    item.shipped,
    item.pending,
  ]);
  renderFlowChart(document.getElementById('revenueChart'), months, dashChartMonth, (item) => [
    item.income,
    item.shippedValue,
    item.pendingValue,
  ]);

  const orderTotal = current.completed + current.shipped + current.pending;
  const prevOrderTotal = previous ? previous.completed + previous.shipped + previous.pending : 0;
  const orderMax = Math.max(1, current.completed, current.shipped, current.pending);
  const orderSummary = document.getElementById('orderSummary');
  if (orderSummary) {
    orderSummary.innerHTML = `
      <div class="flow-summary-head">
        <h4>${current.full}</h4>
        ${changeBadge(orderTotal, prevOrderTotal)}
      </div>
      ${metricRow('Selesai', `${current.completed} order`, current.completed / orderMax, 'is-done')}
      ${metricRow('Dikirim', `${current.shipped} order`, current.shipped / orderMax, 'is-shipped')}
      ${metricRow('Menunggu', `${current.pending} order`, current.pending / orderMax, 'is-pending')}
    `;
  }

  const revenueTotal = current.income + current.shippedValue + current.pendingValue;
  const prevRevenue = previous ? previous.income + previous.shippedValue + previous.pendingValue : 0;
  const moneyMax = Math.max(1, current.income, current.shippedValue, current.pendingValue);
  const revenueSummary = document.getElementById('revenueSummary');
  if (revenueSummary) {
    revenueSummary.innerHTML = `
      <div class="flow-summary-head">
        <h4>${current.full}</h4>
        ${changeBadge(revenueTotal, prevRevenue)}
      </div>
      ${metricRow('Masuk', formatPrice(current.income), current.income / moneyMax, 'is-done')}
      ${metricRow('Diproses', formatPrice(current.shippedValue), current.shippedValue / moneyMax, 'is-shipped')}
      ${metricRow('Menunggu', formatPrice(current.pendingValue), current.pendingValue / moneyMax, 'is-pending')}
    `;
  }
}

// Mengubah tanggal agar mudah dibaca admin.
function formatAdminDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '-';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Mengisi pilihan kategori pada formulir buku.
function fillBookCategorySelect(selected) {
  const select = document.getElementById('bookCategory');
  if (!select) return;
  const categories = getCategories();
  select.innerHTML = categories
    .map((cat) => `<option value="${escapeHtml(cat.value)}">${escapeHtml(cat.label)}</option>`)
    .join('');
  if (selected && categories.some((cat) => cat.value === selected)) {
    select.value = selected;
  }
}

// Daftar berkas sampul buku.
const COVER_ASSETS = [
  'assets/covers/layangan-putus.png',
  'assets/covers/laskar-pelangi.png',
  'assets/covers/sebelas.png',
  'assets/covers/kala-itu-langit-biru.png',
  'assets/covers/cerita-dari-negeri-dongeng.png',
  'assets/covers/surat-terakhir-dari-ayah.png',
  'assets/covers/di-tengah-kegelapan-inuvik.png',
  'assets/covers/secercah-asa.png',
  'assets/covers/doraemon.png',
  'assets/covers/jujutsu-kaisen.png',
  'assets/covers/one-piece.png',
  'assets/covers/hidup-sehat-dr-dian.png',
];

// Mengisi pilihan sampul buku.
function fillCoverPicker(selected) {
  const pick = document.getElementById('bookCoverPick');
  if (!pick) return;
  pick.innerHTML =
    '<option value="">— Pilih sampul dari folder assets/covers —</option>' +
    COVER_ASSETS.map((path) => {
      const name = path.split('/').pop();
      return `<option value="${escapeHtml(path)}" ${selected === path ? 'selected' : ''}>${escapeHtml(name)}</option>`;
    }).join('');
  if (selected && COVER_ASSETS.includes(selected)) pick.value = selected;
}

// Memperbarui pratinjau sampul.
function updateCoverPreview() {
  const url = document.getElementById('bookCover')?.value.trim();
  const img = document.getElementById('bookCoverPreview');
  const pick = document.getElementById('bookCoverPick');
  if (pick && COVER_ASSETS.includes(url)) pick.value = url;
  else if (pick && url && !url.startsWith('data:')) pick.value = '';
  if (!img) return;
  if (!url) {
    img.classList.add('hidden');
    img.removeAttribute('src');
    return;
  }
  img.onerror = () => img.classList.add('hidden');
  img.onload = () => img.classList.remove('hidden');
  img.src = url;
  img.classList.remove('hidden');
}

// Menampilkan tabel kategori.
function renderCategoriesTable() {
  const categories = getCategories();
  const books = getBooks();
  const countEl = document.getElementById('categoriesCount');
  if (countEl) countEl.textContent = `${categories.length} kategori`;

  const table = document.getElementById('categoriesTable');
  if (!table) return;
  if (!categories.length) {
    table.innerHTML = '<tr><td colspan="3" class="dash-empty">Belum ada kategori.</td></tr>';
    return;
  }

  table.innerHTML = categories
    .map((cat) => {
      const total = books.filter((book) => book.category === cat.value).length;
      return `
        <tr data-category="${escapeHtml(cat.value)}">
          <td><span class="cat-chip">${escapeHtml(cat.label)}</span></td>
          <td>${total} buku</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-secondary btn-sm" type="button" data-cat-edit="${escapeHtml(cat.value)}">Ubah</button>
              <button class="btn btn-danger btn-sm" type="button" data-cat-delete="${escapeHtml(cat.value)}">Hapus</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  table.querySelectorAll('[data-cat-edit]').forEach((btn) => {
    btn.addEventListener('click', () => editCategory(btn.dataset.catEdit));
  });
  table.querySelectorAll('[data-cat-delete]').forEach((btn) => {
    btn.addEventListener('click', () => deleteCategoryItem(btn.dataset.catDelete));
  });
}

// Menyiapkan formulir ubah kategori.
function editCategory(value) {
  const category = getCategories().find((cat) => cat.value === value);
  if (!category) return;
  editingCategoryValue = value;
  document.getElementById('categoryId').value = value;
  document.getElementById('categoryName').value = category.label;
  document.getElementById('categoryFormTitle').textContent = 'Ubah Kategori';
  document.getElementById('cancelCategoryEdit').style.display = 'inline-flex';
}

// Menghapus satu kategori dari tabel.
function deleteCategoryItem(value) {
  if (!confirm('Hapus kategori ini? Buku terkait akan dipindah ke kategori lain.')) return;
  const result = deleteCategory(value);
  if (!result.success) {
    alert(result.message);
    return;
  }
  resetCategoryForm();
  renderCategoriesTable();
  fillBookCategorySelect();
  renderBooksTable();
  renderDashboard();
}

// Mengosongkan formulir kategori.
function resetCategoryForm() {
  editingCategoryValue = null;
  document.getElementById('categoryForm').reset();
  document.getElementById('categoryId').value = '';
  document.getElementById('categoryFormTitle').textContent = 'Tambah Kategori';
  document.getElementById('cancelCategoryEdit').style.display = 'none';
}

// Menampilkan tabel buku.
function renderBooksTable() {
  const query = (document.getElementById('bookSearch')?.value || '').trim().toLowerCase();
  const books = getBooks().filter((b) => {
    if (!query) return true;
    return `${b.title} ${b.author} ${b.category}`.toLowerCase().includes(query);
  });
  const countEl = document.getElementById('booksCount');
  if (countEl) countEl.textContent = `${books.length} buku`;

  const table = document.getElementById('booksTable');
  if (!table) return;
  if (!books.length) {
    table.innerHTML = '<tr><td colspan="5" class="dash-empty">Tidak ada buku yang cocok.</td></tr>';
    return;
  }

  table.innerHTML = books
    .map(
      (b) => `
    <tr class="book-row" data-id="${escapeHtml(b.id)}">
      <td>
        <div class="book-cell">
          <img class="book-thumb" src="${escapeHtml(b.cover || '')}" alt="" onerror="this.remove()">
          <div>
            <span class="book-link">${escapeHtml(b.title)}</span>
            <small>${escapeHtml(b.author)}</small>
          </div>
        </div>
      </td>
      <td><span class="cat-chip">${escapeHtml(getCategoryLabel(b.category))}</span></td>
      <td>${formatPrice(b.price)}</td>
      <td><span class="stock-mini ${Number(b.stock) < 20 ? 'is-low' : ''}">${b.stock}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn btn-secondary btn-sm" type="button" onclick="editBook('${escapeHtml(b.id)}')">Ubah</button>
          <button class="btn btn-danger btn-sm" type="button" onclick="deleteBook('${escapeHtml(b.id)}')">Hapus</button>
        </div>
      </td>
    </tr>
  `
    )
    .join('');

  table.querySelectorAll('.book-row').forEach((row) => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      window.location.href = `detail-buku.html?id=${row.dataset.id}&from=admin`;
    });
  });
}

// Menampilkan tabel pesanan.
function renderOrdersTable() {
  let orders = [...getOrders()].sort(
    (a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.id).localeCompare(String(a.id))
  );
  if (orderFilter !== 'all') orders = orders.filter((o) => o.status === orderFilter);
  const countEl = document.getElementById('ordersCount');
  if (countEl) countEl.textContent = `${orders.length} pesanan`;

  const table = document.getElementById('ordersTable');
  if (!table) return;
  if (!orders.length) {
    table.innerHTML = '<tr><td colspan="8" class="dash-empty">Tidak ada pesanan pada filter ini.</td></tr>';
    return;
  }

  table.innerHTML = orders
    .map(
      (o) => `
    <tr data-order-id="${escapeHtml(o.id)}">
      <td class="mono">${escapeHtml(o.id)}</td>
      <td>${escapeHtml(formatAdminDate(o.date))}</td>
      <td>${escapeHtml(o.customer || o.userName || 'Pengguna')}</td>
      <td>${escapeHtml(o.book || o.bookTitle || '-')}</td>
      <td>${formatPrice(o.total)}</td>
      <td>
        ${
          o.paymentProof
            ? `<button class="btn btn-secondary btn-sm" type="button" data-view-proof="${escapeHtml(o.id)}">Lihat</button>`
            : '<span class="panel-meta">Tidak ada</span>'
        }
      </td>
      <td><span class="status-badge ${o.status}">${statusLabel(o.status)}</span></td>
      <td>
        <select class="admin-select" data-order-status="${escapeHtml(o.id)}">
          <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Menunggu</option>
          <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Dikirim</option>
          <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>Selesai</option>
        </select>
      </td>
    </tr>
  `
    )
    .join('');

  table.querySelectorAll('[data-view-proof]').forEach((btn) => {
    btn.addEventListener('click', () => viewPaymentProof(btn.dataset.viewProof));
  });
  table.querySelectorAll('[data-order-status]').forEach((select) => {
    select.addEventListener('change', () => updateOrderStatus(select.dataset.orderStatus, select.value));
  });
}

// Membuka bukti pembayaran.
function viewPaymentProof(id) {
  const order = getOrders().find((item) => item.id === id);
  const modal = document.getElementById('proofModal');
  const img = document.getElementById('proofImage');
  const meta = document.getElementById('proofMeta');
  if (!order || !order.paymentProof || !modal || !img) return;
  img.src = order.paymentProof;
  if (meta) {
    const method = order.paymentMethod === 'bank' ? 'Transfer Bank' : order.paymentMethod || '-';
    meta.textContent = `${order.id} · ${order.customer || 'Pengguna'} · ${method}`;
  }
  modal.classList.remove('hidden');
}

// Menutup jendela bukti pembayaran.
function closePaymentProof() {
  document.getElementById('proofModal')?.classList.add('hidden');
}

// Mengamankan teks agar aman ditampilkan di halaman.
function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Memperbarui angka ulasan yang belum dibaca.
function updateReviewBadge() {
  const badge = document.getElementById('reviewNavBadge');
  if (!badge) return;
  const count = typeof getUnreadReviewCount === 'function' ? getUnreadReviewCount() : 0;
  badge.textContent = count > 9 ? '9+' : String(count);
  badge.classList.toggle('show', count > 0);
}

// Menampilkan daftar ulasan.
function renderReviews() {
  const reviews = (typeof getReviews === 'function' ? getReviews() : []).filter((review) =>
    reviewFilter === 'unread' ? !review.read : true
  );
  updateReviewBadge();
  const countEl = document.getElementById('reviewCount');
  if (countEl) {
    const unread = typeof getUnreadReviewCount === 'function' ? getUnreadReviewCount() : 0;
    countEl.textContent = `${unread} belum dibaca`;
  }

  const list = document.getElementById('reviewsList');
  if (!list) return;

  if (!reviews.length) {
    list.innerHTML = '<div class="admin-review-empty">Belum ada ulasan pada filter ini.</div>';
    return;
  }

  list.innerHTML = reviews
    .map((review) => {
      const date = review.createdAt
        ? new Date(review.createdAt).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-';
      const stars = '★'.repeat(review.rating || 0) + '☆'.repeat(Math.max(0, 5 - (review.rating || 0)));
      const isRead = Boolean(review.read);
      return `
        <article
          class="admin-review-card ${isRead ? 'is-read' : 'is-unread'}"
          data-id="${escapeHtml(review.id)}"
          role="button"
          tabindex="0"
          aria-pressed="${isRead ? 'true' : 'false'}"
        >
          // Judul bagian
          <header>
            <div>
              <h3>${escapeHtml(review.bookTitle)}</h3>
              <p class="meta">${escapeHtml(review.userName)} · ${escapeHtml(review.orderId)} · ${date}</p>
            </div>
            <div class="admin-review-stars">${stars}</div>
          </header>
          <p>${escapeHtml(review.comment)}</p>
          <span class="admin-review-status">${isRead ? 'Sudah dibaca' : 'Baru · klik untuk menandai sudah dibaca'}</span>
        </article>
      `;
    })
    .join('');
}

// Menandai ulasan saat kartunya diklik.
function handleReviewCardActivate(card) {
  if (!card || card.classList.contains('is-read')) return;
  const id = card.dataset.id;
  if (!id || typeof markReviewRead !== 'function') return;
  markReviewRead(id);
  renderReviews();
}

document.getElementById('reviewsList')?.addEventListener('click', (event) => {
  handleReviewCardActivate(event.target.closest('.admin-review-card'));
});

document.getElementById('reviewsList')?.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const card = event.target.closest('.admin-review-card');
  if (!card) return;
  event.preventDefault();
  handleReviewCardActivate(card);
});

// Menampilkan tabel pengguna.
function renderUsersTable() {
  const users = getUsers();
  const countEl = document.getElementById('usersCount');
  if (countEl) countEl.textContent = `${users.length} akun`;

  document.getElementById('usersTable').innerHTML = users
    .map(
      (u) => `
    <tr>
      <td>
        <div class="user-cell">
          <span class="user-avatar">${escapeHtml(getInitials(u.name))}</span>
          <strong>${escapeHtml(u.name)}</strong>
        </div>
      </td>
      <td>${escapeHtml(u.email)}</td>
      <td><span class="status-badge ${u.role === 'admin' ? 'shipped' : 'completed'}">${roleLabel(u.role)}</span></td>
    </tr>
  `
    )
    .join('');
}

// Menyiapkan formulir ubah buku.
function editBook(id) {
  const book = getBooks().find((b) => b.id === id);
  if (!book) return;

  editingBookId = id;
  document.getElementById('bookId').value = id;
  document.getElementById('bookTitle').value = book.title;
  document.getElementById('bookAuthor').value = book.author;
  document.getElementById('bookCategory').value = book.category;
  document.getElementById('bookStock').value = book.stock;
  document.getElementById('bookPrice').value = book.price;
  document.getElementById('bookCover').value = book.cover;
  document.getElementById('bookFormTitle').textContent = 'Ubah Buku';
  document.getElementById('cancelEdit').style.display = 'inline-flex';
  fillBookCategorySelect(book.category);
  fillCoverPicker(book.cover);
  updateCoverPreview();
}

// Menghapus buku dari katalog.
function deleteBook(id) {
  if (!confirm('Yakin ingin menghapus buku ini?')) return;
  const books = getBooks().filter((b) => b.id !== id);
  saveBooks(books);
  renderBooksTable();
  renderDashboard();
}

// Mengubah status pesanan.
function updateOrderStatus(id, status) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === id);
  if (order) {
    order.status = status;
    saveOrders(orders);
    renderDashboard();
    renderOrdersTable();
  }
}

document.getElementById('bookForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const books = getBooks();
  const bookData = {
    title: document.getElementById('bookTitle').value.trim(),
    author: document.getElementById('bookAuthor').value.trim(),
    category: document.getElementById('bookCategory').value,
    stock: parseInt(document.getElementById('bookStock').value, 10),
    price: parseInt(document.getElementById('bookPrice').value, 10),
    cover:
      document.getElementById('bookCover').value.trim() ||
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop',
  };

  if (editingBookId) {
    const idx = books.findIndex((b) => b.id === editingBookId);
    if (idx !== -1) books[idx] = { ...books[idx], ...bookData };
  } else {
    books.push({ id: Date.now().toString(), ...bookData });
  }

  saveBooks(books);
  resetBookForm();
  renderBooksTable();
  renderDashboard();
});

document.getElementById('cancelEdit').addEventListener('click', resetBookForm);

document.getElementById('bookSearch')?.addEventListener('input', renderBooksTable);

document.getElementById('orderChart')?.addEventListener('click', (event) => {
  const col = event.target.closest('[data-month]');
  if (!col) return;
  dashChartMonth = col.dataset.month;
  renderDashCharts(getOrders());
});

document.getElementById('revenueChart')?.addEventListener('click', (event) => {
  const col = event.target.closest('[data-month]');
  if (!col) return;
  dashChartMonth = col.dataset.month;
  renderDashCharts(getOrders());
});

document.getElementById('orderFilters')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-order-filter]');
  if (!button) return;
  orderFilter = button.dataset.orderFilter;
  document.querySelectorAll('#orderFilters [data-order-filter]').forEach((item) => {
    item.classList.toggle('is-on', item === button);
  });
  renderOrdersTable();
});

document.getElementById('reviewFilters')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-review-filter]');
  if (!button) return;
  reviewFilter = button.dataset.reviewFilter;
  document.querySelectorAll('#reviewFilters [data-review-filter]').forEach((item) => {
    item.classList.toggle('is-on', item === button);
  });
  renderReviews();
});

// Mengosongkan formulir buku.
function resetBookForm() {
  editingBookId = null;
  document.getElementById('bookForm').reset();
  document.getElementById('bookId').value = '';
  document.getElementById('bookFormTitle').textContent = 'Tambah Buku Baru';
  document.getElementById('cancelEdit').style.display = 'none';
  const coverFile = document.getElementById('bookCoverFile');
  if (coverFile) coverFile.value = '';
  fillBookCategorySelect();
  fillCoverPicker();
  updateCoverPreview();
}

document.getElementById('bookCover')?.addEventListener('input', updateCoverPreview);

document.getElementById('bookCoverPick')?.addEventListener('change', (event) => {
  const value = event.target.value;
  if (!value) return;
  document.getElementById('bookCover').value = value;
  const coverFile = document.getElementById('bookCoverFile');
  if (coverFile) coverFile.value = '';
  updateCoverPreview();
});

document.getElementById('bookCoverFile')?.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('Pilih file gambar untuk sampul buku.');
    event.target.value = '';
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    alert('Ukuran sampul maksimal 2MB.');
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('bookCover').value = String(reader.result || '');
    const pick = document.getElementById('bookCoverPick');
    if (pick) pick.value = '';
    updateCoverPreview();
  };
  reader.readAsDataURL(file);
});

document.getElementById('categoryForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('categoryName').value;
  const result = editingCategoryValue
    ? updateCategory(editingCategoryValue, name)
    : addCategory(name);
  if (!result.success) {
    alert(result.message);
    return;
  }
  resetCategoryForm();
  renderCategoriesTable();
  fillBookCategorySelect();
  renderBooksTable();
});

document.getElementById('cancelCategoryEdit')?.addEventListener('click', resetCategoryForm);
document.getElementById('closeProofModal')?.addEventListener('click', closePaymentProof);
document.getElementById('proofModal')?.addEventListener('click', (event) => {
  if (event.target.id === 'proofModal') closePaymentProof();
});

window.editCategory = editCategory;
window.deleteCategoryItem = deleteCategoryItem;
window.viewPaymentProof = viewPaymentProof;
window.closePaymentProof = closePaymentProof;
window.updateOrderStatus = updateOrderStatus;

fillBookCategorySelect();
fillCoverPicker();
renderDashboard();
renderBooksTable();
renderCategoriesTable();
renderOrdersTable();
renderReviews();
renderUsersTable();
initAdminChat(adminUser);

const editId = new URLSearchParams(window.location.search).get('edit');
if (editId) {
  switchTab('books');
  editBook(editId);
  window.history.replaceState({}, '', 'pengelola.html');
}

