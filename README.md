<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp" />
  <img src="https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/AI_Powered-OpenRouter-blue?style=for-the-badge" alt="AI Powered" />
</p>

<p align="center">
  <img src="assets/images/banner.png" alt="Fuenzer Bot Banner" width="100%" />
</p>

<h1 align="center">Personal Bot Core - Fuenzer Bot</h1>

<h4 align="center">
    <a href="README.md">English</a> | <a href="README.id.md">Indonesia</a>
</h4>

<p align="center">
  <a href="https://ko-fi.com/fuenzer">
    <img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support via Ko-fi" />
  </a>
  <a href="https://saweria.co/fuenzer">
    <img src="https://img.shields.io/badge/Saweria-Dukung%20Fuenzer%20Bot-FF6B00?style=for-the-badge&logo=buymeacoffee&logoColor=white" alt="Support via Saweria" />
  </a>
</p>

Fuenzer Bot is a standalone virtual assistant that runs in parallel on WhatsApp and Telegram. Designed to increase daily productivity by combining financial management, artificial intelligence, media file processing, and personal server monitoring.

## Index

- [Features](#features)
- [Command Reference Table](#command-reference-table)
- [Preview](#preview)
- [Installation](#installation)
- [Configuration](#configuration)
- [VM Deployment Tutorial (From Scratch to PM2 Start)](#vm-deployment-tutorial-from-scratch-to-pm2-start)
- [CI/CD and Auto Release Tutorial (Step by Step)](#cicd-and-auto-release-tutorial-step-by-step)
- [A. Required file structure](#a-required-file-structure)
- [B. Example changelog-config.json](#b-example-changelog-configjson)
- [C. Example auto-release.yml](#c-example-auto-releaseyml)
- [D. Commit message format rules for changelog](#d-commit-message-format-rules-for-changelog)
- [E. How to trigger auto release](#e-how-to-trigger-auto-release)
- [F. Common errors and fixes](#f-common-errors-and-fixes)
- [G. Quick checklist after cloning this repo](#g-quick-checklist-after-cloning-this-repo)
- [H. CI/CD Smoke Test (Copy-Paste for first release)](#h-cicd-smoke-test-copy-paste-for-first-release)
- [I. Rollback when release tag is wrong](#i-rollback-when-release-tag-is-wrong)

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

| Command | Description | Library Used | Example Usage |
|---|---|---|---|
| /start | Start bot and show quick menu | Baileys, Telegraf | /start |
| /info | Show command categories and bot info | Baileys, Telegraf | /info |
| /ping | Check bot online status and system footer | Node.js os module | /ping |
| /model_info | Show available AI models and aliases | OpenRouter, aiPreferenceService | /model_info |
| /switch | Switch active AI model per user | OpenRouter, aiPreferenceService | /switch elephant |
| /finance_info | Full finance command guide | financeService, Supabase | /finance_info |
| /saldo | Show latest balance summary | financeService, Supabase | /saldo |
| /catat | Record expense transaction | financeService, Supabase | /catat 25000 lunch |
| /pemasukan | Record income transaction | financeService, Supabase | /pemasukan 150000 freelance |
| /laporan_chart | Generate finance chart report | financeService, chart renderer | /laporan_chart |
| /riwayat | Show paginated transaction history | financeService, Supabase | /riwayat 2 |
| /edit | Edit transaction by id and field | financeService, Supabase | /edit 123e4567 nominal 30000 |
| /hapus | Delete transaction with confirmation | financeService, Supabase | /hapus 123e4567 |
| /research_info | Full reference search guide, including note that /jurnal can also search article references | researchService, axios | /research_info |
| /buku | Search book references | Open Library API, axios | /buku clean code |
| /jurnal | Search journal and article references | Crossref API, axios | /jurnal machine learning |
| /artikel | Search scientific article references | OpenAlex API, axios | /artikel deep learning healthcare |
| /downloader | Full media downloader guide | downloaderService | /downloader |
| /cuaca | Show weather information by city | weatherService, external weather API | /cuaca bandung |
| /sholat | Show prayer times by city | religionService, prayer time API | /sholat bandung |
| /me | Show creator profile and links | aboutService | /me |
| /img_info | Full image tools guide | converterService | /img_info |
| /img | Image convert, resize, rotate, compress | converterService, image processor | /img to png |
| /hapusbg | Remove image background | converterService, remove.bg API | /hapusbg |
| /ss | Capture website screenshot | converterService, html-to-image engine | /ss https://example.com |
| /pdf_info | Full PDF tools guide | converterService | /pdf_info |
| /topdf | Convert document/media to PDF | converterService, CloudConvert | /topdf |
| /pdf | Compress, convert, rotate, extract, merge PDF | converterService, CloudConvert, PDF tools | /pdf compress |
| /sticker_info | Full sticker tools guide | stickerService | /sticker_info |
| /donate | Show support links and donation QR | donateService | /donate |
| /admin | Open admin command center | auth util, admin command module | /admin |
| /monitor | Run website status check manually | monitorService | /monitor |
| /stats | Show platform usage statistics | admin module, stats service | /stats |
| /cmd_usage | Show top command usage stats | admin module, log service | /cmd_usage |
| /ai_usage | Show AI usage stats by model | admin module, log service | /ai_usage |
| /broadcast | Send admin broadcast to users | admin module, WhatsApp/Telegram clients | /broadcast maintenance tonight |

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
git clone https://github.com/Yogs4R/fuenzer-bot.git
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

---

## VM Deployment Tutorial (From Scratch to PM2 Start)

This guide uses Ubuntu 22.04 LTS as an example. Adjust commands if you use a different distro.

1. SSH into your VM
```bash
ssh username@vm-ip
```

2. Update OS packages
```bash
sudo apt update && sudo apt upgrade -y
```

3. Install base dependencies
```bash
sudo apt install -y git curl build-essential ffmpeg
```

4. Install Node.js LTS (example: Node 20)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

5. Clone repository
```bash
git clone https://github.com/Yogs4R/fuenzer-bot.git
cd fuenzer-bot
```

6. Install project dependencies
```bash
npm install
```

7. Prepare environment file
```bash
cp .env.example .env
nano .env
```

8. Fill required variables in `.env`
- Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`
- OpenRouter: `OPENROUTER_API_KEY`
- Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- CloudConvert: `CLOUDCONVERT_API_KEY`
- RemoveBG: `REMOVEBG_API_KEY`
- Weather: `OPENWEATHER_API_KEY`
- Admin and monitoring: `ADMIN_WA_NUMBERS`, `ADMIN_TELE_IDS`, `MONITOR_URLS`

9. Run a quick local test
```bash
npm start
```
If the process runs normally, stop it with `Ctrl + C`.

10. Install PM2 globally
```bash
sudo npm install -g pm2
pm2 -v
```

11. Start bot with PM2
```bash
pm2 start src/index.js --name fuenzer-bot
pm2 status
pm2 logs fuenzer-bot
```

12. Persist PM2 process for reboot
```bash
pm2 save
pm2 startup
```
Run the extra command shown by PM2 (usually needs `sudo`).

13. Daily PM2 operations
```bash
pm2 restart fuenzer-bot
pm2 stop fuenzer-bot
pm2 delete fuenzer-bot
pm2 logs fuenzer-bot --lines 200
```

---

## CI/CD and Auto Release Tutorial (Step by Step)

This section is important for people who clone this repository and wonder why GitHub Actions fails.

### A. Required file structure

1. Release workflow at `.github/workflows/auto-release.yml`
2. Changelog config at `.github/changelog-config.json`

### B. Example `changelog-config.json`

Make sure `target` values in `label_extractors` exactly match labels in `categories`.

```json
{
  "categories": [
    {
      "title": "What's New",
      "labels": ["feature"]
    },
    {
      "title": "Bug Fixes",
      "labels": ["bug"]
    },
    {
      "title": "Maintenance & Refactor",
      "labels": ["maintenance"]
    },
    {
      "title": "Documentation",
      "labels": ["documentation"]
    }
  ],
  "label_extractors": [
    {
      "pattern": "(?i)^feat(?:\\([^)]*\\))?!?:\\s.*",
      "target": "feature"
    },
    {
      "pattern": "(?i)^fix(?:\\([^)]*\\))?!?:\\s.*",
      "target": "bug"
    },
    {
      "pattern": "(?i)^(?:refactor|chore)(?:\\([^)]*\\))?!?:\\s.*",
      "target": "maintenance"
    },
    {
      "pattern": "(?i)^(?:docs(?:\\([^)]*\\))?!?:\\s.*|merge\\b.*|add files via upload.*)",
      "target": "documentation"
    }
  ],
  "ignore_labels": [
    "documentation"
  ],
  "template": "#{{CHANGELOG}}\\n\\n---\\n*Note: This changelog was automatically generated from commit messages.*"
}
```

### C. Example `auto-release.yml`

```yaml
name: Auto Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-release:
    name: Create GitHub Release
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Build Changelog
        id: build_changelog
        uses: mikepenz/release-changelog-builder-action@v5
        with:
          configuration: ".github/changelog-config.json"
          mode: "COMMIT"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          body: ${{ steps.build_changelog.outputs.changelog }}
          draft: false
          prerelease: false
```

### D. Commit message format rules for changelog

Use commit prefixes like:
- `feat: add new command`
- `fix: resolve argument parsing`
- `chore: update dependency`
- `refactor: clean handler`
- `docs: update README` (ignored if `documentation` is listed in `ignore_labels`)

### E. How to trigger auto release

1. Commit and push to main branch
```bash
git add .
git commit -m "feat: add vm deployment tutorial"
git push origin main
```

2. Create and push a version tag
```bash
git tag v1.0.6
git push origin v1.0.6
```

3. Check GitHub Actions and Releases tabs

### F. Common errors and fixes

1. `Empty CHANGELOG`
- Ensure there are new commits after the previous tag.
- Ensure commit format matches regex (`feat:`, `fix:`, etc).
- Ensure workflow uses `mode: COMMIT`.

2. `No categories found` or commits not grouped
- Ensure each `target` in `label_extractors` exactly matches a label in `categories`.

3. `Workflow not triggered`
- Ensure workflow trigger is `push` on `tags: v*`.
- Ensure you pushed a tag, not only a commit.

4. `Permission denied` when creating release
- Ensure workflow includes:
  - `permissions: contents: write`

5. Config file not found error
- Ensure path is correct: `.github/changelog-config.json`

### G. Quick checklist after cloning this repo

1. Ensure `.github/workflows` and `.github/changelog-config.json` are present after clone.
2. Ensure commit messages follow supported patterns.
3. Ensure release is triggered by pushing a `v*` tag.

### H. CI/CD Smoke Test (Copy-Paste for first release)

Run these commands from the repository root. Replace `v1.0.6` if that version already exists.

```bash
# 1) Check active branch and pull latest changes
git branch --show-current
git pull origin main

# 2) Create a guaranteed changelog-visible test commit
git commit --allow-empty -m "feat: smoke test auto release pipeline"
git push origin main

# 3) Create and push first release tag for testing
git tag v1.0.6
git push origin v1.0.6

# 4) Verify that the tag exists on remote
git ls-remote --tags origin
```

If the tag already exists and you want to re-test with a new version:

```bash
# Example: bump to another version
git tag v1.0.7
git push origin v1.0.7
```

Verify in GitHub after running the commands above:

1. Actions tab: `Auto Release` workflow completed successfully.
2. Releases tab: new release appears with the tag title (for example `v1.0.6`).
3. Release notes are not empty and include `feat: smoke test auto release pipeline`.

### I. Rollback when release tag is wrong

If you pushed a wrong tag (for example version typo), delete local and remote tag, then create a new one.

```bash
# Example: wrong tag v1.0.6, replace with v1.0.7
git tag -d v1.0.6
git push origin :refs/tags/v1.0.6

git tag v1.0.7
git push origin v1.0.7
```

Notes:
1. If release `v1.0.6` was already created in the Releases tab, delete that release in GitHub UI too for cleanup.
2. Do not reuse the same tag name for different commits.