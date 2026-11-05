# USK BookStore - Auto Generator
# Usage: powershell -ExecutionPolicy Bypass -File create-project.ps1
$ProjectRoot = Join-Path $PSScriptRoot "."
New-Item -ItemType Directory -Force -Path (Join-Path $ProjectRoot "css"), (Join-Path $ProjectRoot "js"), (Join-Path $ProjectRoot "assets") | Out-Null
function Write-ProjectFile { param([string]$RelativePath, [string]$Content)
  $path = Join-Path $ProjectRoot $RelativePath
  $dir = Split-Path $path -Parent
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  Set-Content -Path $path -Value $Content -Encoding UTF8
  Write-Host "Created: $RelativePath" -ForegroundColor Green
}
Write-ProjectFile -RelativePath "index.html" -Content @'
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>USK BookStore</title>
  <script>
    const user = localStorage.getItem('usk_bookstore_auth');
    if (user) {
      const parsed = JSON.parse(user);
      window.location.href = parsed.role === 'admin' ? 'admin.html' : 'user.html';
    } else {
      window.location.href = 'signin.html';
    }
  </script>
</head>
<body></body>
</html>

'@
Write-ProjectFile -RelativePath "signin.html" -Content @'
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Masuk - USK BookStore</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <div class="auth-logo-icon">ðŸ“š</div>
        <div>
          <h1>USK BookStore</h1>
          <p>Toko buku online terbaik</p>
        </div>
      </div>

      <h2>Selamat Datang</h2>
      <p class="auth-subtitle">Masuk ke akun Anda untuk melanjutkan</p>

      <div id="alert" class="auth-alert"></div>

      <form id="signinForm">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" placeholder="nama@email.com" required>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" placeholder="Masukkan password" required>
        </div>
        <div class="form-row">
          <label class="checkbox-label">
            <input type="checkbox" id="remember"> Ingat saya
          </label>
          <a href="#" style="color: var(--accent); font-weight: 600;">Lupa password?</a>
        </div>
        <button type="submit" class="btn btn-primary">Masuk</button>
      </form>

      <p class="auth-footer">
        Belum punya akun? <a href="signup.html">Daftar sekarang</a>
      </p>

      <div class="demo-accounts">
        <strong>Akun Demo:</strong><br>
        Admin â†’ admin@usk.com / admin123<br>
        User â†’ user@usk.com / user123
      </div>
    </div>
  </div>

  <script src="js/auth.js"></script>
  <script>
    const user = getCurrentUser();
    if (user) {
      window.location.href = user.role === 'admin' ? 'admin.html' : 'user.html';
    }

    const form = document.getElementById('signinForm');
    const alertEl = document.getElementById('alert');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      const result = signIn(email, password);
      if (result.success) {
        alertEl.className = 'auth-alert success';
        alertEl.textContent = 'Login berhasil! Mengalihkan...';
        setTimeout(() => {
          window.location.href = result.user.role === 'admin' ? 'admin.html' : 'user.html';
        }, 800);
      } else {
        alertEl.className = 'auth-alert error';
        alertEl.textContent = result.message;
      }
    });
  </script>
</body>
</html>

'@
Write-ProjectFile -RelativePath "signup.html" -Content @'
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daftar - USK BookStore</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <div class="auth-logo-icon">ðŸ“š</div>
        <div>
          <h1>USK BookStore</h1>
          <p>Toko buku online terbaik</p>
        </div>
      </div>

      <h2>Buat Akun</h2>
      <p class="auth-subtitle">Daftar untuk mulai berbelanja buku favorit Anda</p>

      <div id="alert" class="auth-alert"></div>

      <form id="signupForm">
        <div class="form-group">
          <label for="name">Nama Lengkap</label>
          <input type="text" id="name" placeholder="John Doe" required>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" placeholder="nama@email.com" required>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" placeholder="Minimal 6 karakter" required minlength="6">
        </div>
        <div class="form-group">
          <label for="confirmPassword">Konfirmasi Password</label>
          <input type="password" id="confirmPassword" placeholder="Ulangi password" required>
        </div>
        <button type="submit" class="btn btn-primary">Daftar</button>
      </form>

      <p class="auth-footer">
        Sudah punya akun? <a href="signin.html">Masuk di sini</a>
        · <a href="index.html">Kembali ke beranda</a>
      </p>
    </div>
  </div>

  <script src="js/auth.js"></script>
  <script>
    const user = getCurrentUser();
    if (user) {
      window.location.href = user.role === 'admin' ? 'admin.html' : 'user.html';
    }

    const form = document.getElementById('signupForm');
    const alertEl = document.getElementById('alert');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (password !== confirmPassword) {
        alertEl.className = 'auth-alert error';
        alertEl.textContent = 'Password dan konfirmasi password tidak cocok.';
        return;
      }

      const result = await signUp(name, email, password);
      if (result.success) {
        alertEl.className = 'auth-alert success';
        alertEl.textContent = 'Pendaftaran berhasil! Mengalihkan ke halaman masuk...';
        setTimeout(() => {
          window.location.href = 'signin.html?registered=1';
        }, 800);
      } else {
        alertEl.className = 'auth-alert error';
        alertEl.textContent = result.message;
      }
    });
  </script>
