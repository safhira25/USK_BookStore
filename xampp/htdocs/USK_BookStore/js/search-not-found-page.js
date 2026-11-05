const user = requireAuth(['user']);
if (!user) throw new Error('Unauthorized');

const params = new URLSearchParams(window.location.search);
const query = params.get('q') || '';

applyAvatar(document.getElementById('sidebarAvatar'), user);
document.getElementById('sidebarAvatar').addEventListener('click', () => {
  window.location.href = 'account.html';
});

if (query) {
  document.getElementById('searchQueryText').textContent = `Tidak ada hasil untuk "${query}". Coba judul, penulis, atau kategori lain.`;
}

document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = 'user.html';
});
