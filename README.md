# USK BookStore

Toko buku online untuk USK. Aplikasi ini berjalan di XAMPP dengan Apache, PHP, dan MySQL.

## Struktur

```
USK_BookStore/
├── api/                  Koneksi database dan API PHP
├── assets/               Logo dan sampul buku
├── css/                  Tampilan
├── js/                   Perilaku halaman
├── database/
│   └── bookstore.sql     Cadangan database yang bisa diimpor
├── xampp/
│   ├── htdocs/USK_BookStore/     Salinan proyek dari folder htdocs XAMPP
│   └── mysql/data/bookstore/     Berkas tabel MySQL database bookstore
├── index.php             Pintu masuk lewat Apache
└── *.html                Halaman toko
```

Folder `xampp/` diambil langsung dari instalasi XAMPP di komputer ini. Isinya proyek yang ada di `htdocs` dan berkas tabel database `bookstore`. Program Apache, PHP, dan MySQL tidak disalin: log Apache berukuran 111 MB, sedangkan GitHub menolak satu berkas di atas 100 MB. Database proyek lain yang ada di XAMPP juga tidak ikut.

## Menjalankan di XAMPP

1. Pasang XAMPP, lalu nyalakan Apache dan MySQL.
2. Salin folder proyek ini ke `C:\xampp\htdocs\USK_BookStore`.
3. Impor database dari Command Prompt:

```
C:\xampp\mysql\bin\mysql.exe -u root < database\bookstore.sql
```

4. Buka `http://localhost/USK_BookStore/`.

Akun admin bawaan: `admin@usk.com` / `admin123`.
