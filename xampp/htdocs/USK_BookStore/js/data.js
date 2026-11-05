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

const KOMIK_BOOK_IDS = ['7', '9', '10', '11'];
const NOVEL_BOOK_IDS = ['1', '2', '3', '12'];
const CERPEN_BOOK_IDS = ['4', '13', '14', '15'];

const DEFAULT_CATEGORIES = [
  { value: 'Novel', label: 'Novel' },
  { value: 'Komik', label: 'Komik' },
  { value: 'Cerpen', label: 'Cerpen' },
];

const CATEGORY_PAGES = {
  Novel: 'novel.html',
  Komik: 'komik.html',
  Cerpen: 'cerpen.html',
};

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

function getCategories() {
  initCategories();
  return JSON.parse(localStorage.getItem(CATEGORIES_KEY));
}

function saveCategories(categories) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

function getBrowsableCategories() {
  return [{ value: 'All', label: 'Semua' }, ...getCategories()];
}

function getCategoryPage(value) {
  return CATEGORY_PAGES[value] || '';
}

function normalizeCategoryValue(label) {
  return String(label || '')
    .trim()
    .replace(/\s+/g, ' ');
}

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

function getCategoryLabel(value) {
  if (value === 'All') return 'Semua';
  const found = getCategories().find((c) => c.value === value);
  return found ? found.label : value;
}

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

function syncCategoryBooks(books, category, ids, defaults) {
  let result = books.filter((b) => b.category !== category || ids.includes(b.id));
  defaults.forEach((item) => {
    const idx = result.findIndex((b) => b.id === item.id);
    if (idx === -1) result.push(item);
    else result[idx] = { ...result[idx], ...item, category };
  });
  return result;
}

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

const DEFAULT_ORDERS = [];

function initBooks() {
  migrateStoredBooks();
  if (!localStorage.getItem(BOOKS_KEY)) {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(DEFAULT_BOOKS));
  }
  restoreCerpenDefaults();
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

function getBooksByCategory(category) {
  return getBooks().filter((b) => b.category === category);
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

function calcCartTotals(items) {
  const order = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
  const taxes = 5000;
  const delivery = 10000;
  return { order, totalQty, taxes, delivery, total: order + taxes + delivery };
}

function clearCart(userId) {
  saveCart(userId, []);
}

function getLoves(userId) {
  const all = JSON.parse(localStorage.getItem(LOVES_KEY) || '{}');
  return all[userId] || [];
}

function saveLoves(userId, loves) {
  const all = JSON.parse(localStorage.getItem(LOVES_KEY) || '{}');
  all[userId] = loves;
  localStorage.setItem(LOVES_KEY, JSON.stringify(all));
}

function isLoved(userId, bookId) {
  return getLoves(userId).includes(bookId);
}

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

function getLovedBooks(userId) {
  const books = getBooks();
  return getLoves(userId)
    .map((id) => enrichBook(books.find((b) => b.id === id)))
    .filter(Boolean);
}

function recipientDisplayName(name) {
  const value = String(name || '').trim();
  if (!value || /bookstore/i.test(value)) return 'Penerima';
  return value.split(/\s+/)[0];
}

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

function getAddresses(userId, fallbackName) {
  const all = JSON.parse(localStorage.getItem(ADDRESSES_KEY) || '{}');
  if (!Array.isArray(all[userId]) || all[userId].length === 0) {
    all[userId] = [seedAddress(fallbackName)];
    localStorage.setItem(ADDRESSES_KEY, JSON.stringify(all));
  }
  return all[userId];
}

function saveAddresses(userId, addresses) {
  const all = JSON.parse(localStorage.getItem(ADDRESSES_KEY) || '{}');
  all[userId] = addresses;
  localStorage.setItem(ADDRESSES_KEY, JSON.stringify(all));
}

function getSelectedAddress(userId, fallbackName) {
  const list = getAddresses(userId, fallbackName);
  const selectedId = localStorage.getItem(`${SELECTED_ADDRESS_KEY}_${userId}`);
  return list.find((item) => item.id === selectedId) || list.find((item) => item.isDefault) || list[0];
}

function setSelectedAddress(userId, addressId) {
  localStorage.setItem(`${SELECTED_ADDRESS_KEY}_${userId}`, addressId);
}

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

function deleteAddress(userId, addressId, fallbackName) {
  let list = getAddresses(userId, fallbackName).filter((item) => item.id !== addressId);
  if (!list.length) list = [seedAddress(fallbackName)];
  if (!list.some((item) => item.isDefault)) list[0].isDefault = true;
  saveAddresses(userId, list);
  const selected = getSelectedAddress(userId, fallbackName);
  setSelectedAddress(userId, selected.id);
  return list;
}

function setDefaultAddress(userId, addressId, fallbackName) {
  const list = getAddresses(userId, fallbackName).map((item) => ({
    ...item,
    isDefault: item.id === addressId,
  }));
  saveAddresses(userId, list);
  setSelectedAddress(userId, addressId);
  return list;
}

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
  attachOrderTracking(newOrder, customerName);
  saveOrders(orders);

  const books = getBooks();
  const idx = books.findIndex((b) => b.id === book.id);
  if (idx !== -1 && books[idx].stock >= qty) {
    books[idx].stock -= qty;
    saveBooks(books);
  }

  return newOrder;
}

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
  attachOrderTracking(newOrder, customerName);
  saveOrders(orders);

  items.forEach((item) => {
    const idx = books.findIndex((b) => b.id === item.id);
    if (idx !== -1) books[idx].stock -= item.qty;
  });
  saveBooks(books);
  clearCart(userId);
  return newOrder;
}

