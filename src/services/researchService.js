const axios = require('axios');

async function searchBooks(query) {
  const keyword = String(query || '').trim();
  if (!keyword) {
    return [];
  }

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
}

module.exports = {
  searchBooks
};
