# Personal Bot Core

Bot WhatsApp & Telegram untuk keperluan pribadi.

## Fitur

- WhatsApp Bot
- Telegram Bot
- Integrasi Google Services
- Layanan AI (OpenRouter via OpenAI SDK)
- Monitoring Server
- Layanan Keuangan
- Layanan Cuaca
- Konverter
- Dan lain-lain

## Struktur Proyek

Lihat tree di README.

## Instalasi

1. Clone repositori
2. Jalankan `npm install`
3. Konfigurasi file .env
4. Jalankan `npm start`

## Konfigurasi

Salin .env.example ke .env dan isi variabel yang diperlukan.

Variabel yang dipakai untuk modul admin dan monitor:

- `ADMIN_WA_NUMBERS=6281234567890,6289876543210`
- `ADMIN_TELE_IDS=123456789,987654321`
- `MONITOR_URLS=https://example.com,https://example.com/health`

Cron monitor server berjalan setiap hari pukul 06:00 mengikuti timezone server aplikasi.

## TODO

- Implementasi WhatsApp Client
- Implementasi Telegram Client
- Implementasi Google Services
- Implementasi OpenRouter AI
- Implementasi Supabase
- Implementasi Services
- Implementasi Handlers
- Implementasi Jobs
- Implementasi Utils

## Catatan

Proyek masih dalam pengembangan.
