// File: js/data.js
// Deskripsi: Data buku, pesanan, keranjang, ulasan, dan alamat.
const BOOKS_KEY = 'usk_bookstore_books';
const ORDERS_KEY = 'usk_bookstore_orders';
const CART_KEY = 'usk_bookstore_cart';
const LOVES_KEY = 'usk_bookstore_loves';
const REVIEWS_KEY = 'usk_bookstore_reviews';
const ADDRESSES_KEY = 'usk_bookstore_addresses';
const SELECTED_ADDRESS_KEY = 'usk_bookstore_selected_address';
const CATEGORIES_KEY = 'usk_bookstore_categories';
const DATA_VERSION_KEY = 'usk_bookstore_data_version';
const DATA_VERSION = '14';

// Daftar identitas buku komik.
const KOMIK_BOOK_IDS = ['7', '9', '10', '11'];
const NOVEL_BOOK_IDS = ['1', '2', '3', '12'];
const CERPEN_BOOK_IDS = ['4', '13', '14', '15'];

// Kategori bawaan toko.
const DEFAULT_CATEGORIES = [
  { value: 'Novel', label: 'Novel' },
  { value: 'Komik', label: 'Komik' },
  { value: 'Cerpen', label: 'Cerpen' },
];

// Halaman tujuan untuk setiap kategori.
const CATEGORY_PAGES = {
  Novel: 'novel.html',
  Komik: 'komik.html',
  Cerpen: 'cerpen.html',
};

// Menyiapkan kategori bawaan.
function initCategories() {
  const stored = localStorage.getItem(CATEGORIES_KEY);
  if (!stored) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    return;
  }
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    }
  } catch (error) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
  }
}

// Mengambil daftar kategori.
function getCategories() {
  initCategories();
  return JSON.parse(localStorage.getItem(CATEGORIES_KEY));
}

// Menyimpan daftar kategori.
function saveCategories(categories) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

// Mengambil kategori yang boleh dijelajahi.
function getBrowsableCategories() {
  return [{ value: 'All', label: 'Semua' }, ...getCategories()];
}

// Menentukan halaman untuk satu kategori.
function getCategoryPage(value) {
  return CATEGORY_PAGES[value] || '';
}

// Merapikan nama kategori menjadi nilai tetap.
function normalizeCategoryValue(label) {
  return String(label || '')
    .trim()
    .replace(/\s+/g, ' ');
}

// Menambahkan kategori baru.
function addCategory(label) {
  const value = normalizeCategoryValue(label);
  if (!value) return { success: false, message: 'Nama kategori wajib diisi.' };
  const categories = getCategories();
  if (categories.some((c) => c.value.toLowerCase() === value.toLowerCase())) {
    return { success: false, message: 'Kategori sudah ada.' };
  }
  categories.push({ value, label: value });
  saveCategories(categories);
  return { success: true };
}

// Mengubah nama kategori.
function updateCategory(oldValue, label) {
  const value = normalizeCategoryValue(label);
  if (!value) return { success: false, message: 'Nama kategori wajib diisi.' };
  const categories = getCategories();
  if (categories.some((c) => c.value.toLowerCase() === value.toLowerCase() && c.value !== oldValue)) {
    return { success: false, message: 'Kategori sudah ada.' };
  }
  const idx = categories.findIndex((c) => c.value === oldValue);
  if (idx === -1) return { success: false, message: 'Kategori tidak ditemukan.' };
  categories[idx] = { value, label: value };
  saveCategories(categories);
  if (oldValue !== value) {
    saveBooks(getBooks().map((book) => (book.category === oldValue ? { ...book, category: value } : book)));
  }
  return { success: true };
}

// Menghapus kategori.
function deleteCategory(value) {
  const categories = getCategories();
  if (categories.length <= 1) {
    return { success: false, message: 'Minimal satu kategori harus tersisa.' };
  }
  const next = categories.filter((c) => c.value !== value);
  if (next.length === categories.length) {
    return { success: false, message: 'Kategori tidak ditemukan.' };
  }
  const fallback = next[0].value;
  saveCategories(next);
  saveBooks(getBooks().map((book) => (book.category === value ? { ...book, category: fallback } : book)));
  return { success: true };
}

