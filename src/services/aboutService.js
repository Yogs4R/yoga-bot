// About me service
const { getMonitorWebsiteLinks } = require('./monitorService');

function buildTelegramMonitorSection() {
    const monitorLinks = getMonitorWebsiteLinks().filter((item) => item.url);

    if (monitorLinks.length === 0) {
        return [
            '<b>FITUR MONITOR</b> 📡',
            '• MONITOR_URLS belum diatur.',
            '• Isi environment dengan daftar URL dipisahkan koma.'
        ].join('\n');
    }

    const bodyLines = monitorLinks.map((item) => `• ${item.label} : ${item.url}`);
    const footer = ['—'.repeat(19), `Total: ${monitorLinks.length}`].join('\n');
    return ['<b>FITUR MONITOR</b> 📡', ...bodyLines, '', footer].join('\n');
}

function getAboutMe(platform) {
    if (platform === 'telegram') {
        const header = '<b>TENTANG KREATOR</b> 👨‍💻';
        const monitorSection = buildTelegramMonitorSection();
        const body = `Bot ini diciptakan oleh <b>Ridwan Yoga Suryantara</b>.\n\n<b>TAUTAN KREATOR</b>\n• Portfolio: https://ridwansuryantara.netlify.app\n• GitHub: https://github.com/yogs4r\n• LinkedIn: https://linkedin.com/in/ridwansuryantara\n\n${monitorSection}\n\n<b>TENTANG BOT</b>\nBot ini dikembangkan dengan Node.js, Telegraf, Baileys, OpenRouter AI (OpenAI SDK), OpenWeather, myQuran, dan Supabase.\n\nUntuk pertanyaan atau kolaborasi, jangan ragu menghubungi.`;
        return `${header}\n\n${body}`;
    } else {
        // WhatsApp format
        const header = '> *TENTANG KREATOR* 👨‍💻';
        const body = `Bot ini diciptakan oleh *Ridwan Yoga Suryantara*.\n\n*TAUTAN*\n• 📌 Portfolio: https://ridwansuryantara.netlify.app\n• 🐙 GitHub: https://github.com/yogs4r\n• 💼 LinkedIn: https://linkedin.com/in/ridwansuryantara\n\n*TENTANG BOT*\nBot ini dikembangkan dengan Node.js, Telegraf, Baileys, OpenRouter AI (OpenAI SDK), OpenWeather, myQuran, dan Supabase.\n\nUntuk pertanyaan atau kolaborasi, jangan ragu menghubungi.`;
        return `${header}\n\n${body}`;
    }
}

async function handleAboutMeCommand(command, args, userId, platform) {
    if (command !== '/me') {
        return 'Perintah tidak dikenali.';
    }
    return getAboutMe(platform);
}

module.exports = {
    getAboutMe,
    handleAboutMeCommand
};
