// File: js/chat.js
// Deskripsi: Skrip percakapan antara pengguna dan admin.
const CHAT_KEY = 'usk_bookstore_chat_messages';
const CHAT_API_URL = 'api/chat.php';
const CHAT_CHANNEL = 'usk-bookstore-chat';

// Mengamankan teks pesan agar aman ditampilkan.
function escapeChatHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Mengambil pesan yang tersimpan di browser.
function getLocalChatMessages() {
  try {
    return JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
  } catch (error) {
    return [];
  }
}

// Menyimpan pesan percakapan di browser.
function saveLocalChatMessages(messages) {
  localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
  notifyChatUpdated();
}

// Memberi tahu halaman lain bahwa percakapan berubah.
function notifyChatUpdated() {
  window.dispatchEvent(new CustomEvent('usk-chat-updated'));
  try {
    if (!window.__uskChatChannel) {
      window.__uskChatChannel = new BroadcastChannel(CHAT_CHANNEL);
    }
    window.__uskChatChannel.postMessage({ type: 'updated' });
  } catch (error) {
    // BroadcastChannel may be unavailable in some browsers.
  }
}

// Mengirim permintaan percakapan ke server.
async function requestChatApi(action, payload = {}) {
  try {
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
    return await response.json();
  } catch (error) {
    return { success: false };
  }
}

// Menyusun daftar percakapan dari pesan lokal.
function localConversations() {
  const grouped = new Map();
  getLocalChatMessages().forEach((message) => {
    const current = grouped.get(message.conversationId);
    if (!current || Number(message.id) > Number(current.lastId)) {
      grouped.set(message.conversationId, {
        conversationId: message.conversationId,
        userName: message.senderRole === 'user' ? message.senderName : current?.userName || 'Pengguna',
        userEmail: message.senderRole === 'user' ? message.senderEmail : current?.userEmail || '',
        lastText: message.text,
        lastAt: message.createdAt,
        lastRole: message.senderRole,
        lastId: message.id,
        unread: 0,
      });
    }
    if (message.senderRole === 'user') {
      const item = grouped.get(message.conversationId);
      item.userName = message.senderName || item.userName;
      item.userEmail = message.senderEmail || item.userEmail;
    }
  });

  return Array.from(grouped.values())
    .map((item) => {
      item.unread = getLocalChatMessages().filter(
        (message) =>
          message.conversationId === item.conversationId &&
          message.senderRole === 'user' &&
          !message.isRead
      ).length;
      return item;
    })
    .sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
}

// Mengambil isi satu percakapan.
async function fetchChatMessages(conversationId) {
  const result = await requestChatApi('messages', { conversationId });
  if (result.success) return result.messages || [];
  return getLocalChatMessages().filter((message) => message.conversationId === String(conversationId));
}

// Mengambil daftar percakapan.
async function fetchChatConversations() {
  const result = await requestChatApi('conversations');
  if (result.success) return result.conversations || [];
  return localConversations();
}