</body>
</html>

'@
Write-ProjectFile -RelativePath "user.html" -Content @'
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - USK BookStore</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div class="app-shell">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-avatar" id="userAvatar">JD</div>
      <nav class="sidebar-nav">
        <button class="nav-item active" title="Beranda">ðŸ </button>
        <button class="nav-item" title="Favorit">â­</button>
        <button class="nav-item" title="Wishlist">â¤ï¸</button>
        <button class="nav-item" title="Audiobook">â–¶ï¸</button>
        <button class="nav-item" title="Bookmark">ðŸ”–</button>
      </nav>
      <button class="sidebar-subscribe">ðŸ”” SUBSCRIBE</button>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <div class="top-bar">
        <div class="search-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input type="text" id="searchInput" placeholder="Cari buku...">
          <button class="btn btn-gradient btn-sm" id="searchBtn">search</button>
        </div>
        <button class="cart-btn" id="cartBtn" title="Keranjang">
          ðŸ›’
          <span class="cart-badge" id="cartBadge">0</span>
        </button>
        <div class="user-menu">
          <span id="userName" style="font-weight: 600; font-size: 0.9rem;"></span>
          <button class="logout-btn" onclick="logout()">Keluar</button>
        </div>
      </div>

      <div class="categories" id="categories"></div>

      <div class="section-header">
        <h2 id="sectionTitle">Popular</h2>
        <div class="section-actions">
          <a href="#">View All</a>
          <button class="arrow-btn" id="prevBtn">â€¹</button>
          <button class="arrow-btn" id="nextBtn">â€º</button>
        </div>
      </div>

      <div class="book-grid" id="bookGrid"></div>

      <div class="promo-section">
        <div class="promo-banner">
          <div class="promo-banner-content">
            <h3>2026 â€” 50 Buku Bestseller Terpopuler</h3>
            <p>Temukan koleksi buku terlaris tahun ini. Dari fiksi hingga non-fiksi, semua ada di sini.</p>
            <button class="btn btn-gradient btn-sm">ðŸ‘ view all</button>
          </div>
          <div class="promo-books-stack">ðŸ“šðŸ“–ðŸ“•</div>
        </div>
        <div class="promo-lists">
          <div class="promo-list-card">
            <div class="promo-list-icon" style="background: #fef3c7;">ðŸ§¸</div>
            <div>
              <h4>Top 50 Buku Anak</h4>
              <p>Koleksi terbaik untuk si kecil</p>
            </div>
          </div>
          <div class="promo-list-card">
            <div class="promo-list-icon" style="background: #dbeafe;">ðŸ›ï¸</div>
            <div>
              <h4>Top 50 Buku Klasik</h4>
              <p>Karya abadi sepanjang masa</p>
            </div>
          </div>
          <div class="promo-list-card">
            <div class="promo-list-icon" style="background: #ede9fe;">ðŸª</div>
            <div>
              <h4>Top 50 Buku Sci-Fi</h4>
              <p>Petualangan di galaksi lain</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Chat Panel -->
    <aside class="chat-panel">
      <div class="chat-header">
        <h3>ðŸ’¬ Chat</h3>
        <p>Privacy and Support</p>
      </div>
      <div class="chat-messages" id="chatMessages">
        <div class="chat-bubble support">Halo! Selamat datang di USK BookStore. Ada yang bisa kami bantu?</div>
        <div class="chat-bubble user">Halo, saya cari buku fantasy terbaru</div>
        <div class="chat-bubble support">Tentu! Kami punya "Never After" dan "Harry Potter". Mau ditambahkan ke keranjang?</div>
      </div>
      <div class="chat-input-wrap">
        <input type="text" id="chatInput" placeholder="Ketik pesan...">
        <button class="chat-send" id="chatSend">âž¤</button>
      </div>
    </aside>
  </div>

  <script src="js/auth.js"></script>
  <script src="js/data.js"></script>
  <script src="js/user.js"></script>
</body>
</html>

