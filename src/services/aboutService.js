// About me service
function getAboutMe() {
    const header = '> *KREATOR* 👨‍💻';
    const body = [
        'Bot ini diciptakan oleh *Ridwan Yoga Suryantara*.',
        '',
        '*Profil Singkat*',
        '• 👨‍🎓 Mahasiswa Sistem Informasi',
        '• 🏢 Developer di Fuenzer Studio',
        '• 💻 Full-Stack Developer & AI Enthusiast',
        '',
        '*Tautan*',
        '• 📌 Portfolio: https://ridwanyoga.vercel.app',
        '• 🐙 GitHub: https://github.com/ridwanyoga',
        '• 💼 LinkedIn: https://linkedin.com/in/ridwanyoga',
        '',
        'Bot ini dikembangkan dengan Node.js, Telegraf, Baileys,',
        'Gemini AI, OpenWeather, myQuran, dan Supabase.',
        '',
        'Untuk pertanyaan atau kolaborasi, jangan ragu menghubungi.'
    ].join('\n');

    return `${header}\n\n${body}`;
}

async function handleAboutMeCommand(command, args, userId, platform) {
    if (command !== '/me') {
        return 'Perintah tidak dikenali.';
    }
    return getAboutMe();
}

module.exports = {
    getAboutMe,
    handleAboutMeCommand
};
