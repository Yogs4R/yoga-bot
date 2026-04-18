const axios = require('axios');

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

async function getDownloadUrl(url) {
  const normalizedUrl = String(url || '').trim();
  if (!normalizedUrl) {
    throw new Error('URL_REQUIRED');
  }

  let endpoint = '';
  const encodedUrl = encodeURIComponent(normalizedUrl);

  if (normalizedUrl.includes('instagram.com') || normalizedUrl.includes('instagr.am')) {
    endpoint = `https://api.ryzendesu.vip/api/downloader/igdl?url=${encodedUrl}`;
  } else if (normalizedUrl.includes('tiktok.com') || normalizedUrl.includes('vt.tiktok.com')) {
    endpoint = `https://api.ryzendesu.vip/api/downloader/ttdl?url=${encodedUrl}`;
  } else if (normalizedUrl.includes('twitter.com') || normalizedUrl.includes('x.com')) {
    endpoint = `https://api.ryzendesu.vip/api/downloader/twitter?url=${encodedUrl}`;
  } else if (normalizedUrl.includes('facebook.com') || normalizedUrl.includes('fb.watch')) {
    endpoint = `https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodedUrl}`;
  } else if (normalizedUrl.includes('threads.net')) {
    endpoint = `https://api.ryzendesu.vip/api/downloader/threads?url=${encodedUrl}`;
  } else if (normalizedUrl.includes('pinterest.com') || normalizedUrl.includes('pin.it')) {
    endpoint = `https://api.ryzendesu.vip/api/downloader/pinterest?url=${encodedUrl}`;
  } else {
    throw new Error('URL_NOT_SUPPORTED');
  }

  let res;
  try {
    res = await axios.get(endpoint, {
      headers: {
        Accept: 'application/json'
      }
    });
  } catch (_error) {
    throw new Error('DOWNLOAD_API_FAILED');
  }

  console.log("=== DEBUG API RYZENDESU ===");
  console.log(JSON.stringify(res.data, null, 2));
  console.log("=========================");

  const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value.trim());
  const toUrl = (value) => (typeof value === 'string' ? value.trim() : '');

  const addUrl = (setRef, value) => {
    if (!isHttpUrl(value)) {
      return;
    }

    const urlValue = toUrl(value);
    if (!urlValue) {
      return;
    }

    setRef.add(urlValue);
  };

  const collectFromAny = (node, setRef) => {
    if (!node) {
      return;
    }

    if (typeof node === 'string') {
      addUrl(setRef, node);
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        collectFromAny(item, setRef);
      }
      return;
    }

    if (typeof node !== 'object') {
      return;
    }

    const preferredKeys = [
      'url',
      'downloadUrl',
      'directUrl',
      'src',
      'image',
      'images',
      'video',
      'videos',
      'media',
      'medias',
      'slides',
      'result',
      'results'
    ];

    for (const key of preferredKeys) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        collectFromAny(node[key], setRef);
      }
    }

    for (const value of Object.values(node)) {
      collectFromAny(value, setRef);
    }
  };

  const urlSet = new Set();
  const payload = res?.data;

  collectFromAny(payload?.data, urlSet);
  collectFromAny(payload?.url, urlSet);

  if (urlSet.size === 0) {
    throw new Error('DOWNLOAD_URL_NOT_FOUND');
  }

  return Array.from(urlSet);
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