// Daftar buku bawaan toko.
const DEFAULT_BOOKS = [
  {
    id: '1',
    title: 'Layangan Putus',
    author: 'Mommy ASF',
    category: 'Novel',
    price: 89000,
    cover: 'assets/covers/layangan-putus.png',
    stock: 40,
    description: 'Kisah perjalanan spiritual dan cinta yang penuh makna, mengajarkan arti ikhlas dan kekuatan doa.',
    rating: 4.5,
    reviews: 12500,
    language: 'Bahasa Indonesia',
    pages: 320,
    year: 2021,
    publisher: 'Reynald Media',
  },
  {
    id: '2',
    title: 'Laskar Pelangi',
    author: 'Andrea Hirata',
    category: 'Novel',
    price: 79000,
    cover: 'assets/covers/laskar-pelangi.png',
    stock: 55,
    description: 'Kisah inspiratif sepuluh anak dari Pulau Belitong yang berjuang meraih pendidikan di tengah keterbatasan.',
    rating: 4.5,
    reviews: 28000,
    language: 'Bahasa Indonesia',
    pages: 534,
    year: 2005,
    publisher: 'Bentang Pustaka',
  },
  {
    id: '3',
    title: 'Sebelas',
    author: 'Tere Liye',
    category: 'Novel',
    price: 85000,
    cover: 'assets/covers/sebelas.png',
    stock: 32,
    description: 'Novel tentang persahabatan, sepak bola, dan perjuangan sebelas pemain muda mengejar mimpi mereka.',
    rating: 4.5,
    reviews: 6400,
    language: 'Bahasa Indonesia',
    pages: 384,
    year: 2016,
    publisher: 'Gramedia Pustaka Utama',
  },
  {
    id: '4',
    title: 'Cerita dari Negeri Dongeng',
    author: 'Sacha',
    category: 'Cerpen',
    price: 68000,
    cover: 'assets/covers/cerita-dari-negeri-dongeng.png',
    stock: 30,
    description: 'Kumpulan cerita fantasi penuh keajaiban dari negeri dongeng yang membawa pembaca ke dunia imajinasi.',
    rating: 4.5,
    reviews: 2100,
    language: 'Bahasa Indonesia',
    pages: 180,
    year: 2022,
    publisher: 'Gramedia Pustaka Utama',
  },
  {
    id: '13',
    title: 'Surat Terakhir dari Ayah',
    author: 'Kusaina Ain',
    category: 'Cerpen',
    price: 72000,
    cover: 'assets/covers/surat-terakhir-dari-ayah.png',
    stock: 24,
    description: 'Cerita emosional tentang keluarga, penyesalan, dan surat terakhir yang mengubah segalanya.',
    rating: 4.5,
    reviews: 3400,
    language: 'Bahasa Indonesia',
    pages: 160,
    year: 2021,
    publisher: 'After 7 Our Family',
  },
  {
    id: '14',
    title: 'Di Tengah Kegelapan Inuvik',
    author: 'Sori Siregar',
    category: 'Cerpen',
    price: 75000,
    cover: 'assets/covers/di-tengah-kegelapan-inuvik.png',
    stock: 20,
    description: 'Kumpulan cerpen yang menggali kegelapan dan harapan di tengah kota Inuvik yang sunyi.',
    rating: 4.5,
    reviews: 1800,
    language: 'Bahasa Indonesia',
    pages: 200,
    year: 2020,
    publisher: 'Kompas Gramedia',
  },
  {
    id: '15',
    title: 'Secercah Asa',
    author: 'Penulis',
    category: 'Cerpen',
    price: 65000,
    cover: 'assets/covers/secercah-asa.png',
    stock: 22,
    description: 'Cerpen penuh harap tentang seseorang yang menemukan cahaya di tengah kesendirian dan kegelapan.',
    rating: 4.5,
    reviews: 950,
    language: 'Bahasa Indonesia',
    pages: 140,
    year: 2023,
    publisher: 'BookStore',
  },
  {
    id: '12',
    title: 'Kala Itu Langit Biru',
    author: 'Kim Chun Hei',
    category: 'Novel',
    price: 92000,
    cover: 'assets/covers/kala-itu-langit-biru.png',
    stock: 26,
    description: 'Novel coming-of-age tentang remaja yang menemukan makna hidup di tengah langit biru yang penuh harapan.',
    rating: 4.5,
    reviews: 4200,
    language: 'Bahasa Indonesia',
    pages: 296,
    year: 2019,
    publisher: 'Gramedia Pustaka Utama',
  },
  {
    id: '7',
    title: 'Doraemon',
    author: 'Fujiko F. Fujio',
    category: 'Komik',
    price: 75000,
    cover: 'assets/covers/doraemon.png',
    stock: 48,
    description: 'Petualangan Doraemon, kucing robot dari masa depan, bersama Nobita dan teman-temannya.',
    rating: 4.5,
    reviews: 9800,
    language: 'Bahasa Indonesia',
    pages: 192,
    year: 2014,
    publisher: 'Elex Media Komputindo',
  },
  {
    id: '9',
    title: 'Jujutsu Kaisen',
    author: 'Gege Akutami',
    category: 'Komik',
    price: 85000,
    cover: 'assets/covers/jujutsu-kaisen.png',
    stock: 36,
    description: 'Yuji Itadori terlibat dalam dunia kutukan dan menjadi siswa Jujutsu Sorcerer untuk melawan roh jahat.',
    rating: 4.5,
    reviews: 11200,
    language: 'Bahasa Indonesia',
    pages: 200,
    year: 2020,
    publisher: 'Elex Media Komputindo',
  },
  {
    id: '10',
    title: 'One Piece',
    author: 'Eiichiro Oda',
    category: 'Komik',
    price: 85000,
    cover: 'assets/covers/one-piece.png',
    stock: 55,
    description: 'Petualangan Monkey D. Luffy dan kru bajak lautnya mencari harta karun legendaris One Piece.',
    rating: 4.5,
    reviews: 12000,
    language: 'Bahasa Indonesia',
    pages: 200,
    year: 1997,
    publisher: 'Elex Media Komputindo',
  },
  {
    id: '11',
    title: 'Hidup Sehat Bersama Dr. Dian',
    author: 'Shahaja Putri & dr. Dian Shinta Fitriyanti',
    category: 'Komik',
    price: 65000,
    cover: 'assets/covers/hidup-sehat-dr-dian.png',
    stock: 28,
    description: 'Komik anak sehat yang mengajak keluarga hidup sehat dengan cara menyenangkan bersama Dr. Dian.',
    rating: 4.5,
    reviews: 860,
    language: 'Bahasa Indonesia',
    pages: 120,
    year: 2023,
    publisher: 'Kompas Gramedia',
  },
];

