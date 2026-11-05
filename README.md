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
│   └── bookstore.sql     Cadangan database dari XAMPP
├── index.php             Pintu masuk lewat Apache
└── *.html                Halaman toko
```

Folder program XAMPP (Apache, MySQL, dan database proyek lain) tidak ikut di repositori ini. Yang disimpan adalah kode toko buku dan cadangan database `bookstore`.

## Menjalankan di XAMPP

1. Pasang XAMPP, lalu nyalakan Apache dan MySQL.
2. Salin folder proyek ini ke `C:\xampp\htdocs\USK_BookStore`.
3. Impor database dari Command Prompt:

```
C:\xampp\mysql\bin\mysql.exe -u root < database\bookstore.sql
```

4. Buka `http://localhost/USK_BookStore/`.

Akun admin bawaan: `admin@usk.com` / `admin123`.
