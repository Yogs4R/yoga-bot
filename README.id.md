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

### 🖥️ System and Server Monitoring
Infrastruktur backend yang andal dengan dukungan monitoring:
- Pemantauan metrik perangkat keras (CPU, RAM, dan Uptime).
- Pemantauan uptime website reguler.
- Command Usage Tracker untuk melaporkan statistik top tier pengguna dan perintah terpopuler.

### 🛠️ Daily Utilities
Layanan pendamping yang bermanfaat:
- Pemeriksa jadwal sholat per kota
- Pemeriksa kondisi cuaca per kota teraktual
- Modul *About Me* portfolio kreator

---

## Preview

### WhatsApp Bot
![WhatsApp Bot Screenshot](assets/images/screenshot-wa.png)

### Telegram Bot
![Telegram Bot Screenshot](assets/images/screenshot-tele.png)

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

*Catatan: Cron job untuk laporan kesehatan server akan berjalan setiap pagi (06:00) sesuai zona waktu server.*