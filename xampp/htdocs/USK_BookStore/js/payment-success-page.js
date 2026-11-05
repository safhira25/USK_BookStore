const user = requireAuth(['user']);
if (!user) throw new Error('Unauthorized');

const params = new URLSearchParams(window.location.search);
const orderId = params.get('order');
const payFromUrl = params.get('pay') || '';
let paymentProofData = '';

const titleEl = document.getElementById('successTitle');
const messageEl = document.getElementById('successMessage');
const emailEl = document.getElementById('successEmail');
const orderEl = document.getElementById('successOrder');
const dateEl = document.getElementById('successDate');
const proofBox = document.getElementById('successProofBox');
const stepsBox = document.getElementById('successSteps');
const iconEl = document.querySelector('.success-icon');

function pad2(n) {
  return String(n).padStart(2, '0');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatIdDateTime(date) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${pad2(date.getHours())}:${pad2(date.getMinutes())} WIB`;
}

emailEl.textContent = user.email;

let order = null;
if (orderId && typeof getOrderById === 'function') {
  try {
    order = getOrderById(orderId);
  } catch (error) {
    order = (getOrders?.() || []).find((item) => item.id === orderId) || null;
  }
}

const method = order?.paymentMethod || payFromUrl || '';
const bankChoices = {
  mandiri: 'Mandiri 1370012345678',
  bri: 'BRI 0045678901234',
  ovo: 'OVO 0896-8990-3045',
  bca: 'BCA 1234567890',
};
const isBankTransfer = ['bank', 'mandiri', 'bri', 'ovo', 'bca'].includes(method)
  || ['bank', 'mandiri', 'bri', 'ovo', 'bca'].includes(payFromUrl);

if (orderId) {
  orderEl.textContent = `ID Pesanan: ${orderId}`;
  orderEl.classList.remove('hidden');
}

const orderDate = order?.date ? new Date(`${order.date}T12:00:00`) : new Date();
const estimateDate = new Date(orderDate.getTime());
estimateDate.setDate(estimateDate.getDate() + 3);

function formatEstimateDate(date) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function methodLabel() {
  if (bankChoices[method]) return bankChoices[method];
  if (method === 'cash' || payFromUrl === 'cash') return 'Tunai';
  if (method === 'bank' || payFromUrl === 'bank' || isBankTransfer) return 'Transfer Bank';
  return method || 'Transfer Bank';
}

function fillOrderMeta(statusText) {
  const meta = document.getElementById('successMeta');
  if (!meta) return;
  const rows = [
    ['Tanggal', formatIdDateTime(new Date())],
    ['Estimasi tiba', formatEstimateDate(estimateDate)],
    ['Metode', methodLabel()],
    ['Status pesanan', statusText],
  ];
  if (typeof order?.total === 'number') rows.push(['Total', formatPrice(order.total)]);
  meta.innerHTML = rows
    .map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join('');
  meta.classList.remove('hidden');
  dateEl?.classList.add('hidden');
}

function showBankWaitingState() {
  document.title = 'Selesaikan Transfer - BookStore';
  titleEl.textContent = 'Selesaikan Transfer';
  const chosenBank = bankChoices[method] || 'rekening BookStore';
  const accountName = user.name || 'akun Anda';
  messageEl.innerHTML =
    `Pesanan sudah dibuat.<br>Transfer ke ${chosenBank} a/n ${escapeHtml(accountName)}, lalu unggah bukti TF di bawah.`;
  const firstStep = stepsBox?.querySelector('li');
  if (firstStep) firstStep.textContent = `Transfer ke ${chosenBank} a/n ${accountName}`;
  stepsBox?.classList.remove('hidden');
  proofBox.classList.remove('hidden');
  iconEl?.classList.add('is-waiting');
  fillOrderMeta('Menunggu Pembayaran');
}

function showBankDoneState() {
  document.title = 'Bukti TF Terkirim - BookStore';
  titleEl.textContent = 'Bukti TF Terkirim';
  messageEl.innerHTML =
    'Bukti transfer sudah dikirim dan sedang menunggu verifikasi admin.';
  stepsBox?.classList.add('hidden');
  proofBox.classList.remove('hidden');
  document.getElementById('proofHint').textContent = 'Bukti TF sudah terkirim ke admin.';
  document.getElementById('uploadProofBtn')?.classList.add('hidden');
  document.querySelector('.proof-upload')?.classList.add('hidden');
  const proofInput = document.getElementById('proofInput');
  if (proofInput) proofInput.disabled = true;
  const preview = order?.paymentProof || paymentProofData;
  if (preview) {
    document.getElementById('proofPreview').src = preview;
    document.getElementById('proofPreviewWrap').classList.remove('hidden');
  }
  iconEl?.classList.remove('is-waiting');
  fillOrderMeta('Menunggu Verifikasi');
}

function showNormalSuccessState() {
  document.title = 'Pembayaran Berhasil - BookStore';
  titleEl.textContent = 'berhasil !';
  messageEl.innerHTML =
    'Pembayaran Anda berhasil.<br>Bukti pembayaran telah dikirim ke email Anda.';
  proofBox.classList.add('hidden');
  stepsBox?.classList.add('hidden');
}

if (isBankTransfer) {
  const backBtn = document.getElementById('goBackBtn');
  if (backBtn) backBtn.textContent = 'Lihat Pesanan Saya';
  if (order?.paymentProof) {
    paymentProofData = order.paymentProof;
    showBankDoneState();
  } else {
    showBankWaitingState();
  }
} else {
  showNormalSuccessState();
}

document.getElementById('proofInput')?.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  const hint = document.getElementById('proofHint');
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('Silakan unggah file gambar bukti TF.');
    event.target.value = '';
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    alert('Ukuran bukti bayar maksimal 2MB.');
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    paymentProofData = String(reader.result || '');
    document.getElementById('proofPreview').src = paymentProofData;
    document.getElementById('proofPreviewWrap').classList.remove('hidden');
    if (hint) hint.textContent = `File terpilih: ${file.name}`;
  };
  reader.readAsDataURL(file);
});

document.getElementById('uploadProofBtn')?.addEventListener('click', () => {
  if (!orderId) {
    alert('ID pesanan tidak ditemukan.');
    return;
  }
  if (!paymentProofData) {
    alert('Pilih foto bukti TF terlebih dahulu.');
    document.getElementById('proofInput')?.focus();
    return;
  }
  const result =
    typeof saveOrderPaymentProof === 'function'
      ? saveOrderPaymentProof(orderId, paymentProofData)
      : { success: false, message: 'Fungsi simpan bukti tidak tersedia.' };
  if (!result.success) {
    alert(result.message || 'Gagal menyimpan bukti TF.');
    return;
  }
  if (order) order.paymentProof = paymentProofData;
  else order = { id: orderId, paymentProof: paymentProofData, paymentMethod: 'bank' };
  showBankDoneState();
  alert('Bukti TF berhasil dikirim. Admin cek di menu Pesanan → Lihat.');
});

document.getElementById('goBackBtn').addEventListener('click', () => {
  window.location.href = isBankTransfer ? 'account.html?tab=orders' : 'user.html';
});
