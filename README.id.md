<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp" />
  <img src="https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/AI_Powered-OpenRouter-blue?style=for-the-badge" alt="AI Powered" />
</p>

<p align="center">
  <img src="assets/images/banner.png" alt="Yoga Bot Banner" width="100%" />
</p>

<h1 align="center">Personal Bot Core - Yoga Bot</h1>

<h4 align="center">
    <a href="README.md">English</a> | <a href="README.id.md">Indonesia</a>
</h4>

<p align="center">
  <a href="https://ko-fi.com/fuenzer">
    <img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Dukung via Ko-fi" />
  </a>
  <a href="https://saweria.co/fuenzer">
    <img src="https://img.shields.io/badge/Saweria-Dukung%20Yoga%20Bot-FF6B00?style=for-the-badge&logo=buymeacoffee&logoColor=white" alt="Dukung via Saweria" />
  </a>
</p>

Yoga Bot adalah asisten virtual mandiri yang berjalan secara paralel di WhatsApp dan Telegram. Dirancang untuk meningkatkan produktivitas harian dengan memadukan pengelolaan keuangan, kecerdasan buatan, pemrosesan file media, hingga pemantauan server pribadi.

## Features

### 🔄 Multi-Platform Integration
Berjalan ganda secara independen namun terintegrasi penuh:
- **WhatsApp Bot** (powered by Baileys)
- **Telegram Bot** (powered by Telegraf)

### 🤖 AI Assistant
Asisten cerdas tingkat lanjut yang ditenagai oleh model bahasa besar (LLM) melalui integrasi OpenRouter API. Siap menjawab pertanyaan teknis, diskusi, dan coding.
- Dukungan multi-model dengan command pergantian model per pengguna.
- Metadata penggunaan model di balasan (token usage dan label RPM).
- Mendukung jawaban multi-bahasa dengan menyesuaikan bahasa input pengguna.
- Sebagian besar command bot masih dioptimalkan dengan label dan contoh berbahasa Indonesia.

### 📚 Research Tools
Fitur riset referensi berbasis beberapa API publik (tanpa API key):
- Rekomendasi buku dari Open Library, pencarian jurnal dari Crossref, dan pencarian artikel ilmiah dari OpenAlex.
- Pencarian jurnal juga bisa digunakan untuk mencari referensi artikel berdasarkan topik.
- Menampilkan judul, penulis, tahun, dan link sumber (DOI/PDF open access jika tersedia).
- Fallback pesan lebih jelas saat timeout/down/network error sesuai provider.

### ⬇️ Downloader Tools
Kumpulan command downloader media dan audio:
- `/download` mendukung: Instagram, Twitter/X, YouTube, dan TikTok.
- `/audio` mendukung: YouTube dan YouTube Music.
- Utilitas pemendek URL via `/short` (is.gd).

### 💰 Finance Management
Pencatatan keuangan interaktif langsung dari dalam chat:
- Cek saldo terkini
- Pencatatan pemasukan dan pengeluaran dinamis
- Laporan visual dalam bentuk grafik (chart)
- Riwayat transaksi berhalaman dengan tombol kendali
- Kemampuan hapus (dengan konfirmasi) dan edit transaksi

### 🗂️ Media and File Converter
Layanan konversi file dan media tangguh dengan dukungan batch:
- Konversi gambar, kompres, rotasi, resize, hapus background, hingga tangkapan layar web (screenshot).
- Operasi dokumen PDF: Word/Docx ke PDF, compress PDF, rotasi, ekstrak halaman, hingga menggabungkan (merge) berbagai file PDF menjadi satu dokumen.
- Generator stiker (`/tosticker`) untuk input gambar WhatsApp dan Telegram.

### 🖥️ System and Server Monitoring
Infrastruktur backend yang andal dengan dukungan monitoring:
- Pemantauan metrik perangkat keras (CPU, RAM, dan Uptime).
- Pemantauan uptime website reguler.
- Command Usage Tracker untuk melaporkan statistik top tier pengguna dan perintah terpopuler.
- Pusat command admin untuk monitor, statistik penggunaan, dan broadcast.
- Cron job monitor akan mengirim notifikasi hanya jika ada website yang down.

### 🛠️ Daily Utilities
Layanan pendamping yang bermanfaat:
- Pemeriksa jadwal sholat per kota
- Pemeriksa kondisi cuaca per kota teraktual
- Modul *About Me* portfolio kreator
- Modul donasi dengan pengiriman QR Ko-fi dan Saweria di chat.

---

## Tabel Referensi Command

