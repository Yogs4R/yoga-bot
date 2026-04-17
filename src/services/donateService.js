const path = require('path');

const SAWERIA_URL = 'https://saweria.co/fuenzer';
const KOFI_URL = 'https://ko-fi.com/fuenzer';

function buildDonateMessage(platform = 'whatsapp') {
    if (platform === 'telegram') {
        return `<b>☕ DUKUNG YOGA BOT</b>

        Halo! Senang rasanya Yoga Bot bisa membantumu. 🤖✨

        Yoga Bot berjalan 24/7 di server cloud menggunakan model AI canggih yang membutuhkan biaya operasional bulanan. Jika kamu merasa terbantu, kamu bisa mendukung Fuenzer Studio melalui:

        🇮🇩 <b>Untuk Pengguna Indonesia (QRIS, GoPay, OVO, dll):</b>
        🔗 ${SAWERIA_URL}

        🌍 <b>For International Users (PayPal, Credit Card):</b>
        🔗 ${KOFI_URL}

        Dukunganmu menjaga bot ini tetap hidup. Terima kasih! ❤️`;
    }

    return `> ☕ DUKUNG YOGA BOT

        Halo! Senang rasanya Yoga Bot bisa membantumu. 🤖✨

        Yoga Bot berjalan 24/7 di server cloud menggunakan model AI canggih yang membutuhkan biaya operasional bulanan. Jika kamu merasa terbantu, kamu bisa mendukung Fuenzer Studio melalui:

        🇮🇩 *Untuk Pengguna Indonesia (QRIS, GoPay, OVO, dll):*
        🔗 ${SAWERIA_URL}

        🌍 *For International Users (PayPal, Credit Card):*
        🔗 ${KOFI_URL}

        Dukunganmu menjaga bot ini tetap hidup. Terima kasih! ❤️`;
}

function getDonateQrImagePaths() {
    return {
        koFi: path.join(process.cwd(), 'assets', 'images', 'ko-fi.png'),
        saweria: path.join(process.cwd(), 'assets', 'images', 'saweria.png')
    };
}

module.exports = {
    buildDonateMessage,
    getDonateQrImagePaths,
    SAWERIA_URL,
    KOFI_URL
};