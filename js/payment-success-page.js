// File: js/payment-success-page.js
// Deskripsi: Skrip halaman setelah pembayaran berhasil.
const user = requireAuth(['user']);
if (!user) throw new Error('Unauthorized');

const params = new URLSearchParams(window.location.search);
const orderId = params.get('order');

document.getElementById('successEmail').textContent = user.email;

if (orderId) {
  const orderEl = document.getElementById('successOrder');
  orderEl.textContent = `ID Pesanan: ${orderId}`;
  orderEl.classList.remove('hidden');
}

document.getElementById('goBackBtn').addEventListener('click', () => {
  window.location.href = 'pengguna.html';
});