| Command | Deskripsi | Library yang digunakan | Contoh penggunaan | Screenshot preview |
|---|---|---|---|---|
| /start | Mulai bot dan tampilkan menu cepat | Baileys, Telegraf | /start | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /info | Tampilkan kategori command dan info bot | Baileys, Telegraf | /info | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /ping | Cek status online bot dan footer sistem | Node.js os module | /ping | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /model_info | Tampilkan model AI dan alias yang tersedia | OpenRouter, aiPreferenceService | /model_info | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /switch | Ganti model AI aktif per pengguna | OpenRouter, aiPreferenceService | /switch elephant | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /finance_info | Panduan Lengkap command keuangan | financeService, Supabase | /finance_info | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /saldo | Tampilkan ringkasan saldo terbaru | financeService, Supabase | /saldo | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /catat | Catat transaksi pengeluaran | financeService, Supabase | /catat 25000 makan siang | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /pemasukan | Catat transaksi pemasukan | financeService, Supabase | /pemasukan 150000 freelance | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /laporan_chart | Buat laporan keuangan berbentuk grafik | financeService, chart renderer | /laporan_chart | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /riwayat | Tampilkan riwayat transaksi berhalaman | financeService, Supabase | /riwayat 2 | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /edit | Ubah transaksi berdasarkan id dan field | financeService, Supabase | /edit 123e4567 nominal 30000 | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /hapus | Hapus transaksi dengan konfirmasi | financeService, Supabase | /hapus 123e4567 | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /research_info | Panduan Lengkap pencarian Referensi, termasuk info bahwa /jurnal juga bisa mencari artikel | researchService, axios | /research_info | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /buku | Cari referensi buku | Open Library API, axios | /buku clean code | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /jurnal | Cari referensi jurnal dan artikel | Crossref API, axios | /jurnal machine learning | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /artikel | Cari referensi artikel ilmiah | OpenAlex API, axios | /artikel deep learning healthcare | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /downloader | Panduan Lengkap download media | downloaderService | /downloader | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /download | Unduh video/foto dari media sosial | downloaderService, axios | /download https://instagram.com/reel/xxxx | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /audio | Unduh audio dari sumber YouTube | downloaderService, axios | /audio https://youtube.com/watch?v=xxxx | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /short | Pendekkan URL via is.gd | shortenerService, is.gd API | /short https://example.com | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /cuaca | Tampilkan info cuaca per kota | weatherService, weather API | /cuaca bandung | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /sholat | Tampilkan jadwal sholat per kota | religionService, prayer time API | /sholat bandung | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /me | Tampilkan profil pembuat dan link penting | aboutService | /me | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /img_info | Panduan Lengkap image tools | converterService | /img_info | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /img | Konversi, resize, rotate, kompres gambar | converterService, image processor | /img to png | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /hapusbg | Hapus background gambar | converterService, remove.bg API | /hapusbg | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /ss | Screenshot website dari URL | converterService, html-to-image engine | /ss https://example.com | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /pdf_info | Panduan Lengkap PDF tools | converterService | /pdf_info | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /topdf | Konversi dokumen/media ke PDF | converterService, CloudConvert | /topdf | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /pdf | Kompres, konversi, rotate, extract, merge PDF | converterService, CloudConvert, PDF tools | /pdf compress | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /sticker_info | Panduan Lengkap sticker tools | stickerService | /sticker_info | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /tosticker | Ubah gambar/video menjadi stiker | stickerService, ffmpeg | /tosticker | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /donate | Tampilkan link dukungan dan QR donasi | donateService | /donate | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /admin | Buka pusat command admin | auth util, modul admin | /admin | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /monitor | Jalankan cek status website manual | monitorService | /monitor | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /stats | Tampilkan statistik penggunaan platform | modul admin, stats service | /stats | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /cmd_usage | Tampilkan statistik command terpopuler | modul admin, log service | /cmd_usage | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /ai_usage | Tampilkan statistik penggunaan AI per model | modul admin, log service | /ai_usage | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |
| /broadcast | Kirim broadcast admin ke pengguna | modul admin, WhatsApp/Telegram clients | /broadcast maintenance malam ini | WA: [Preview](assets/images/screenshot-wa.png) \| TG: [Preview](assets/images/screenshot-tele.png) |

---

## Preview

| Platform | Screenshot |
|---|---|
| WhatsApp Bot | <img src="assets/images/screenshot-wa.png" alt="WhatsApp Bot Screenshot" width="260" /> |
| Telegram Bot | <img src="assets/images/screenshot-tele.png" alt="Telegram Bot Screenshot" width="260" /> |

---

## Installation

1. Clone repositori
```bash
git clone <repository-url>
cd yoga-bot
```

2. Instal dependensi
```bash
npm install
```

3. Konfigurasi kredensial
Salin file `.env.example` menjadi `.env` lalu sesuaikan dengan kunci API dan token Anda (Supabase, Telegram, OpenRouter, CloudConvert, RemoveBg).

4. Jalankan aplikasi
```bash
npm start
```

## Configuration

Beberapa variabel di `.env` yang digunakan untuk modul monitoring dan hak akses di antaranya:

- `ADMIN_WA_NUMBERS=6281234567890,6280987654321`
- `ADMIN_TELE_IDS=123456789,987654321`
- `MONITOR_URLS=https://example.com,https://example.com/health`

*Catatan: Cron job laporan kesehatan server berjalan setiap pagi (06:00, zona waktu server) dan hanya mengirim pesan saat ada website monitor yang down. Jika semua website normal, pesan tidak akan dikirim.*