'@
Write-ProjectFile -RelativePath "admin.html" -Content @'
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Panel - USK BookStore</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div class="app-shell admin-shell">
    <!-- Admin Sidebar -->
    <aside class="sidebar admin-sidebar">
      <div class="sidebar-brand">ðŸ“š USK Admin</div>
      <div class="sidebar-avatar" id="adminAvatar" style="margin: 0 auto 16px;">AD</div>
      <nav class="sidebar-nav">
        <button class="nav-item active" data-tab="dashboard">ðŸ“Š Dashboard</button>
        <button class="nav-item" data-tab="books">ðŸ“š Kelola Buku</button>
        <button class="nav-item" data-tab="orders">ðŸ“¦ Pesanan</button>
        <button class="nav-item" data-tab="users">ðŸ‘¥ Pengguna</button>
      </nav>
      <button class="btn btn-danger btn-sm" style="margin-top: auto;" onclick="logout()">Keluar</button>
    </aside>

    <!-- Admin Main -->
    <main class="main-content">
      <!-- Dashboard Tab -->
      <div id="tab-dashboard">
        <div class="admin-header">
          <div>
            <h1>Dashboard Admin</h1>
            <p>Selamat datang, <span id="adminName"></span></p>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="label">Total Buku</div>
            <div class="value" id="statBooks">0</div>
            <div class="change">â†‘ Katalog aktif</div>
          </div>
          <div class="stat-card">
            <div class="label">Total Pesanan</div>
            <div class="value" id="statOrders">0</div>
            <div class="change">â†‘ Bulan ini</div>
          </div>
          <div class="stat-card">
            <div class="label">Pendapatan</div>
            <div class="value" id="statRevenue">Rp 0</div>
            <div class="change">â†‘ +12% vs bulan lalu</div>
          </div>
          <div class="stat-card">
            <div class="label">Pengguna</div>
            <div class="value" id="statUsers">0</div>
            <div class="change">â†‘ Terdaftar</div>
          </div>
        </div>

        <div class="admin-grid">
          <div class="panel">
            <div class="panel-header">
              <h3>Pesanan Terbaru</h3>
            </div>
            <div class="panel-body" style="padding: 0;">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Pelanggan</th>
                    <th>Buku</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="recentOrders"></tbody>
              </table>
            </div>
          </div>
          <div class="panel">
            <div class="panel-header">
              <h3>Stok Rendah</h3>
            </div>
            <div class="panel-body" id="lowStock"></div>
          </div>
        </div>
      </div>

      <!-- Books Tab -->
      <div id="tab-books" class="hidden">
        <div class="admin-header">
          <div>
            <h1>Kelola Buku</h1>
            <p>Tambah, edit, atau hapus buku dari katalog</p>
          </div>
        </div>

        <div class="admin-grid">
          <div class="panel">
            <div class="panel-header">
              <h3>Daftar Buku</h3>
            </div>
            <div class="panel-body" style="padding: 0; overflow-x: auto;">
              <table>
                <thead>
                  <tr>
                    <th>Judul</th>
                    <th>Penulis</th>
                    <th>Kategori</th>
                    <th>Harga</th>
                    <th>Stok</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody id="booksTable"></tbody>
              </table>
            </div>
          </div>
          <div class="panel">
            <div class="panel-header">
              <h3 id="bookFormTitle">Tambah Buku Baru</h3>
            </div>
            <div class="panel-body">
              <form class="admin-form" id="bookForm">
                <input type="hidden" id="bookId">
                <div class="form-group">
                  <label>Judul Buku</label>
                  <input type="text" id="bookTitle" required>
                </div>
                <div class="form-group">
                  <label>Penulis</label>
                  <input type="text" id="bookAuthor" required>
                </div>
                <div class="form-row-2">
                  <div class="form-group">
                    <label>Kategori</label>
                    <select id="bookCategory" required>
                      <option value="Fiction">Fiction</option>
                      <option value="Fantasy">Fantasy</option>
                      <option value="Romance">Romance</option>
                      <option value="Crime">Crime</option>
                      <option value="Sci-Fi">Sci-Fi</option>
                      <option value="Bestsellers">Bestsellers</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Stok</label>
                    <input type="number" id="bookStock" min="0" required>
                  </div>
                </div>
                <div class="form-group">
                  <label>Harga (IDR)</label>
                  <input type="number" id="bookPrice" min="0" required>
                </div>
                <div class="form-group">
                  <label>URL Cover</label>
                  <input type="url" id="bookCover" placeholder="https://...">
                </div>
                <button type="submit" class="btn btn-primary">Simpan Buku</button>
                <button type="button" class="btn btn-secondary" id="cancelEdit" style="display:none;">Batal Edit</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Orders Tab -->
      <div id="tab-orders" class="hidden">
        <div class="admin-header">
          <div>
            <h1>Kelola Pesanan</h1>
            <p>Lihat dan update status pesanan pelanggan</p>
          </div>
        </div>
        <div class="panel">
          <div class="panel-body" style="padding: 0; overflow-x: auto;">
            <table>
              <thead>
                <tr>
                  <th>ID Pesanan</th>
                  <th>Tanggal</th>
                  <th>Pelanggan</th>
                  <th>Buku</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody id="ordersTable"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Users Tab -->
      <div id="tab-users" class="hidden">
        <div class="admin-header">
          <div>
            <h1>Kelola Pengguna</h1>
            <p>Daftar semua pengguna terdaftar</p>
          </div>
        </div>
        <div class="panel">
          <div class="panel-body" style="padding: 0; overflow-x: auto;">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody id="usersTable"></tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>

  <script src="js/auth.js"></script>
  <script src="js/data.js"></script>
  <script src="js/admin.js"></script>