const DEFAULT_SHIPPING_ADDRESS = {
  phone: '+62 812-3456-7890',
  address: 'Jl. Bukit Indah No. 12, Medan, Sumatera Utara 20155',
  destination: 'Medan, Sumatera Utara',
  origin: 'Jakarta',
};

const TRACKING_STEPS = [
  {
    key: 'paid',
    title: 'Pembayaran diterima',
    location: 'BookStore',
    desc: 'Pesanan sudah dibayar dan menunggu dikemas.',
  },
  {
    key: 'packed',
    title: 'Pesanan dikemas',
    location: 'Gudang BookStore, Jakarta',
    desc: 'Buku sedang dikemas di gudang pengirim.',
  },
  {
    key: 'handover',
    title: 'Diserahkan ke kurir',
    location: 'Jakarta',
    desc: 'Paket sudah diambil J&T Express.',
  },
  {
    key: 'transit',
    title: 'Dalam perjalanan',
    location: 'Transit Medan',
    desc: 'Paket dalam perjalanan menuju kota tujuan.',
  },
  {
    key: 'delivery',
    title: 'Sedang diantar kurir',
    location: 'Medan, Sumatera Utara',
    desc: 'Kurir sedang mengantar paket ke alamat Anda.',
  },
  {
    key: 'delivered',
    title: 'Paket sampai',
    location: 'Jl. Bukit Indah No. 12, Medan',
    desc: 'Paket telah tiba di alamat tujuan.',
  },
];

function getOrderById(orderId) {
  const orders = getOrders();
  const order = orders.find((item) => item.id === orderId);
  if (!order) return null;
  attachOrderTracking(order, order.customer);
  saveOrders(orders);
  return order;
}

function saveOrderPaymentProof(orderId, paymentProof) {
  if (!orderId || !paymentProof) {
    return { success: false, message: 'Data bukti TF tidak lengkap.' };
  }
  const orders = getOrders();
  const index = orders.findIndex((item) => item.id === orderId);
  if (index === -1) {
    return { success: false, message: 'Pesanan tidak ditemukan.' };
  }
  orders[index] = {
    ...orders[index],
    paymentProof,
    paymentMethod: orders[index].paymentMethod || 'bank',
  };
  saveOrders(orders);
  return { success: true, order: orders[index] };
}

