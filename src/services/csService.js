const axios = require('axios');

async function sendToSheet(type, userId, message) {
    try {
        const gasUrl = process.env.GAS_WEBAPP_URL;
        if (!gasUrl) {
            console.error('GAS_WEBAPP_URL is not defined in environment variables.');
            return false;
        }

        await axios.post(gasUrl, {
            type: type,
            userId: userId,
            message: message
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return true;
    } catch (error) {
        console.error('Error sending data to Google Sheet:', error.message);
        return false;
    }
}

module.exports = {
    sendToSheet
};
