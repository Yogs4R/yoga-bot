const axios = require('axios');

async function sendToSheet(type, userId, message) {
    try {
        const gasUrl = process.env.GAS_WEBAPP_URL;
        if (!gasUrl) {
            console.error('GAS_WEBAPP_URL is not defined in environment variables.');
            return false;
        }

        const payload = JSON.stringify({
            type: type,
            userId: userId,
            message: message
        });

        await axios.post(gasUrl, payload, {
            headers: {
                'Content-Type': 'text/plain'
            }
        });

        // 🚨 TAMBAHKAN BARIS INI UNTUK MENANGKAP BASAH BALASAN GAS
        console.log('🔎 Laporan dari GAS:', res.data);

        return true;
    } catch (error) {
        console.error('Error sending data to Google Sheet:', error.message);
        return false;
    }
}

module.exports = {
    sendToSheet
};