function attachOrderTracking(order, customerName) {
  if (!order) return null;
  if (!order.paidAt) {
    order.paidAt = `${order.date || new Date().toISOString().slice(0, 10)}T08:00:00`;
  }

  const shipping = order.shippingAddress || {};
  const recipient =
    shipping.recipient || customerName || order.customer || 'Penerima';
  const phone = shipping.phone || DEFAULT_SHIPPING_ADDRESS.phone;
  const address = shipping.address || DEFAULT_SHIPPING_ADDRESS.address;
  const destination =
    shipping.city || DEFAULT_SHIPPING_ADDRESS.destination;

  if (!order.tracking) {
    const digits = String(order.id).replace(/\D/g, '').padStart(10, '8');
    order.tracking = {
      courier: 'J&T Express',
      resi: `JT${digits}ID`,
      recipient,
      phone,
      address,
      origin: DEFAULT_SHIPPING_ADDRESS.origin,
      destination,
    };
  } else {
    order.tracking.recipient = order.tracking.recipient || recipient;
    order.tracking.phone = order.tracking.phone || phone;
    order.tracking.address = order.tracking.address || address;
    order.tracking.destination = order.tracking.destination || destination;
    order.tracking.origin = order.tracking.origin || DEFAULT_SHIPPING_ADDRESS.origin;
    order.tracking.courier = order.tracking.courier || 'J&T Express';
    if (!order.tracking.resi) {
      const digits = String(order.id).replace(/\D/g, '').padStart(10, '8');
      order.tracking.resi = `JT${digits}ID`;
    }
  }
  return order;
}

function getTrackingStepIndex(order) {
  if (!order) return 0;
  if (order.status === 'completed') return TRACKING_STEPS.length - 1;

  const paidAt = new Date(order.paidAt || `${order.date}T08:00:00`).getTime();
  const autoStep = Math.floor((Date.now() - paidAt) / 20000);

  if (order.status === 'shipped') {
    return Math.min(Math.max(autoStep, 0), TRACKING_STEPS.length - 2);
  }
  return Math.min(Math.max(autoStep, 0), 2);
}