// Mengambil nama tampilan kategori.
function getCategoryLabel(value) {
  if (value === 'All') return 'Semua';
  const found = getCategories().find((c) => c.value === value);
  return found ? found.label : value;
}

// Menghapus buku yang ganda.
function dedupeBooks(books) {
  const seenKomikTitles = new Set();
  const seenNovelTitles = new Set();
  const seenCerpenTitles = new Set();

  return books.filter((book) => {
    if (book.category === 'Komik') {
      if (!KOMIK_BOOK_IDS.includes(book.id)) return false;
      const titleKey = book.title.trim().toLowerCase();
      if (seenKomikTitles.has(titleKey)) return false;
      seenKomikTitles.add(titleKey);
      return true;
    }

    if (book.category === 'Novel') {
      if (!NOVEL_BOOK_IDS.includes(book.id)) return false;
      const titleKey = book.title.trim().toLowerCase();
      if (seenNovelTitles.has(titleKey)) return false;
      seenNovelTitles.add(titleKey);
      return true;
    }

    if (book.category === 'Cerpen') {
      if (!CERPEN_BOOK_IDS.includes(book.id)) return false;
      const titleKey = book.title.trim().toLowerCase();
      if (seenCerpenTitles.has(titleKey)) return false;
      seenCerpenTitles.add(titleKey);
      return true;
    }

    return true;
  });
}

