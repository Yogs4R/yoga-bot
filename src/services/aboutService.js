// About me service
function getAboutMe() {
    const header = '> *KREATOR* 👨‍💻';
    const body = [
        'Bot ini diciptakan oleh *Ridwan Yoga Suryantara*',
        '',
        '👨‍🎓 *Mahasiswa Sistem Informasi*',
        '🏢 *Developer di Fuenzer Studio*',
        '💻 *Full‑Stack Developer & AI Enthusiast*',
        '',
        '📌 *Portfolio:* https://ridwanyoga.vercel.app',
        '🐙 *GitHub:* https://github.com/ridwanyoga',
        '💼 *LinkedIn:* https://linkedin.com/in/ridwanyoga',
        '',
        'Bot ini dikembangkan dengan Node.js, Telegraf, Baileys,',
        'dan berbagai API seperti Gemini AI, OpenWeather,',
        'myQuran, serta Supabase untuk database.',
        '',
        'Untuk pertanyaan atau kolaborasi,',
        'jangan ragu untuk menghubungi!'
    ].join('\n');
    
    const box = '┌─────────────────────────────────────────────┐\n' +
                body.split('\n').map(line => `│ ${line}`).join('\n') + '\n' +
                '└─────────────────────────────────────────────┘';
    
    return `${header}\n\n${box}`;
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