</body>
</html>

'@
Write-ProjectFile -RelativePath "css/style.css" -Content @'
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:wght@600;700&display=swap');

:root {
  --bg: #f5f0e8;
  --surface: #ffffff;
  --surface-soft: #faf7f2;
  --sidebar: #ece7df;
  --text: #2d2a26;
  --text-muted: #8a8278;
  --accent: #6b5ce7;
  --accent-soft: #ebe8ff;
  --danger: #e85d5d;
  --success: #4caf7a;
  --warning: #f0a030;
  --border: #e8e2d8;
  --shadow: 0 4px 24px rgba(45, 42, 38, 0.08);
  --radius: 18px;
  --radius-sm: 12px;
  --radius-pill: 999px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'DM Sans', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
select,
textarea {
  font: inherit;
}

/* Auth pages */
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at 10% 20%, rgba(107, 92, 231, 0.12), transparent 35%),
    radial-gradient(circle at 90% 80%, rgba(240, 160, 48, 0.1), transparent 30%),
    var(--bg);
}

.auth-card {
  width: min(440px, 100%);
  background: var(--surface);
  border-radius: 28px;
  padding: 40px 36px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.auth-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}

.auth-logo-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #6b5ce7, #a78bfa);
  display: grid;
  place-items: center;
  color: white;
  font-size: 22px;
}

.auth-logo h1 {
  font-family: 'Playfair Display', serif;
  font-size: 1.5rem;
}

.auth-logo p {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.auth-card h2 {
  font-size: 1.6rem;
  margin-bottom: 8px;
}

.auth-subtitle {
  color: var(--text-muted);
  margin-bottom: 28px;
  font-size: 0.95rem;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 14px 16px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-soft);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(107, 92, 231, 0.12);
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
  font-size: 0.88rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  cursor: pointer;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-sm);
  padding: 14px 22px;
  font-weight: 600;
  transition: transform 0.15s, opacity 0.15s, box-shadow 0.15s;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0);
}

