const axios = require('axios');

function buildResearchError(apiName, error) {
  const label = String(apiName || 'Research API');

  if (axios.isAxiosError(error)) {
    const status = Number(error.response?.status || 0);
    const errorCode = String(error.code || '').toUpperCase();
    const message = String(error.message || '').toLowerCase();

    if (errorCode === 'ECONNABORTED' || message.includes('timeout')) {
      return new Error(`⚠️ ${label} timeout (batas 15 detik). Coba lagi beberapa saat atau gunakan keyword yang lebih spesifik.`);
    }

    if (status >= 500) {
      return new Error(`⚠️ ${label} sedang gangguan/down (HTTP ${status}). Silakan coba lagi beberapa menit lagi.`);
    }

    if (status === 429) {
      return new Error(`⚠️ ${label} sedang membatasi request (rate limit). Coba lagi beberapa saat.`);
    }

    if (!error.response) {
      return new Error(`⚠️ Tidak bisa terhubung ke ${label} (network error). Periksa koneksi internet server dan coba lagi.`);
    }

    return new Error(`❌ ${label} mengembalikan error (HTTP ${status || 'unknown'}).`);
  }

  return new Error(`❌ Gagal mengambil data dari ${label}. Coba lagi nanti.`);
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
    throw buildResearchError('Open Library', error);
  }
}

async function searchJournals(query) {
  const keyword = String(query || '').trim();
  if (!keyword) {
    return [];
  }

  try {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(keyword)}&rows=5`;
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'YogaBot/1.0 (mailto:dedekculesrbx@gmail.com)'
      }
    });

    const items = Array.isArray(response?.data?.message?.items) ? response.data.message.items : [];

    return items.slice(0, 5).map((item) => {
      const title = Array.isArray(item?.title) && item.title.length > 0
        ? String(item.title[0] || '-').trim() || '-'
        : '-';

      const authors = Array.isArray(item?.author) && item.author.length > 0
        ? item.author.map((author) => {
          const given = String(author?.given || '').trim();
          const family = String(author?.family || '').trim();
          return [given, family].filter(Boolean).join(' ').trim();
        }).filter(Boolean).join(', ')
        : '-';

      const journalName = Array.isArray(item?.['container-title']) && item['container-title'].length > 0
        ? String(item['container-title'][0] || '-').trim() || '-'
        : '-';

      const publishedYear = Number(item?.['published-print']?.['date-parts']?.[0]?.[0]);
      const createdYear = Number(item?.created?.['date-parts']?.[0]?.[0]);
      const year = Number.isFinite(publishedYear)
        ? String(publishedYear)
        : Number.isFinite(createdYear)
          ? String(createdYear)
          : '-';

      const doi = String(item?.DOI || '').trim();
      const doiUrl = doi ? `https://doi.org/${doi}` : '-';

      return {
        title,
        author: authors || '-',
        journal: journalName,
        year,
        doiUrl
      };
    });
  } catch (error) {
    throw buildResearchError('Crossref', error);
  }
}

async function searchArticles(query) {
  const keyword = String(query || '').trim();
  if (!keyword) {
    return [];
  }

  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(keyword)}&per-page=5&mailto=fuenzerapps@gmail.com`;
    const response = await axios.get(url, { timeout: 15000 });
    const items = Array.isArray(response?.data?.results) ? response.data.results : [];

    return items.slice(0, 5).map((item) => {
      const title = String(item?.title || '-').trim() || '-';
      const authors = Array.isArray(item?.authorships)
        ? item.authorships
          .map((authorship) => String(authorship?.author?.display_name || '').trim())
          .filter(Boolean)
          .slice(0, 3)
          .join(', ')
        : '';
      const year = Number(item?.publication_year);
      const isOpenAccess = item?.open_access?.is_oa === true;
      const openAccessUrl = String(item?.open_access?.oa_url || '').trim();
      const doi = String(item?.doi || '').trim();
      const id = String(item?.id || '').trim();
      const link = isOpenAccess && openAccessUrl ? openAccessUrl : (doi || id || '-');

      return {
        title,
        author: authors || '-',
        year: Number.isFinite(year) ? String(year) : '-',
        link
      };
    });
  } catch (error) {
    throw buildResearchError('OpenAlex', error);
  }
}

module.exports = {
  searchBooks,
  searchJournals,
  searchArticles
};
