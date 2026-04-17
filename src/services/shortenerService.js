const axios = require('axios');

function isValidHttpUrl(url) {
    const value = String(url || '').trim();
    return value.startsWith('http://') || value.startsWith('https://');
}

async function shortenUrl(originalUrl) {
    const url = String(originalUrl || '').trim();

    if (!isValidHttpUrl(url)) {
        throw new Error('URL tidak valid. URL harus diawali http:// atau https://');
    }

    try {
        const response = await axios.get('https://is.gd/create.php', {
            params: {
                format: 'simple',
                url
            },
            responseType: 'text',
            transformResponse: [(data) => data],
            timeout: 15000
        });

        const shortUrl = String(response?.data || '').trim();
        if (!shortUrl) {
            throw new Error('Respons URL pendek kosong dari server.');
        }

        if (/^error:/i.test(shortUrl)) {
            throw new Error(shortUrl.replace(/^error:\s*/i, '').trim() || 'Gagal memendekkan URL.');
        }

        return shortUrl;
    } catch (error) {
        if (error.response && typeof error.response.data === 'string') {
            const responseMessage = error.response.data.trim();
            if (responseMessage) {
                throw new Error(responseMessage.replace(/^error:\s*/i, '') || 'Gagal memendekkan URL.');
            }
        }

        throw new Error(error.message || 'Gagal memendekkan URL.');
    }
}

module.exports = { shortenUrl };