.btn-primary {
  width: 100%;
  background: linear-gradient(135deg, #6b5ce7, #8b5cf6);
  color: white;
  box-shadow: 0 8px 24px rgba(107, 92, 231, 0.28);
}

.btn-secondary {
  background: var(--surface-soft);
  border: 1.5px solid var(--border);
  color: var(--text);
}

.btn-danger {
  background: #fee2e2;
  color: #b91c1c;
}

.btn-sm {
  padding: 8px 14px;
  font-size: 0.85rem;
}

.btn-gradient {
  background: linear-gradient(90deg, #7c3aed, #ec4899, #f97316);
  color: white;
  border-radius: var(--radius-pill);
  padding: 12px 24px;
}

.auth-footer {
  margin-top: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.auth-footer a {
  color: var(--accent);
  font-weight: 600;
}

.auth-alert {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  margin-bottom: 18px;
  font-size: 0.88rem;
  display: none;
}

.auth-alert.error {
  display: block;
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.auth-alert.success {
  display: block;
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.demo-accounts {
  margin-top: 20px;
  padding: 14px;
  background: var(--surface-soft);
  border-radius: var(--radius-sm);
  border: 1px dashed var(--border);
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.demo-accounts strong {
  color: var(--text);
}

/* Dashboard layout */
.app-shell {
  display: grid;
  grid-template-columns: 72px 1fr 320px;
  min-height: 100vh;
}

.app-shell.admin-shell {
  grid-template-columns: 240px 1fr;
}

.sidebar {
  background: var(--sidebar);
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border-right: 1px solid var(--border);
}

.sidebar.admin-sidebar {
  align-items: stretch;
  padding: 24px 18px;
}

.sidebar-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fcd34d, #f97316);
  display: grid;
  place-items: center;
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  width: 100%;
}

.nav-item {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: var(--text-muted);
  cursor: pointer;
  border: none;
  background: transparent;
  transition: background 0.2s, color 0.2s;
}

.nav-item:hover,
.nav-item.active {
  background: var(--surface);
  color: var(--accent);
  box-shadow: var(--shadow);
}

.admin-sidebar .nav-item {
  width: 100%;
  height: auto;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-start;
  font-size: 0.92rem;
}

.sidebar-brand {
  font-family: 'Playfair Display', serif;
  font-size: 1.2rem;
  margin-bottom: 24px;
  padding: 0 6px;
}

.sidebar-subscribe {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  background: #1e3a5f;
  color: white;
  border-radius: var(--radius-pill);
  padding: 16px 10px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-top: auto;
  cursor: pointer;
  border: none;
}

.main-content {
  padding: 24px 28px;
  overflow-y: auto;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
}

.search-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface);
  border-radius: var(--radius-pill);
  padding: 6px 8px 6px 18px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.search-wrap input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 10px 0;
  outline: none;
}

.search-wrap svg {
  color: var(--text-muted);
}

.cart-btn {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid var(--border);
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: var(--shadow);
}

.cart-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--danger);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.categories {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 28px;
  scrollbar-width: none;
}

.categories::-webkit-scrollbar {
  display: none;
}

.category-chip {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  cursor: pointer;
  min-width: 72px;
  transition: transform 0.15s, box-shadow 0.15s;
}

.category-chip:hover,
.category-chip.active {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
  border-color: var(--accent);
}

.category-chip span:first-child {
  font-size: 1.3rem;
}

.category-chip span:last-child {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.section-header h2 {
  font-family: 'Playfair Display', serif;
  font-size: 1.5rem;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-actions a {
  color: var(--text-muted);
  font-size: 0.88rem;
}

.arrow-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  display: grid;
  place-items: center;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 18px;
  margin-bottom: 32px;
}

.book-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 14px;
  border: 1px solid var(--border);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
}

.book-cover {
  width: 100%;
  aspect-ratio: 2/3;
  border-radius: 10px;
  object-fit: cover;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #ddd6fe, #fde68a);
}

.book-card h3 {
  font-family: 'Playfair Display', serif;
  font-size: 0.95rem;
  line-height: 1.3;
  margin-bottom: 4px;
}

.book-card p {
  font-size: 0.78rem;
  color: var(--danger);
  font-weight: 600;
}

.book-price {
  margin-top: 8px;
  font-weight: 700;
  color: var(--accent);
  font-size: 0.88rem;
}

.promo-section {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 18px;
}

.promo-banner {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 24px;
  padding: 28px;
  display: flex;
  gap: 20px;
  align-items: center;
  border: 1px solid #fcd34d;
  min-height: 220px;
}

.promo-banner-content h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1.4rem;
  margin-bottom: 10px;
}

.promo-banner-content p {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 16px;
  line-height: 1.5;
}

.promo-books-stack {
  font-size: 4rem;
  flex-shrink: 0;
}

.promo-lists {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.promo-list-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 18px 20px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.promo-list-card:hover {
  box-shadow: var(--shadow);
}

.promo-list-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 1.4rem;
}

.promo-list-card h4 {
  font-size: 0.95rem;
  margin-bottom: 2px;
}

.promo-list-card p {
  font-size: 0.78rem;
  color: var(--text-muted);
}

/* Chat panel */
.chat-panel {
  background: var(--surface);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
}

.chat-header {
  padding: 20px;
  border-bottom: 1px solid var(--border);
}

.chat-header h3 {
  font-size: 1rem;
}

.chat-header p {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-bubble {
  max-width: 85%;
  padding: 12px 14px;
  border-radius: 16px;
  font-size: 0.88rem;
  line-height: 1.45;
}

.chat-bubble.support {
  background: var(--surface-soft);
  border: 1px solid var(--border);
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}

.chat-bubble.user {
  background: var(--accent);
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}

.chat-input-wrap {
  padding: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 8px;
}

.chat-input-wrap input {
  flex: 1;
  padding: 12px 16px;
  border-radius: var(--radius-pill);
  border: 1.5px solid var(--border);
  background: var(--surface-soft);
  outline: none;
}

.chat-send {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  border: none;
  cursor: pointer;
  display: grid;
  place-items: center;
}

/* Admin dashboard */
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.admin-header h1 {
  font-family: 'Playfair Display', serif;
  font-size: 1.8rem;
}

.admin-header p {
  color: var(--text-muted);
  margin-top: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 28px;
}

.stat-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 22px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.stat-card .label {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.stat-card .value {
  font-size: 1.8rem;
  font-weight: 700;
}

.stat-card .change {
  font-size: 0.78rem;
  margin-top: 6px;
  color: var(--success);
}

.admin-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
}

.panel {
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  overflow: hidden;
}

.panel-header {
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  font-size: 1rem;
}

.panel-body {
  padding: 18px 22px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

th,
td {
  text-align: left;
  padding: 12px 10px;
  border-bottom: 1px solid var(--border);
}

th {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.completed {
  background: #dcfce7;
  color: #166534;
}

.status-badge.shipped {
  background: #dbeafe;
  color: #1e40af;
}

.admin-form {
  display: grid;
  gap: 14px;
}

.admin-form .form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logout-btn {
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
}

.hidden {
  display: none !important;
}

@media (max-width: 1100px) {
  .app-shell {
    grid-template-columns: 72px 1fr;
  }

  .chat-panel {
    display: none;
  }

  .promo-section {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .admin-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .app-shell,
  .app-shell.admin-shell {
    grid-template-columns: 1fr;
  }

  .sidebar,
  .sidebar.admin-sidebar {
    flex-direction: row;
    overflow-x: auto;
    padding: 12px;
  }

  .sidebar-nav {
    flex-direction: row;
  }

  .sidebar-subscribe {
    display: none;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}

'@
Write-ProjectFile -RelativePath "js/auth.js" -Content @'
const AUTH_KEY = 'usk_bookstore_auth';
const USERS_KEY = 'usk_bookstore_users';

const DEFAULT_USERS = [
  {
    id: '1',
    name: 'Admin USK',
    email: 'admin@usk.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'user@usk.com',
    password: 'user123',
    role: 'user',
  },
];

function initUsers() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  }
}

function getUsers() {
  initUsers();
  return JSON.parse(localStorage.getItem(USERS_KEY));
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  const data = localStorage.getItem(AUTH_KEY);
  return data ? JSON.parse(data) : null;
}

function setCurrentUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = 'signin.html';
}

function requireAuth(allowedRoles = []) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'signin.html';
    return null;
  }
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    window.location.href = user.role === 'admin' ? 'admin.html' : 'user.html';
    return null;
  }
  return user;
}

