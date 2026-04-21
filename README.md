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
- Supports multilingual answers by following the user's input language.
- Most bot commands are still optimized with Indonesian command labels and examples.

### 📚 Research Tools
Research references powered by multiple public APIs (no API key required):
- Book discovery from Open Library, journal lookup from Crossref, and scientific article lookup from OpenAlex.
- Journal lookup can also be used to search article references by topic keywords.
- Returns title, authors, year, and source link (DOI/Open Access PDF when available).
- Better fallback messages for timeout/down/network errors per provider.

### ⬇️ Downloader Tools
Unified downloader commands for social media and music:
- Supports media downloads from Instagram, Twitter/X, YouTube, and TikTok.
- Supports audio downloads from YouTube and YouTube Music.
- Built-in URL shortener utility via is.gd.

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
- Sticker generator for WhatsApp and Telegram image input.

### 🖥️ System and Server Monitoring
Reliable backend infrastructure with monitoring support:
- Hardware metrics monitoring (CPU, RAM, and Uptime).
- Regular website uptime monitoring.
- Command Usage Tracker to report top-tier user statistics and most popular commands.
- Admin command center for monitor checks, usage stats, and broadcast tools.
- Monitor cron job sends notification only when any monitored website is down.

### 🛠️ Daily Utilities
Useful companion services:
- Prayer times checker per city
- Real-time weather condition checker per city
- *About Me* creator portfolio module
- Donation module with Ko-fi and Saweria QR delivery in chat.

---

## Command Reference Table