function getTrackingTimeline(order) {
  const current = getTrackingStepIndex(order);
  const paidAt = new Date(order.paidAt || `${order.date}T08:00:00`).getTime();

  return TRACKING_STEPS.map((step, index) => {
    const time = new Date(paidAt + index * 20000);
    return {
      ...step,
      index,
      done: index < current,
      current: index === current,
      upcoming: index > current,
      timeLabel: time.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  });
}

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

function getBookById(id) {
  return enrichBook(getBooks().find((b) => b.id === id));
}

function formatReviews(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)} jt ulasan`;
  if (count >= 1000) return `${Math.round(count / 1000)} rb ulasan`;
  return `${count} ulasan`;
}

function getReviews() {
  return JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]');
}

function saveReviews(reviews) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
}

function getReviewByOrderId(orderId) {
  return getReviews().find((review) => review.orderId === orderId) || null;
}

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

function getUnreadReviewCount() {
  return getReviews().filter((review) => !review.read).length;
}

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

const BALANCE_KEY = 'usk_bookstore_balances';

function readBalances() {
  try {
    return JSON.parse(localStorage.getItem(BALANCE_KEY) || '{}');
  } catch (error) {
    return {};
  }
}

function getUserBalance(userId) {
  const balances = readBalances();
  return Number(balances[String(userId)] || 0);
}

function addUserBalance(userId, amount) {
  const value = Number(amount) || 0;
  if (!userId || !value) return getUserBalance(userId);
  const balances = readBalances();
  const next = Number(balances[String(userId)] || 0) + value;
  balances[String(userId)] = next;
  localStorage.setItem(BALANCE_KEY, JSON.stringify(balances));
  return next;
}

function orderPaymentReceived(order, previousStatus) {
  if (!order) return false;
  if (order.paymentStatus === 'verified' || order.paymentProof) return true;
  return previousStatus === 'shipped' || previousStatus === 'completed';
}

function userIdForOrder(order) {
  const users = typeof getUsers === 'function' ? getUsers() : [];
  const match =
    users.find((item) => order.userId && String(item.id) === String(order.userId)) ||
    users.find((item) => item.name === order.customer);
  return match ? match.id : order.userId || '';
}

function refundCancelledOrder(order, previousStatus) {
  if (!order || order.refunded) return false;
  const amount = Number(order.total) || 0;
  if (amount <= 0 || !orderPaymentReceived(order, previousStatus)) return false;
  const userId = userIdForOrder(order);
  if (!userId) return false;
  addUserBalance(userId, amount);
  order.refunded = true;
  order.refundAmount = amount;
  return true;
}

function repairCancelledRefund(order) {
  if (!order || order.status !== 'cancelled' || order.refunded) return false;
  if (order.statusBeforeCancel === 'pending' && !order.paymentProof && order.paymentStatus !== 'verified') {
    return false;
  }
  const previous = order.statusBeforeCancel || 'shipped';
  return refundCancelledOrder(order, previous);
}

function reverseOrderRefund(order) {
  if (!order?.refunded) return false;
  const amount = Number(order.refundAmount) || 0;
  const userId = userIdForOrder(order);
  if (userId && amount > 0) addUserBalance(userId, -amount);
  order.refunded = false;
  order.refundAmount = 0;
  return true;
}

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

(function clearDemoExamStore() {
  const flag = 'usk_bookstore_exam_reset';
  if (localStorage.getItem(flag) === '1') return;
  const demo = (value) => /safhira|putri/i.test(String(value || ''));
  localStorage.setItem(ORDERS_KEY, '[]');
  localStorage.setItem(REVIEWS_KEY, '[]');
  localStorage.removeItem('usk_bookstore_chat_messages');
  localStorage.removeItem('usk_bookstore_balances');
  try {
    const stored = JSON.parse(localStorage.getItem('usk_bookstore_users') || '[]');
    const kept = (Array.isArray(stored) ? stored : []).filter(
      (user) => user && user.email !== 'user@usk.com' && !demo(user.name) && !demo(user.email)
    );
    if (!kept.some((user) => user.email === 'admin@usk.com')) {
      kept.unshift({ id: '1', name: 'Admin', email: 'admin@usk.com', password: 'admin123', role: 'admin' });
    }
    localStorage.setItem('usk_bookstore_users', JSON.stringify(kept));
  } catch (error) {
    localStorage.setItem(
      'usk_bookstore_users',
      JSON.stringify([{ id: '1', name: 'Admin', email: 'admin@usk.com', password: 'admin123', role: 'admin' }])
    );
  }
  try {
    const session = JSON.parse(localStorage.getItem('usk_bookstore_auth') || 'null');
    if (session && (session.email === 'user@usk.com' || demo(session.name) || demo(session.email))) {
      localStorage.removeItem('usk_bookstore_auth');
    }
  } catch (error) {
    localStorage.removeItem('usk_bookstore_auth');
  }
  localStorage.setItem(flag, '1');
})();

(function restoreExamBookStock() {
  const stockFlag = 'usk_bookstore_exam_stock';
  if (localStorage.getItem(stockFlag) === '1') return;
  try {
    const stored = JSON.parse(localStorage.getItem(BOOKS_KEY) || 'null');
    if (Array.isArray(stored)) {
      const defaults = Object.fromEntries(DEFAULT_BOOKS.map((book) => [String(book.id), book.stock]));
      stored.forEach((book) => {
        const original = defaults[String(book.id)];
        if (original != null) book.stock = original;
      });
      localStorage.setItem(BOOKS_KEY, JSON.stringify(stored));
    }
  } catch (error) {
    // Katalog tetap seperti yang tersimpan jika data buku tidak bisa dibaca.
  }
  localStorage.setItem(stockFlag, '1');
})();

initCategories();
initBooks();
initOrders();