function signIn(email, password) {
  const users = getUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return { success: false, message: 'Email atau password salah.' };

  const session = { id: user.id, name: user.name, email: user.email, role: user.role };
  setCurrentUser(session);
  return { success: true, user: session };
}

function signUp(name, email, password) {
  // Revisi: registrasi hanya user; setelah daftar harus ke login (jangan auto-login).
  const users = getUsers();
  if (users.some((u) => u.email === email)) {
    return { success: false, message: 'Email sudah terdaftar.' };
  }
  if (password.length < 6) {
    return { success: false, message: 'Password minimal 6 karakter.' };
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
    role: 'user',
  };
  users.push(newUser);
  saveUsers(users);
  localStorage.removeItem(AUTH_KEY);
  return { success: true };
}

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

initUsers();

'@
Write-ProjectFile -RelativePath "js/data.js" -Content @'
const BOOKS_KEY = 'usk_bookstore_books';
const ORDERS_KEY = 'usk_bookstore_orders';
const CART_KEY = 'usk_bookstore_cart';

const DEFAULT_BOOKS = [
  {
    id: '1',
    title: 'Fairy Tale',
    author: 'Stephen King',
    category: 'Fiction',
    price: 189000,
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop',
    stock: 24,
  },
  {
    id: '2',
    title: 'Never After',
    author: 'Stephanie Garber',
    category: 'Fantasy',
    price: 165000,
    cover: 'https://images.unsplash.com/photo-1512820790801-f9f16372597e?w=300&h=450&fit=crop',
    stock: 18,
  },
  {
    id: '3',
    title: 'Klara and the Sun',
    author: 'Kazuo Ishiguro',
    category: 'Fiction',
    price: 175000,
    cover: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&h=450&fit=crop',
    stock: 30,
  },
  {
    id: '4',
    title: 'The Maid',
    author: 'Nita Prose',
    category: 'Crime',
    price: 142000,
    cover: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=300&h=450&fit=crop',
    stock: 15,
  },
  {
    id: '7',
    title: 'Harry Potter',
    author: 'J.K. Rowling',
    category: 'Fantasy',
    price: 210000,
    cover: 'https://images.unsplash.com/photo-1609866138210-84e51648a241?w=300&h=450&fit=crop',
    stock: 55,
  },
  {
    id: '8',
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Bestsellers',
    price: 168000,
    cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop',
    stock: 38,
  },
];

const DEFAULT_ORDERS = [
  { id: 'ORD-001', customer: 'John Doe', book: 'Fairy Tale', total: 189000, status: 'completed', date: '2026-07-20' },
  { id: 'ORD-002', customer: 'Sarah Wijaya', book: 'Never After', total: 165000, status: 'shipped', date: '2026-07-22' },
  { id: 'ORD-003', customer: 'Ahmad Rizki', book: 'Atomic Habits', total: 168000, status: 'pending', date: '2026-07-24' },
  { id: 'ORD-004', customer: 'Maria Santos', book: 'Harry Potter', total: 210000, status: 'completed', date: '2026-07-24' },
];

function initBooks() {
  if (!localStorage.getItem(BOOKS_KEY)) {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(DEFAULT_BOOKS));
  }
}

function initOrders() {
  if (!localStorage.getItem(ORDERS_KEY)) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(DEFAULT_ORDERS));
  }
}

function getBooks() {
  initBooks();
  return JSON.parse(localStorage.getItem(BOOKS_KEY));
}

function saveBooks(books) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

