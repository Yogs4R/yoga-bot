const axios = require('axios');
const { ndown, ytdown } = require('nayan-media-downloader');

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

async function getDownloadUrl(url) {
  const normalizedUrl = String(url || '').trim();
  if (!normalizedUrl) {
    throw new Error('MEDIA_NOT_FOUND');
  }

  const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value.trim());
  const toUrl = (value) => (typeof value === 'string' ? value.trim() : '');
  const urlSet = new Set();

  const addUrl = (value) => {
    if (!isHttpUrl(value)) {
      return;
    }

    const cleanUrl = toUrl(value);
    if (cleanUrl) {
      urlSet.add(cleanUrl);
    }
  };

  const collectFromNode = (node) => {
    if (!node) {
      return;
    }

    if (typeof node === 'string') {
      addUrl(node);
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        collectFromNode(item);
      }
      return;
    }

    if (typeof node !== 'object') {
      return;
    }

    const keys = [
      'url',
      'video',
      'videoUrl',
      'downloadUrl',
      'directUrl',
      'src',
      'link'
    ];

    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        collectFromNode(node[key]);
      }
    }
  };

  try {
    if (normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtu.be')) {
      const result = await ytdown(normalizedUrl);
      collectFromNode(result?.data?.video);
      collectFromNode(result?.data?.videos);
    } else {
      const result = await ndown(normalizedUrl);
      collectFromNode(result?.data);
      collectFromNode(result?.data?.result);
      collectFromNode(result?.data?.results);
    }

    if (urlSet.size === 0) {
      throw new Error('MEDIA_NOT_FOUND');
    }

    return Array.from(urlSet);
  } catch (_error) {
    if (_error?.message === 'MEDIA_NOT_FOUND') {
      throw _error;
    }

    throw new Error('MEDIA_NOT_FOUND');
  }
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