// Menyelaraskan buku dalam satu kategori.
function syncCategoryBooks(books, category, ids, defaults) {
  let result = books.filter((b) => b.category !== category || ids.includes(b.id));
  defaults.forEach((item) => {
    const idx = result.findIndex((b) => b.id === item.id);
    if (idx === -1) result.push(item);
    else result[idx] = { ...result[idx], ...item, category };
  });
  return result;
}

// Memperbarui data buku lama di browser.
function migrateStoredBooks() {
  const currentVersion = localStorage.getItem(DATA_VERSION_KEY);
  if (currentVersion === DATA_VERSION) return;

  const stored = localStorage.getItem(BOOKS_KEY);
  const komikDefaults = DEFAULT_BOOKS.filter((b) => b.category === 'Komik');
  const novelDefaults = DEFAULT_BOOKS.filter((b) => b.category === 'Novel');
  const cerpenDefaults = DEFAULT_BOOKS.filter((b) => b.category === 'Cerpen');

  if (stored) {
    const legacyMap = {
      Fiction: 'Novel',
      Fantasy: 'Novel',
      Romance: 'Novel',
      Crime: 'Cerpen',
      'Sci-Fi': 'Novel',
      Bestsellers: 'Novel',
      Manga: 'Komik',
      eBooks: 'Novel',
      New: 'Novel',
      Audiobooks: 'Novel',
    };

    let books = JSON.parse(stored).map((book) => {
      const defaults = DEFAULT_BOOKS.find((d) => d.id === book.id);
      const merged = {
        ...(defaults || {}),
        ...book,
        category:
          legacyMap[book.category] ||
          (getCategories().some((c) => c.value === book.category) ? book.category : 'Novel'),
      };
      if (defaults && defaults.category === 'Komik') {
        return { ...merged, ...defaults, category: 'Komik' };
      }
      if (defaults && defaults.category === 'Novel') {
        return { ...merged, ...defaults, category: 'Novel' };
      }
      if (defaults && defaults.category === 'Cerpen') {
        // Paksa kembalikan data + sampul asli Cerpen.
        return { ...merged, ...defaults, category: 'Cerpen' };
      }
      return merged;
    });

    books = syncCategoryBooks(books, 'Komik', KOMIK_BOOK_IDS, komikDefaults);
    books = syncCategoryBooks(books, 'Novel', NOVEL_BOOK_IDS, novelDefaults);
    // Kembalikan 4 buku Cerpen beserta cover aslinya jika sempat terhapus.
    books = syncCategoryBooks(books, 'Cerpen', CERPEN_BOOK_IDS, cerpenDefaults);

    books = books.filter((b) => b.category !== 'Kamus');
    books = dedupeBooks(books);
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  } else {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(DEFAULT_BOOKS));
  }

  localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
}

// Mengembalikan cerita pendek bawaan jika hilang.
function restoreCerpenDefaults() {
  const stored = localStorage.getItem(BOOKS_KEY);
  if (!stored) return;
  const cerpenDefaults = DEFAULT_BOOKS.filter((b) => b.category === 'Cerpen');
  let books = JSON.parse(stored);
  const before = JSON.stringify(
    books
      .filter((b) => CERPEN_BOOK_IDS.includes(b.id))
      .map((b) => ({ id: b.id, title: b.title, cover: b.cover, category: b.category }))
  );
  books = syncCategoryBooks(books, 'Cerpen', CERPEN_BOOK_IDS, cerpenDefaults);
  const after = JSON.stringify(
    books
      .filter((b) => CERPEN_BOOK_IDS.includes(b.id))
      .map((b) => ({ id: b.id, title: b.title, cover: b.cover, category: b.category }))
  );
  if (before !== after) {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  }
}

// Contoh pesanan awal.
const DEFAULT_ORDERS = [
  { id: 'ORD-001', customer: 'Safhira Ardelia.P', book: 'Fairy Tale', total: 189000, status: 'completed', date: '2026-07-20' },
  { id: 'ORD-002', customer: 'Sarah Wijaya', book: 'Laskar Pelangi', total: 79000, status: 'shipped', date: '2026-07-22' },
  { id: 'ORD-003', customer: 'Ahmad Rizki', book: 'Atomic Habits', total: 168000, status: 'pending', date: '2026-07-24' },
  { id: 'ORD-004', customer: 'Maria Santos', book: 'Harry Potter', total: 210000, status: 'completed', date: '2026-07-24' },
];

