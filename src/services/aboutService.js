// About me service
function getAboutMe(platform) {
    if (platform === 'telegram') {
        const header = '<b>TENTANG KREATOR</b> 👨‍💻';
        const body = `Bot ini diciptakan oleh <b>Ridwan Yoga Suryantara</b>.\n\n<b>PROFIL SINGKAT</b>\n• 👨‍🎓 Mahasiswa Sistem Informasi\n• 🏢 Developer di Fuenzer Studio\n• 💻 Full‑Stack Developer & AI Enthusiast\n\n<b>TAUTAN</b>\n• 📌 Portfolio: https://ridwanyoga.vercel.app\n• 🐙 GitHub: https://github.com/ridwanyoga\n• 💼 LinkedIn: https://linkedin.com/in/ridwanyoga\n\n<b>TENTANG BOT</b>\nBot ini dikembangkan dengan Node.js, Telegraf, Baileys, Gemini AI, OpenWeather, myQuran, dan Supabase.\n\nUntuk pertanyaan atau kolaborasi, jangan ragu menghubungi.`;
        return `${header}\n\n${body}`;
    } else {
        // WhatsApp format
        const header = '> *TENTANG KREATOR* 👨‍💻';
        const body = `Bot ini diciptakan oleh *Ridwan Yoga Suryantara*.\n\n*PROFIL SINGKAT*\n• 👨‍🎓 Mahasiswa Sistem Informasi\n• 🏢 Developer di Fuenzer Studio\n• 💻 Full‑Stack Developer & AI Enthusiast\n\n*TAUTAN*\n• 📌 Portfolio: https://ridwanyoga.vercel.app\n• 🐙 GitHub: https://github.com/ridwanyoga\n• 💼 LinkedIn: https://linkedin.com/in/ridwanyoga\n\n*TENTANG BOT*\nBot ini dikembangkan dengan Node.js, Telegraf, Baileys, Gemini AI, OpenWeather, myQuran, dan Supabase.\n\nUntuk pertanyaan atau kolaborasi, jangan ragu menghubungi.`;
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
