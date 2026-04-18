const axios = require('axios');

const COBALT_API_URL = 'https://api.cobalt.tools/api/json';
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

async function getDownloadUrl(url) {
  const res = await axios.post(
    COBALT_API_URL,
    { url },
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    }
  );

  if (res?.data?.status === 'picker') {
    const picker = Array.isArray(res?.data?.picker) ? res.data.picker : [];
    return picker
      .map((item) => item?.url)
      .filter((itemUrl) => typeof itemUrl === 'string' && itemUrl.trim().length > 0);
  }

  const singleUrl = res?.data?.url;
  return typeof singleUrl === 'string' && singleUrl.trim().length > 0 ? [singleUrl] : [];
}

async function getMediaBuffer(url) {
  const headRes = await axios.head(url);
  const contentLength = Number(headRes?.headers?.['content-length'] || 0);

  if (Number.isFinite(contentLength) && contentLength > MAX_FILE_SIZE_BYTES) {
    throw new Error('FILE_TOO_LARGE');
  }

  const mediaRes = await axios.get(url, { responseType: 'arraybuffer' });
  const type = String(mediaRes?.headers?.['content-type'] || '').toLowerCase();
  const buffer = Buffer.from(mediaRes.data);

  return {
    buffer,
    type: type.includes('video') ? 'video' : 'image'
  };
}

module.exports = {
  getDownloadUrl,
  getMediaBuffer
};