// Menyiapkan daftar buku.
function initBooks() {
  migrateStoredBooks();
  if (!localStorage.getItem(BOOKS_KEY)) {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(DEFAULT_BOOKS));
  }
  restoreCerpenDefaults();
}

// Menyiapkan daftar pesanan.
function initOrders() {
  if (!localStorage.getItem(ORDERS_KEY)) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(DEFAULT_ORDERS));
  }
}

// Mengambil daftar buku.
function getBooks() {
  initBooks();
  return JSON.parse(localStorage.getItem(BOOKS_KEY));
}

// Mengambil buku dalam satu kategori.
function getBooksByCategory(category) {
  return getBooks().filter((b) => b.category === category);
}

// Menyimpan daftar buku.
function saveBooks(books) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

// Mengambil daftar pesanan.
function getOrders() {
  initOrders();
  return JSON.parse(localStorage.getItem(ORDERS_KEY));
}

// Menyimpan daftar pesanan.
function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

// Mengambil isi keranjang seorang pengguna.
function getCart(userId) {
  const all = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
  return all[userId] || [];
}

// Menyimpan isi keranjang.
function saveCart(userId, cart) {
  const all = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
  all[userId] = cart;
  localStorage.setItem(CART_KEY, JSON.stringify(all));
}

// Menambah buku ke keranjang.
function addToCart(userId, bookId, qty = 1) {
  const cart = getCart(userId);
  const existing = cart.find((item) => item.bookId === bookId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ bookId, qty });
  }
  saveCart(userId, cart);
  return cart;
}

// Mengubah jumlah barang di keranjang.
function updateCartQty(userId, bookId, qty) {
  let cart = getCart(userId);
  if (qty <= 0) {
    cart = cart.filter((item) => item.bookId !== bookId);
  } else {
    const item = cart.find((i) => i.bookId === bookId);
    if (item) item.qty = qty;
  }
  saveCart(userId, cart);
  return cart;
}

// Mengambil rincian barang di keranjang.
function getCartItems(userId) {
  const books = getBooks();
  return getCart(userId)
    .map((item) => {
      const book = books.find((b) => b.id === item.bookId);
      if (!book) return null;
      return { ...book, qty: item.qty, lineTotal: book.price * item.qty };
    })
    .filter(Boolean);
}

// Menghitung total keranjang.
function calcCartTotals(items) {
  const order = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
  const taxes = 5000;
  const delivery = 10000;
  return { order, totalQty, taxes, delivery, total: order + taxes + delivery };
}

// Mengosongkan keranjang.
function clearCart(userId) {
  saveCart(userId, []);
}

// Mengambil daftar buku favorit.
function getLoves(userId) {
  const all = JSON.parse(localStorage.getItem(LOVES_KEY) || '{}');
  return all[userId] || [];
}

// Menyimpan daftar buku favorit.
function saveLoves(userId, loves) {
  const all = JSON.parse(localStorage.getItem(LOVES_KEY) || '{}');
  all[userId] = loves;
  localStorage.setItem(LOVES_KEY, JSON.stringify(all));
}

// Memeriksa apakah buku sudah difavoritkan.
function isLoved(userId, bookId) {
  return getLoves(userId).includes(bookId);
}

// Menambah atau menghapus buku dari favorit.
function toggleLove(userId, bookId) {
  let loves = getLoves(userId);
  if (loves.includes(bookId)) {
    loves = loves.filter((id) => id !== bookId);
  } else {
    loves.push(bookId);
  }
  saveLoves(userId, loves);
  return loves.includes(bookId);
}

// Mengambil data lengkap buku favorit.
function getLovedBooks(userId) {
  const books = getBooks();
  return getLoves(userId)
    .map((id) => enrichBook(books.find((b) => b.id === id)))
    .filter(Boolean);
}