// Mengirim pesan baru.
async function sendChatMessage({ conversationId, senderId, senderRole, senderName, senderEmail, text }) {
  const payload = {
    conversationId: String(conversationId),
    senderId: String(senderId),
    senderRole,
    senderName,
    senderEmail: senderEmail || '',
    text: text.trim(),
  };

  const result = await requestChatApi('send', payload);
  if (result.success && result.message) {
    notifyChatUpdated();
    return result.message;
  }

  const message = {
    id: String(Date.now()),
    ...payload,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  const messages = getLocalChatMessages();
  messages.push(message);
  saveLocalChatMessages(messages);
  return message;
}

// Menandai pesan sebagai sudah dibaca.
async function markChatRead(conversationId, readerRole) {
  const result = await requestChatApi('mark_read', { conversationId, readerRole });
  if (result.success) {
    notifyChatUpdated();
    return;
  }

  const targetRole = readerRole === 'admin' ? 'user' : 'admin';
  const messages = getLocalChatMessages().map((message) => {
    if (message.conversationId === String(conversationId) && message.senderRole === targetRole) {
      return { ...message, isRead: true };
    }
    return message;
  });
  saveLocalChatMessages(messages);
}

// Mengubah waktu pesan menjadi jam.
function formatChatTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// Mengubah tanggal pesan menjadi keterangan hari.
function formatChatDateLabel(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Hari ini';
  if (date.toDateString() === yesterday.toDateString()) return 'Kemarin';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Mengubah waktu terakhir pesan pada daftar percakapan.
function formatChatListTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return formatChatTime(iso);
  }
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

// Memendekkan cuplikan pesan.
function previewChatText(text, max = 52) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

// Mengambil inisial nama pengirim.
function getChatInitials(name) {
  return String(name || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Menunda sesaat sebelum langkah berikutnya.
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Menyusun balasan otomatis admin.
function getAdminAutoReply(text, user) {
  const raw = String(text || '').trim();
  const q = raw.toLowerCase();
  const firstName = String(user?.name || 'kak').split(' ')[0];

  if (/(pesan|status|kirim|resi|lacak|tracking)/.test(q)) {
    const orders =
      typeof getOrders === 'function'
        ? getOrders().filter((order) => order.customer === user?.name)
        : [];
    if (orders.length) {
      const last = orders[0];
      const statusMap = {
        pending: 'masih menunggu diproses',
        shipped: 'sedang dikirim',
        completed: 'sudah selesai',
      };
      return `Pesanan terakhir Anda (${last.book}) ${statusMap[last.status] || last.status}. Jika perlu, kirim ID pesanan untuk kami cek lebih detail.`;
    }
    return 'Kami belum menemukan pesanan atas nama akun ini. Coba buka menu Pesanan, atau kirim ID pesanan Anda agar kami bantu cek.';
  }

  if (/(kembali|refund|cacat|rusak|retur|pengembalian)/.test(q)) {
    return 'Untuk pengembalian, siapkan foto kondisi buku dan ID pesanan. Setelah data lengkap, tim kami proses dalam 1x24 jam kerja.';
  }

  if (/(akun|password|login|email|profil)/.test(q)) {
    return 'Untuk bantuan akun, pastikan Anda masuk dengan email terdaftar. Jika ada kendala login, kirim email akun Anda di sini agar kami bantu cek.';
  }

  if (/(buku|rekomendasi|novel|komik|cerpen|fantasi|dongeng)/.test(q) && typeof getBooks === 'function') {
    const books = getBooks().slice(0, 3).map((book) => book.title);
    if (books.length) {
      return `Tentu! Rekomendasi hari ini: ${books.join(', ')}. Mau kami bantu cari judul tertentu?`;
    }
  }

  if (/(harga|bayar|pembayaran|ongkir)/.test(q)) {
    return 'Pembayaran bisa lewat kartu, e-wallet, transfer bank, atau COD. Ongkir dihitung otomatis saat checkout. Ada metode yang ingin ditanyakan?';
  }

  if (/^(halo|hai|hello|hi|selamat\s+\w+)([\s!,.]+.*)?$/i.test(raw) && raw.length < 24) {
    return `Halo ${firstName}! Selamat datang di BookStore. Ada yang bisa kami bantu terkait pesanan, pengembalian, atau rekomendasi buku?`;
  }

  return `Terima kasih, ${firstName}. Pesan Anda sudah kami terima. Tim Admin BookStore akan bantu secepatnya. Ada detail lain yang ingin disampaikan?`;
}

// Menampilkan rangkaian pesan.
function renderChatThread(container, messages, currentRole) {
  if (!container) return;
  const wasNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
  let lastDate = '';

  const html = messages
    .map((message) => {
      const dateLabel = formatChatDateLabel(message.createdAt);
      const dateChip =
        dateLabel && dateLabel !== lastDate
          ? `<div class="chat-date-chip">${escapeChatHtml(dateLabel)}</div>`
          : '';
      lastDate = dateLabel;
      const mine = message.senderRole === currentRole;
      return `
        ${dateChip}
        <div class="chat-row ${mine ? 'is-mine' : 'is-theirs'}">
          ${mine ? '' : `<div class="chat-mini-avatar">${escapeChatHtml(getChatInitials(message.senderName))}</div>`}
          <div class="chat-bubble ${mine ? 'user' : 'support'}">
            <p>${escapeChatHtml(message.text)}</p>
            <span class="chat-meta">
              ${escapeChatHtml(formatChatTime(message.createdAt))}
              ${mine ? '<span class="chat-check">✓✓</span>' : ''}
            </span>
          </div>
        </div>
      `;
    })
    .join('');

  container.innerHTML = html || '';
  if (wasNearBottom || !messages.length) {
    container.scrollTop = container.scrollHeight;
  }
}

// Memantau pesan baru.
function subscribeChatUpdates(callback) {
  const onUpdate = () => callback();
  window.addEventListener('usk-chat-updated', onUpdate);
  window.addEventListener('storage', (event) => {
    if (event.key === CHAT_KEY) onUpdate();
  });

  try {
    if (!window.__uskChatChannel) {
      window.__uskChatChannel = new BroadcastChannel(CHAT_CHANNEL);
    }
    window.__uskChatChannel.addEventListener('message', onUpdate);
  } catch (error) {
    // Ignore.
  }

  const timer = setInterval(onUpdate, 2500);
  return () => {
    window.removeEventListener('usk-chat-updated', onUpdate);
    clearInterval(timer);
  };
}

// Menyiapkan percakapan di sisi pengguna.
function initUserChat(user) {
  const messagesEl = document.getElementById('chatMessages');
  const inputEl = document.getElementById('chatInput');
  const formEl = document.getElementById('chatForm');
  const quickEl = document.getElementById('chatQuick');
  const panelEl = document.getElementById('chatPanel');
  const fabEl = document.getElementById('chatFab');
  const closeEl = document.getElementById('chatClose');
  const clearEl = document.getElementById('chatClear');
  if (!messagesEl || !inputEl || !user) return;

  const conversationId = String(user.id);
  const clearedThroughKey = `usk_bookstore_chat_cleared_${conversationId}`;
  let lastSignature = '';
  let currentMessages = [];

  // Menampilkan tampilan saat data masih kosong.
  function emptyState() {
    return `
      <div class="chat-empty">
        <div class="chat-empty-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h4>Chat dengan Admin</h4>
        <p>Tanyakan pesanan, pengembalian, atau bantuan akun. Admin akan membalas di sini.</p>
      </div>
    `;
  }

  // Memuat ulang pesan pada percakapan pengguna.
  async function refresh() {
    const allMessages = await fetchChatMessages(conversationId);
    const clearedThrough = Number(localStorage.getItem(clearedThroughKey) || 0);
    const messages = allMessages.filter((message) => Number(message.id) > clearedThrough);
    currentMessages = messages;
    const signature = JSON.stringify(messages.map((item) => [item.id, item.text, item.createdAt]));
    if (signature === lastSignature) return;
    lastSignature = signature;

    if (!messages.length) {
      messagesEl.innerHTML = emptyState();
      if (quickEl) quickEl.style.display = '';
    } else {
      if (quickEl) quickEl.style.display = 'none';
      renderChatThread(messagesEl, messages, 'user');
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    await markChatRead(conversationId, 'user');
  }

  clearEl?.addEventListener('click', () => {
    if (!currentMessages.length || !window.confirm('Hapus riwayat chat dari halaman ini?')) return;
    const latestMessageId = currentMessages.reduce(
      (latestId, message) => Math.max(latestId, Number(message.id) || 0),
      0
    );
    localStorage.setItem(clearedThroughKey, String(latestMessageId));
    lastSignature = '';
    refresh();
  });

  // Menampilkan atau menyembunyikan tanda admin sedang mengetik.
  function setTyping(visible) {
    document.getElementById('chatTyping')?.remove();
    if (!visible) return;
    const typing = document.createElement('div');
    typing.id = 'chatTyping';
    typing.className = 'chat-row is-theirs';
    typing.innerHTML = `
      <div class="chat-mini-avatar">AD</div>
      <div class="chat-bubble support typing-bubble">
        <span class="typing-dots"><i></i><i></i><i></i></span>
      </div>
    `;
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // Mengirim pesan dari pengguna ke admin.
  async function send(text) {
    const value = String(text || '').trim();
    if (!value) return;
    inputEl.value = '';
    if (quickEl) quickEl.style.display = 'none';
    await sendChatMessage({
      conversationId,
      senderId: user.id,
      senderRole: 'user',
      senderName: user.name,
      senderEmail: user.email,
      text: value,
    });
    lastSignature = '';
    await refresh();
    setTyping(true);
    await delay(900 + Math.min(value.length * 20, 700));
    await sendChatMessage({
      conversationId,
      senderId: 'admin-bot',
      senderRole: 'admin',
      senderName: 'Admin BookStore',
      senderEmail: 'admin@usk.com',
      text: getAdminAutoReply(value, user),
    });
    setTyping(false);
    lastSignature = '';
    await refresh();
  }

  if (formEl) {
    formEl.addEventListener('submit', (event) => {
      event.preventDefault();
      send(inputEl.value);
    });
  } else {
    document.getElementById('chatSend')?.addEventListener('click', () => send(inputEl.value));
    inputEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        send(inputEl.value);
      }
    });
  }

  quickEl?.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => send(button.dataset.msg || button.textContent));
  });

  // Membuka atau menutup panel percakapan.
  function setChatOpen(open) {
    document.body.classList.toggle('chat-collapsed', !open);
    document.body.classList.toggle('chat-open', open);
    panelEl?.classList.toggle('is-open', open);
    localStorage.setItem('usk_chat_open', open ? '1' : '0');
  }

  fabEl?.addEventListener('click', () => setChatOpen(true));
  closeEl?.addEventListener('click', () => setChatOpen(false));

  const savedChat = localStorage.getItem('usk_chat_open');
  setChatOpen(savedChat === null ? window.innerWidth > 1100 : savedChat === '1');

  subscribeChatUpdates(refresh);
  refresh();
}

