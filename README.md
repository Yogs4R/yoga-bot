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
    <img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support via Ko-fi" />
  </a>
  <a href="https://saweria.co/fuenzer">
    <img src="https://img.shields.io/badge/Saweria-Dukung%20Yoga%20Bot-FF6B00?style=for-the-badge&logo=buymeacoffee&logoColor=white" alt="Support via Saweria" />
  </a>
</p>

Yoga Bot is a standalone virtual assistant that runs in parallel on WhatsApp and Telegram. Designed to increase daily productivity by combining financial management, artificial intelligence, media file processing, and personal server monitoring.

## Features

### 🔄 Multi-Platform Integration
Runs simultaneously, independently but fully integrated:
- **WhatsApp Bot** (powered by Baileys)
- **Telegram Bot** (powered by Telegraf)

### 🤖 AI Assistant
Advanced smart assistant powered by large language models (LLM) via OpenRouter API integration. Ready to answer technical questions, discussions, and coding.
- Multi-model support with user-level model switching command.
- Built-in model usage metadata in replies (token usage and RPM label).

### 📚 Research Tools
Research references powered by multiple public APIs (no API key required):
- `/buku` via Open Library API for top 5 book recommendations.
- `/jurnal` via Crossref API for top 5 journal references with DOI links.
- `/artikel` via Semantic Scholar API for top 5 scientific article references.
- Returns title, authors, year, and source link (DOI/Open Access PDF when available).
- Better fallback messages for timeout/down/network errors per provider.

### ⬇️ Downloader Tools
Unified downloader commands for social media and music:
- `/download` supports: Instagram, Twitter/X, YouTube, and TikTok.
- `/audio` supports: YouTube and YouTube Music.
- URL shortener utility via `/short` using is.gd.

### 💰 Finance Management
Interactive financial logging directly from chat:
- Check current balance
- Dynamic income and expense logging
- Visual reports in chart format
- Paginated transaction history with control buttons
- Ability to delete (with confirmation) and edit transactions

### 🗂️ Media and File Converter
Powerful file and media conversion services with batch support:
- Image conversion, compress, rotate, resize, remove background, to web screenshots.
- PDF document operations: Word/Docx to PDF, compress PDF, rotate, extract pages, to merge various PDF files into a single document.
- Sticker generator (`/tosticker`) for WhatsApp and Telegram image input.

### 🖥️ System and Server Monitoring
Reliable backend infrastructure with monitoring support:
- Hardware metrics monitoring (CPU, RAM, and Uptime).
- Regular website uptime monitoring.
- Command Usage Tracker to report top-tier user statistics and most popular commands.
- Admin command center for monitor checks, usage stats, and broadcast tools.

### 🛠️ Daily Utilities
Useful companion services:
- Prayer times checker per city
- Real-time weather condition checker per city
- *About Me* creator portfolio module
- Donation module with Ko-fi and Saweria QR delivery in chat.

---

## Preview

### WhatsApp Bot
![WhatsApp Bot Screenshot](assets/images/screenshot-wa.png)

### Telegram Bot
![Telegram Bot Screenshot](assets/images/screenshot-tele.png)

---

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd yoga-bot
```

2. Install dependencies
```bash
npm install
```

3. Configure credentials
Copy the `.env.example` file to `.env` and adjust it with your API keys and tokens (Supabase, Telegram, OpenRouter, CloudConvert, RemoveBg).

4. Run the application
```bash
npm start
```

## Configuration

Some variables in `.env` used for monitoring modules and access rights include:

- `ADMIN_WA_NUMBERS=6281234567890,6280987654321`
- `ADMIN_TELE_IDS=123456789,987654321`
- `MONITOR_URLS=https://example.com,https://example.com/health`

*Note: The cron job for server health reports will run every morning (06:00) according to the server time zone.*