// Mengambil nama pendek penerima.
function recipientDisplayName(name) {
  const value = String(name || '').trim();
  if (!value || /bookstore/i.test(value)) return 'Safhira';
  return value.split(/\s+/)[0];
}

// Mengisi alamat awal.
function seedAddress(name) {
  return {
    id: 'addr-home',
    label: 'Rumah',
    recipient: recipientDisplayName(name),
    phone: '+62 812-3456-7890',
    address: 'Jl. Bukit Indah No. 12, Medan, Sumatera Utara 20155',
    city: 'Medan, Sumatera Utara',
    isDefault: true,
  };
}

// Mengambil daftar alamat.
function getAddresses(userId, fallbackName) {
  const all = JSON.parse(localStorage.getItem(ADDRESSES_KEY) || '{}');
  if (!Array.isArray(all[userId]) || all[userId].length === 0) {
    all[userId] = [seedAddress(fallbackName)];
    localStorage.setItem(ADDRESSES_KEY, JSON.stringify(all));
  }
  return all[userId];
}

// Menyimpan daftar alamat.
function saveAddresses(userId, addresses) {
  const all = JSON.parse(localStorage.getItem(ADDRESSES_KEY) || '{}');
  all[userId] = addresses;
  localStorage.setItem(ADDRESSES_KEY, JSON.stringify(all));
}

// Mengambil alamat yang sedang dipilih.
function getSelectedAddress(userId, fallbackName) {
  const list = getAddresses(userId, fallbackName);
  const selectedId = localStorage.getItem(`${SELECTED_ADDRESS_KEY}_${userId}`);
  return list.find((item) => item.id === selectedId) || list.find((item) => item.isDefault) || list[0];
}

// Menyimpan alamat yang dipilih.
function setSelectedAddress(userId, addressId) {
  localStorage.setItem(`${SELECTED_ADDRESS_KEY}_${userId}`, addressId);
}

// Menambah atau mengubah alamat.
function upsertAddress(userId, data, fallbackName) {
  const list = getAddresses(userId, fallbackName);
  let id = data.id;
  if (id) {
    const idx = list.findIndex((item) => item.id === id);
    if (idx !== -1) list[idx] = { ...list[idx], ...data, id };
  } else {
    id = `addr-${Date.now()}`;
    list.push({
      label: 'Alamat',
      recipient: recipientDisplayName(fallbackName),
      phone: '',
      address: '',
      city: '',
      isDefault: list.length === 0,
      ...data,
      id,
    });
  }
  if (data.isDefault || list.length === 1) {
    list.forEach((item) => {
      item.isDefault = item.id === id;
    });
    setSelectedAddress(userId, id);
  }
  saveAddresses(userId, list);
  return list.find((item) => item.id === id);
}

// Menghapus alamat.
function deleteAddress(userId, addressId, fallbackName) {
  let list = getAddresses(userId, fallbackName).filter((item) => item.id !== addressId);
  if (!list.length) list = [seedAddress(fallbackName)];
  if (!list.some((item) => item.isDefault)) list[0].isDefault = true;
  saveAddresses(userId, list);
  const selected = getSelectedAddress(userId, fallbackName);
  setSelectedAddress(userId, selected.id);
  return list;
}

// Menjadikan satu alamat sebagai alamat utama.
function setDefaultAddress(userId, addressId, fallbackName) {
  const list = getAddresses(userId, fallbackName).map((item) => ({
    ...item,
    isDefault: item.id === addressId,
  }));
  saveAddresses(userId, list);
  setSelectedAddress(userId, addressId);
  return list;
}

// Membuat pesanan baru.
function createOrder(customerName, book, qty = 1, userId, extras = {}) {
  const shipping = userId ? getSelectedAddress(userId, customerName) : null;
  const orders = getOrders();
  const computedTotal =
    typeof extras.total === 'number' ? extras.total : book.price * qty;
  const newOrder = {
    id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
    customer: customerName,
    book: book.title,
    total: computedTotal,
    status: 'pending',
    date: new Date().toISOString().slice(0, 10),
    shippingAddress: shipping,
    paymentMethod: extras.paymentMethod || '',
    paymentProof: extras.paymentProof || '',
    userId: userId || '',
  };
  orders.unshift(newOrder);
  saveOrders(orders);

  const books = getBooks();
  const idx = books.findIndex((b) => b.id === book.id);
  if (idx !== -1 && books[idx].stock >= qty) {
    books[idx].stock -= qty;
    saveBooks(books);
  }

  return newOrder;
}