// Menyiapkan kotak pesan di sisi admin.
function initAdminChat(adminUser) {
  const listEl = document.getElementById('inboxList');
  const threadEl = document.getElementById('inboxMessages');
  const emptyEl = document.getElementById('inboxEmpty');
  const threadWrapEl = document.getElementById('inboxThread');
  const nameEl = document.getElementById('inboxUserName');
  const emailEl = document.getElementById('inboxUserEmail');
  const avatarEl = document.getElementById('inboxUserAvatar');
  const formEl = document.getElementById('inboxForm');
  const inputEl = document.getElementById('inboxInput');
  const searchEl = document.getElementById('inboxSearch');
  const badgeEl = document.getElementById('chatNavBadge');
  if (!listEl || !adminUser) return;

  let activeId = null;
  let conversations = [];
  let lastListSignature = '';
  let lastThreadSignature = '';

  // Menghitung pesan pengguna yang belum dibaca admin.
  function totalUnread() {
    return conversations.reduce((sum, item) => sum + (item.unread || 0), 0);
  }

  // Memperbarui angka pada menu pesan.
  function updateBadge() {
    if (!badgeEl) return;
    const count = totalUnread();
    badgeEl.textContent = count > 9 ? '9+' : String(count);
    badgeEl.classList.toggle('show', count > 0);
  }

  // Menyaring percakapan sesuai kata pencarian.
  function filteredConversations() {
    const query = (searchEl?.value || '').trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((item) =>
      `${item.userName} ${item.userEmail} ${item.lastText}`.toLowerCase().includes(query)
    );
  }

  // Menampilkan daftar percakapan di sisi admin.
  function renderList() {
    const items = filteredConversations();
    if (!items.length) {
      listEl.innerHTML = `
        <div class="inbox-empty-list">
          <p>Belum ada percakapan.</p>
          <span>Pesan dari pengguna akan muncul di sini.</span>
        </div>
      `;
      return;
    }

    listEl.innerHTML = items
      .map(
        (item) => `
        <button class="inbox-item ${item.conversationId === activeId ? 'active' : ''} ${item.unread ? 'has-unread' : ''}" type="button" data-id="${escapeChatHtml(item.conversationId)}">
          <div class="inbox-avatar-wrap">
            <div class="inbox-avatar">${escapeChatHtml(getChatInitials(item.userName))}</div>
            <span class="inbox-online" aria-hidden="true"></span>
          </div>
          <div class="inbox-item-body">
            <div class="inbox-item-top">
              <strong>${escapeChatHtml(item.userName || 'Pengguna')}</strong>
              <time>${escapeChatHtml(formatChatListTime(item.lastAt))}</time>
            </div>
            <div class="inbox-item-bottom">
              <p>${item.lastRole === 'admin' ? 'Anda: ' : ''}${escapeChatHtml(previewChatText(item.lastText))}</p>
              ${item.unread ? `<span class="inbox-unread">${item.unread}</span>` : ''}
            </div>
          </div>
        </button>
      `
      )
      .join('');

    listEl.querySelectorAll('.inbox-item').forEach((button) => {
      button.addEventListener('click', () => openConversation(button.dataset.id));
    });
  }

  // Menampilkan isi percakapan yang sedang dibuka admin.
  async function renderThread() {
    if (!activeId) {
      emptyEl?.classList.remove('hidden');
      threadWrapEl?.classList.add('hidden');
      return;
    }

    const messages = await fetchChatMessages(activeId);
    const signature = JSON.stringify(messages.map((item) => [item.id, item.text]));
    if (signature === lastThreadSignature) return;
    lastThreadSignature = signature;

    emptyEl?.classList.add('hidden');
    threadWrapEl?.classList.remove('hidden');
    renderChatThread(threadEl, messages, 'admin');
    if (threadEl) threadEl.scrollTop = threadEl.scrollHeight;
    await markChatRead(activeId, 'admin');
  }

  // Membuka satu percakapan dari daftar.
  async function openConversation(conversationId) {
    activeId = String(conversationId);
    lastThreadSignature = '';
    const current = conversations.find((item) => item.conversationId === activeId);
    if (nameEl) nameEl.textContent = current?.userName || 'Pengguna';
    if (emailEl) emailEl.textContent = current?.userEmail || 'Pengguna BookStore';
    if (avatarEl) avatarEl.textContent = getChatInitials(current?.userName || 'U');
    renderList();
    await renderThread();
  }

  // Memuat ulang daftar percakapan admin.
  async function refresh() {
    conversations = await fetchChatConversations();
    const signature = JSON.stringify(conversations);
    if (signature !== lastListSignature) {
      lastListSignature = signature;
      renderList();
      updateBadge();
    }
    if (!activeId && conversations.length) {
      await openConversation(conversations[0].conversationId);
      return;
    }
    if (activeId) await renderThread();
  }

  // Mengirim balasan admin ke pengguna.
  async function sendAdminReply(text) {
    const value = String(text || '').trim();
    if (!value || !activeId) return;
    if (inputEl) inputEl.value = '';
    await sendChatMessage({
      conversationId: activeId,
      senderId: adminUser.id,
      senderRole: 'admin',
      senderName: adminUser.name || 'Admin',
      senderEmail: adminUser.email,
      text: value,
    });
    lastThreadSignature = '';
    await refresh();
  }

  formEl?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await sendAdminReply(inputEl?.value);
  });

  document.getElementById('inboxQuick')?.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => sendAdminReply(button.dataset.msg || button.textContent));
  });

  searchEl?.addEventListener('input', renderList);

  subscribeChatUpdates(refresh);
  refresh();
}
