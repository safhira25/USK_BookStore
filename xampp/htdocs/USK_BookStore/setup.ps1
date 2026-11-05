# USK BookStore - Setup Script
# Jalankan: powershell -ExecutionPolicy Bypass -File setup.ps1

$Root = Join-Path $PSScriptRoot "."
$Dirs = @("css", "js", "assets")

Write-Host "Membuat struktur folder USK_BookStore..." -ForegroundColor Cyan
foreach ($dir in $Dirs) {
    New-Item -ItemType Directory -Force -Path (Join-Path $Root $dir) | Out-Null
}

# Salin semua file dari folder script (jika sudah ada) atau buat dari template
$Files = @(
    "index.html", "signin.html", "signup.html", "user.html", "admin.html",
    "css\style.css",
    "js\auth.js", "js\data.js", "js\user.js", "js\admin.js"
)

Write-Host "`nStruktur project:" -ForegroundColor Green
Write-Host "USK_BookStore/"
Write-Host "├── index.html"
Write-Host "├── signin.html"
Write-Host "├── signup.html"
Write-Host "├── user.html"
Write-Host "├── admin.html"
Write-Host "├── setup.ps1"
Write-Host "├── css/"
Write-Host "│   └── style.css"
Write-Host "├── js/"
Write-Host "│   ├── auth.js"
Write-Host "│   ├── data.js"
Write-Host "│   ├── user.js"
Write-Host "│   └── admin.js"
Write-Host "└── assets/"

$missing = @()
foreach ($f in $Files) {
    $path = Join-Path $Root $f
    if (-not (Test-Path $path)) { $missing += $f }
}

if ($missing.Count -eq 0) {
    Write-Host "`nSemua file sudah ada!" -ForegroundColor Green
} else {
    Write-Host "`nFile belum ada: $($missing -join ', ')" -ForegroundColor Yellow
    Write-Host "Jalankan script ini dari folder project yang lengkap, atau clone/copy file HTML/CSS/JS."
}

Write-Host "`nCara buka aplikasi:" -ForegroundColor Cyan
Write-Host "  start index.html"
Write-Host "`nAkun demo:" -ForegroundColor Cyan
Write-Host "  Admin: admin@usk.com / admin123"
Write-Host "  User:  user@usk.com / user123"