| Command | Description | Library Used | Example Usage | Screenshot Preview |
|---|---|---|---|---|
| /start | Start bot and show quick menu | Baileys, Telegraf | /start | WA: [Preview](assets/images/screenshot-wa-start.png) \| TG: [Preview](assets/images/screenshot-tele-start.png) |
| /info | Show command categories and bot info | Baileys, Telegraf | /info | WA: [Preview](assets/images/screenshot-wa-info.png) \| TG: [Preview](assets/images/screenshot-tele-info.png) |
| /ping | Check bot online status and system footer | Node.js os module | /ping | WA: [Preview](assets/images/screenshot-wa-ping.png) \| TG: [Preview](assets/images/screenshot-tele-ping.png) |
| /model_info | Show available AI models and aliases | OpenRouter, aiPreferenceService | /model_info | WA: [Preview](assets/images/screenshot-wa-model_info.png) \| TG: [Preview](assets/images/screenshot-tele-model_info.png) |
| /switch | Switch active AI model per user | OpenRouter, aiPreferenceService | /switch elephant | WA: [Preview](assets/images/screenshot-wa-switch.png) \| TG: [Preview](assets/images/screenshot-tele-switch.png) |
| /finance_info | Full finance command guide | financeService, Supabase | /finance_info | WA: [Preview](assets/images/screenshot-wa-finance_info.png) \| TG: [Preview](assets/images/screenshot-tele-finance_info.png) |
| /saldo | Show latest balance summary | financeService, Supabase | /saldo | WA: [Preview](assets/images/screenshot-wa-saldo.png) \| TG: [Preview](assets/images/screenshot-tele-saldo.png) |
| /catat | Record expense transaction | financeService, Supabase | /catat 25000 lunch | WA: [Preview](assets/images/screenshot-wa-catat.png) \| TG: [Preview](assets/images/screenshot-tele-catat.png) |
| /pemasukan | Record income transaction | financeService, Supabase | /pemasukan 150000 freelance | WA: [Preview](assets/images/screenshot-wa-pemasukan.png) \| TG: [Preview](assets/images/screenshot-tele-pemasukan.png) |
| /laporan_chart | Generate finance chart report | financeService, chart renderer | /laporan_chart | WA: [Preview](assets/images/screenshot-wa-laporan_chart.png) \| TG: [Preview](assets/images/screenshot-tele-laporan_chart.png) |
| /riwayat | Show paginated transaction history | financeService, Supabase | /riwayat 2 | WA: [Preview](assets/images/screenshot-wa-riwayat.png) \| TG: [Preview](assets/images/screenshot-tele-riwayat.png) |
| /edit | Edit transaction by id and field | financeService, Supabase | /edit 123e4567 nominal 30000 | WA: [Preview](assets/images/screenshot-wa-edit.png) \| TG: [Preview](assets/images/screenshot-tele-edit.png) |
| /hapus | Delete transaction with confirmation | financeService, Supabase | /hapus 123e4567 | WA: [Preview](assets/images/screenshot-wa-hapus.png) \| TG: [Preview](assets/images/screenshot-tele-hapus.png) |
| /research_info | Full reference search guide, including note that /jurnal can also search article references | researchService, axios | /research_info | WA: [Preview](assets/images/screenshot-wa-research_info.png) \| TG: [Preview](assets/images/screenshot-tele-research_info.png) |
| /buku | Search book references | Open Library API, axios | /buku clean code | WA: [Preview](assets/images/screenshot-wa-buku.png) \| TG: [Preview](assets/images/screenshot-tele-buku.png) |
| /jurnal | Search journal and article references | Crossref API, axios | /jurnal machine learning | WA: [Preview](assets/images/screenshot-wa-jurnal.png) \| TG: [Preview](assets/images/screenshot-tele-jurnal.png) |
| /artikel | Search scientific article references | OpenAlex API, axios | /artikel deep learning healthcare | WA: [Preview](assets/images/screenshot-wa-artikel.png) \| TG: [Preview](assets/images/screenshot-tele-artikel.png) |
| /downloader | Full media downloader guide | downloaderService | /downloader | WA: [Preview](assets/images/screenshot-wa-downloader.png) \| TG: [Preview](assets/images/screenshot-tele-downloader.png) |
| /cuaca | Show weather information by city | weatherService, external weather API | /cuaca bandung | WA: [Preview](assets/images/screenshot-wa-cuaca.png) \| TG: [Preview](assets/images/screenshot-tele-cuaca.png) |
| /sholat | Show prayer times by city | religionService, prayer time API | /sholat bandung | WA: [Preview](assets/images/screenshot-wa-sholat.png) \| TG: [Preview](assets/images/screenshot-tele-sholat.png) |
| /me | Show creator profile and links | aboutService | /me | WA: [Preview](assets/images/screenshot-wa-me.png) \| TG: [Preview](assets/images/screenshot-tele-me.png) |
| /img_info | Full image tools guide | converterService | /img_info | WA: [Preview](assets/images/screenshot-wa-img_info.png) \| TG: [Preview](assets/images/screenshot-tele-img_info.png) |
| /img | Image convert, resize, rotate, compress | converterService, image processor | /img to png | WA: [Preview](assets/images/screenshot-wa-img.png) \| TG: [Preview](assets/images/screenshot-tele-img.png) |
| /hapusbg | Remove image background | converterService, remove.bg API | /hapusbg | WA: [Preview](assets/images/screenshot-wa-hapusbg.png) \| TG: [Preview](assets/images/screenshot-tele-hapusbg.png) |
| /ss | Capture website screenshot | converterService, html-to-image engine | /ss https://example.com | WA: [Preview](assets/images/screenshot-wa-ss.png) \| TG: [Preview](assets/images/screenshot-tele-ss.png) |
| /pdf_info | Full PDF tools guide | converterService | /pdf_info | WA: [Preview](assets/images/screenshot-wa-pdf_info.png) \| TG: [Preview](assets/images/screenshot-tele-pdf_info.png) |
| /topdf | Convert document/media to PDF | converterService, CloudConvert | /topdf | WA: [Preview](assets/images/screenshot-wa-topdf.png) \| TG: [Preview](assets/images/screenshot-tele-topdf.png) |
| /pdf | Compress, convert, rotate, extract, merge PDF | converterService, CloudConvert, PDF tools | /pdf compress | WA: [Preview](assets/images/screenshot-wa-pdf.png) \| TG: [Preview](assets/images/screenshot-tele-pdf.png) |
| /sticker_info | Full sticker tools guide | stickerService | /sticker_info | WA: [Preview](assets/images/screenshot-wa-sticker_info.png) \| TG: [Preview](assets/images/screenshot-tele-sticker_info.png) |
| /donate | Show support links and donation QR | donateService | /donate | WA: [Preview](assets/images/screenshot-wa-donate.png) \| TG: [Preview](assets/images/screenshot-tele-donate.png) |
| /admin | Open admin command center | auth util, admin command module | /admin | WA: [Preview](assets/images/screenshot-wa-admin.png) \| TG: [Preview](assets/images/screenshot-tele-admin.png) |
| /monitor | Run website status check manually | monitorService | /monitor | WA: [Preview](assets/images/screenshot-wa-monitor.png) \| TG: [Preview](assets/images/screenshot-tele-monitor.png) |
| /stats | Show platform usage statistics | admin module, stats service | /stats | WA: [Preview](assets/images/screenshot-wa-stats.png) \| TG: [Preview](assets/images/screenshot-tele-stats.png) |
| /cmd_usage | Show top command usage stats | admin module, log service | /cmd_usage | WA: [Preview](assets/images/screenshot-wa-cmd_usage.png) \| TG: [Preview](assets/images/screenshot-tele-cmd_usage.png) |
| /ai_usage | Show AI usage stats by model | admin module, log service | /ai_usage | WA: [Preview](assets/images/screenshot-wa-ai_usage.png) \| TG: [Preview](assets/images/screenshot-tele-ai_usage.png) |
| /broadcast | Send admin broadcast to users | admin module, WhatsApp/Telegram clients | /broadcast maintenance tonight | WA: [Preview](assets/images/screenshot-wa-broadcast.png) \| TG: [Preview](assets/images/screenshot-tele-broadcast.png) |

---

## Preview

| Platform | Screenshot |
|---|---|
| WhatsApp Bot | <img src="assets/images/screenshot-wa.png" alt="WhatsApp Bot Screenshot" width="260" /> |
| Telegram Bot | <img src="assets/images/screenshot-tele.png" alt="Telegram Bot Screenshot" width="260" /> |

---

## Installation

1. Clone the repository
```bash
git clone https://github.com/Yogs4R/yoga-bot.git
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

*Note: The cron job for server health reports runs every morning (06:00, server time) and sends a message only when one or more monitored websites are down. If all websites are healthy, no alert message is sent.*

