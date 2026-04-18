const axios = require('axios');

function buildResearchError(error) {
  if (axios.isAxiosError(error)) {
    const status = Number(error.response?.status || 0);
    const errorCode = String(error.code || '').toUpperCase();
    const message = String(error.message || '').toLowerCase();

    if (errorCode === 'ECONNABORTED' || message.includes('timeout')) {
      return new Error('⚠️ Open Library timeout (batas 15 detik). Coba lagi beberapa saat atau gunakan keyword yang lebih spesifik.');
    }

    if (status >= 500) {
      return new Error(`⚠️ Open Library sedang gangguan/down (HTTP ${status}). Silakan coba lagi beberapa menit lagi.`);
    }

    if (status === 429) {
      return new Error('⚠️ Open Library sedang membatasi request (rate limit). Coba lagi beberapa saat.');
    }

    if (!error.response) {
      return new Error('⚠️ Tidak bisa terhubung ke Open Library (network error). Periksa koneksi internet server dan coba lagi.');
    }

    return new Error(`❌ Open Library mengembalikan error (HTTP ${status || 'unknown'}).`);
  }

  return new Error('❌ Gagal mengambil data buku dari Open Library. Coba lagi nanti.');
}

async function searchBooks(query) {
  const keyword = String(query || '').trim();
  if (!keyword) {
    return [];
  }

  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(keyword)}&limit=5`;
    const response = await axios.get(url, { timeout: 15000 });
    const docs = Array.isArray(response?.data?.docs) ? response.data.docs : [];

    return docs.slice(0, 5).map((item) => {
      const title = String(item?.title || '-').trim() || '-';
      const authors = Array.isArray(item?.author_name) && item.author_name.length > 0
        ? item.author_name.join(', ')
        : '-';
      const year = Number(item?.first_publish_year);
      const key = String(item?.key || '').trim();

      return {
        title,
        author: authors,
        year: Number.isFinite(year) ? String(year) : '-',
        url: key ? `https://openlibrary.org${key}` : 'https://openlibrary.org'
      };
    });
  } catch (error) {
    throw buildResearchError(error);
  }
}

module.exports = {
  searchBooks
};