// Membuat pesanan dari isi keranjang.
function createOrderFromCart(userId, customerName, extras = {}) {
  const items = getCartItems(userId);
  if (items.length === 0) return null;

  const books = getBooks();
  for (const item of items) {
    const book = books.find((b) => b.id === item.id);
    if (!book || book.stock < item.qty) return null;
  }

  const shipping = getSelectedAddress(userId, customerName);
  const totals = calcCartTotals(items);
  const orders = getOrders();
  const newOrder = {
    id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
    customer: customerName,
    book: items.map((i) => `${i.title} (×${i.qty})`).join(', '),
    total: typeof extras.total === 'number' ? extras.total : totals.total,
    status: 'pending',
    date: new Date().toISOString().slice(0, 10),
    shippingAddress: shipping,
    paymentMethod: extras.paymentMethod || '',
    paymentProof: extras.paymentProof || '',
    userId: userId || '',
  };
  orders.unshift(newOrder);
  saveOrders(orders);

  items.forEach((item) => {
    const idx = books.findIndex((b) => b.id === item.id);
    if (idx !== -1) books[idx].stock -= item.qty;
  });
  saveBooks(books);
  clearCart(userId);
  return newOrder;
}

// Melengkapi data buku yang kosong.
function enrichBook(book) {
  const defaults = {
    description:
      'Buku pilihan dari BookStore dengan cerita menarik dan penulisan berkualitas.',
    rating: 4.5,
    reviews: 1000,
    language: 'Bahasa Indonesia',
    pages: 300,
    year: 2024,
    publisher: 'Gramedia Pustaka Utama',
  };
  return book ? { ...defaults, ...book } : null;
}

// Mengambil satu buku berdasarkan identitasnya.
function getBookById(id) {
  return enrichBook(getBooks().find((b) => b.id === id));
}

// Mengubah jumlah ulasan menjadi tulisan singkat.
function formatReviews(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)} jt ulasan`;
  if (count >= 1000) return `${Math.round(count / 1000)} rb ulasan`;
  return `${count} ulasan`;
}

// Mengambil daftar ulasan.
function getReviews() {
  return JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]');
}

// Menyimpan daftar ulasan.
function saveReviews(reviews) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
}

// Mencari ulasan milik satu pesanan.
function getReviewByOrderId(orderId) {
  return getReviews().find((review) => review.orderId === orderId) || null;
}

// Menyimpan ulasan baru.
function addReview({ orderId, userId, userName, bookTitle, rating, comment }) {
  const reviews = getReviews();
  const review = {
    id: `REV-${Date.now()}`,
    orderId,
    userId,
    userName,
    bookTitle,
    rating: Number(rating),
    comment: String(comment || '').trim(),
    createdAt: new Date().toISOString(),
    read: false,
    readAt: null,
  };
  const existing = reviews.findIndex((item) => item.orderId === orderId);
  if (existing !== -1) {
    reviews[existing] = { ...reviews[existing], ...review, id: reviews[existing].id };
  } else {
    reviews.unshift(review);
  }
  saveReviews(reviews);
  return review;
}

// Menghitung ulasan yang belum dibaca admin.
function getUnreadReviewCount() {
  return getReviews().filter((review) => !review.read).length;
}

// Menandai ulasan sebagai sudah dibaca.
function markReviewRead(id) {
  const reviews = getReviews();
  const index = reviews.findIndex((item) => String(item.id) === String(id));
  if (index === -1) return null;
  if (reviews[index].read) return reviews[index];
  reviews[index] = {
    ...reviews[index],
    read: true,
    readAt: new Date().toISOString(),
  };
  saveReviews(reviews);
  return reviews[index];
}

// Mengubah angka menjadi tulisan rupiah.
function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

initCategories();
initBooks();
initOrders();