function getOrders() {
  initOrders();
  return JSON.parse(localStorage.getItem(ORDERS_KEY));
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function getCart(userId) {
  const all = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
  return all[userId] || [];
}

function saveCart(userId, cart) {
  const all = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
  all[userId] = cart;
  localStorage.setItem(CART_KEY, JSON.stringify(all));
}

function addToCart(userId, bookId) {
  const cart = getCart(userId);
  const existing = cart.find((item) => item.bookId === bookId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ bookId, qty: 1 });
  }
  saveCart(userId, cart);
  return cart;
}

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

initBooks();
initOrders();

'@
Write-ProjectFile -RelativePath "js/user.js" -Content @'
const currentUser = requireAuth(['user']);
if (!currentUser) throw new Error('Unauthorized');

document.getElementById('userName').textContent = currentUser.name;
document.getElementById('userAvatar').textContent = getInitials(currentUser.name);

const categories = [
  { icon: 'ðŸ“š', label: 'All', value: 'All' },
  { icon: 'ðŸ“±', label: 'eBooks', value: 'eBooks' },
  { icon: 'âœ¨', label: 'New', value: 'New' },
  { icon: 'ðŸ”¥', label: 'Bestsellers', value: 'Bestsellers' },
  { icon: 'ðŸŽ§', label: 'Audiobooks', value: 'Audiobooks' },
  { icon: 'ðŸ“–', label: 'Fiction', value: 'Fiction' },
  { icon: 'ðŸ’•', label: 'Romance', value: 'Romance' },
  { icon: 'ðŸ‰', label: 'Fantasy', value: 'Fantasy' },
  { icon: 'ðŸŽŒ', label: 'Manga', value: 'Manga' },
  { icon: 'ðŸ”', label: 'Crime', value: 'Crime' },
];

let activeCategory = 'All';
let searchQuery = '';

function updateCartBadge() {
  const cart = getCart(currentUser.id);
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('cartBadge').textContent = total;
}

function renderCategories() {
  const container = document.getElementById('categories');
  container.innerHTML = categories
    .map(
      (cat) => `
    <button class="category-chip ${cat.value === activeCategory ? 'active' : ''}" data-category="${cat.value}">
      <span>${cat.icon}</span>
      <span>${cat.label}</span>
    </button>
  `
    )
    .join('');

  container.querySelectorAll('.category-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      activeCategory = chip.dataset.category;
      renderCategories();
      renderBooks();
    });
  });
}

function filterBooks() {
  let books = getBooks();
  if (activeCategory !== 'All') {
    books = books.filter((b) => b.category === activeCategory);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    books = books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
    );
  }
  return books;
}

function renderBooks() {
  const books = filterBooks();
  const grid = document.getElementById('bookGrid');
  const title = document.getElementById('sectionTitle');

  title.textContent = searchQuery
    ? `Hasil: "${searchQuery}"`
    : activeCategory === 'All'
      ? 'Popular'
      : activeCategory;

  if (books.length === 0) {
    grid.innerHTML =
      '<p style="grid-column: 1/-1; color: var(--text-muted); padding: 20px;">Tidak ada buku ditemukan.</p>';
    return;
  }

  grid.innerHTML = books
    .map(
      (book) => `
    <div class="book-card" data-id="${book.id}">
      <img class="book-cover" src="${book.cover}" alt="${book.title}" loading="lazy">
      <h3>${book.title}</h3>
      <p>${book.author}</p>
      <div class="book-price">${formatPrice(book.price)}</div>
    </div>
  `
    )
    .join('');

  grid.querySelectorAll('.book-card').forEach((card) => {
    card.addEventListener('click', () => {
      const bookId = card.dataset.id;
      addToCart(currentUser.id, bookId);
      updateCartBadge();
      const book = getBooks().find((b) => b.id === bookId);
      showToast(`${book.title} ditambahkan ke keranjang!`);
    });
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText =
    'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#2d2a26;color:white;padding:12px 24px;border-radius:12px;font-size:0.9rem;z-index:999;box-shadow:0 4px 20px rgba(0,0,0,0.2);';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  renderBooks();
});

document.getElementById('searchBtn').addEventListener('click', () => {
  searchQuery = document.getElementById('searchInput').value.trim();
  renderBooks();
});

document.getElementById('cartBtn').addEventListener('click', () => {
  const cart = getCart(currentUser.id);
  if (cart.length === 0) {
    showToast('Keranjang masih kosong.');
    return;
  }
  const books = getBooks();
  const items = cart.map((item) => {
    const book = books.find((b) => b.id === item.bookId);
    return `${book.title} x${item.qty}`;
  });
  showToast(`Keranjang: ${items.join(', ')}`);
});

document.getElementById('chatSend').addEventListener('click', sendChat);
document.getElementById('chatInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChat();
});

