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

        const res = await axios.post(gasUrl, payload, {
            headers: {
                'Content-Type': 'text/plain'
            }
        });

        return true;
    } catch (error) {
        if (error.response) {
            console.error('❌ Response GAS:', error.response.data); 
        } else {
            console.error('❌ Error internal Node.js:', error.message); 
        }
        return false;
    }
}

module.exports = {
    sendToSheet
};