function sendChat() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  const messages = document.getElementById('chatMessages');
  messages.innerHTML += `<div class="chat-bubble user">${text}</div>`;
  input.value = '';

  setTimeout(() => {
    messages.innerHTML += `<div class="chat-bubble support">Terima kasih! Tim support kami akan segera membantu Anda. ðŸ™</div>`;
    messages.scrollTop = messages.scrollHeight;
  }, 1000);

  messages.scrollTop = messages.scrollHeight;
}

renderCategories();
renderBooks();
updateCartBadge();

'@
Write-ProjectFile -RelativePath "js/admin.js" -Content @'
const adminUser = requireAuth(['admin']);
if (!adminUser) throw new Error('Unauthorized');

document.getElementById('adminName').textContent = adminUser.name;
document.getElementById('adminAvatar').textContent = getInitials(adminUser.name);

let editingBookId = null;

function switchTab(tab) {
  ['dashboard', 'books', 'orders', 'users'].forEach((t) => {
    document.getElementById(`tab-${t}`).classList.toggle('hidden', t !== tab);
  });
  document.querySelectorAll('.admin-sidebar .nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
}

document.querySelectorAll('.admin-sidebar .nav-item').forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function renderDashboard() {
  const books = getBooks();
  const orders = getOrders();
  const users = getUsers();

  document.getElementById('statBooks').textContent = books.length;
  document.getElementById('statOrders').textContent = orders.length;
  document.getElementById('statUsers').textContent = users.length;

  const revenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.total, 0);
  document.getElementById('statRevenue').textContent = formatPrice(revenue);

  document.getElementById('recentOrders').innerHTML = orders
    .slice(0, 5)
    .map(
      (o) => `
    <tr>
      <td>${o.id}</td>
      <td>${o.customer}</td>
      <td>${o.book}</td>
      <td>${formatPrice(o.total)}</td>
      <td><span class="status-badge ${o.status}">${o.status}</span></td>
    </tr>
  `
    )
    .join('');

  const lowStock = books.filter((b) => b.stock < 20);
  document.getElementById('lowStock').innerHTML =
    lowStock.length === 0
      ? '<p style="color: var(--text-muted);">Semua stok aman âœ…</p>'
      : lowStock
          .map(
            (b) => `
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
        <span>${b.title}</span>
        <span style="color:var(--danger);font-weight:600;">${b.stock} tersisa</span>
      </div>
    `
          )
          .join('');
}

function renderBooksTable() {
  const books = getBooks();
  document.getElementById('booksTable').innerHTML = books
    .map(
      (b) => `
    <tr>
      <td>${b.title}</td>
      <td>${b.author}</td>
      <td>${b.category}</td>
      <td>${formatPrice(b.price)}</td>
      <td>${b.stock}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editBook('${b.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteBook('${b.id}')">Hapus</button>
      </td>
    </tr>
  `
    )
    .join('');
}

function renderOrdersTable() {
  const orders = getOrders();
  document.getElementById('ordersTable').innerHTML = orders
    .map(
      (o) => `
    <tr>
      <td>${o.id}</td>
      <td>${o.date}</td>
      <td>${o.customer}</td>
      <td>${o.book}</td>
      <td>${formatPrice(o.total)}</td>
      <td><span class="status-badge ${o.status}">${o.status}</span></td>
      <td>
        <select onchange="updateOrderStatus('${o.id}', this.value)" style="padding:6px;border-radius:8px;border:1px solid var(--border);">
          <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
          <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>Completed</option>
        </select>
      </td>
    </tr>
  `
    )
    .join('');
}

function renderUsersTable() {
  const users = getUsers();
  document.getElementById('usersTable').innerHTML = users
    .map(
      (u) => `
    <tr>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td><span class="status-badge ${u.role === 'admin' ? 'shipped' : 'completed'}">${u.role}</span></td>
    </tr>
  `
    )
    .join('');
}

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
  document.getElementById('bookFormTitle').textContent = 'Edit Buku';
  document.getElementById('cancelEdit').style.display = 'inline-flex';
}

function deleteBook(id) {
  if (!confirm('Yakin ingin menghapus buku ini?')) return;
  const books = getBooks().filter((b) => b.id !== id);
  saveBooks(books);
  renderBooksTable();
  renderDashboard();
}

function updateOrderStatus(id, status) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === id);
  if (order) {
    order.status = status;
    saveOrders(orders);
    renderDashboard();
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

function resetBookForm() {
  editingBookId = null;
  document.getElementById('bookForm').reset();
  document.getElementById('bookId').value = '';
  document.getElementById('bookFormTitle').textContent = 'Tambah Buku Baru';
  document.getElementById('cancelEdit').style.display = 'none';
}

renderDashboard();
renderBooksTable();
renderOrdersTable();
renderUsersTable();

'@
Write-Host "`nUSK BookStore siap! Buka: start index.html" -ForegroundColor Cyan

