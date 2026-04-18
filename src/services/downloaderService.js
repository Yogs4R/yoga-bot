const axios = require('axios');
const btch = require('btch-downloader');

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

async function getDownloadUrl(url) {
  const normalizedUrl = String(url || '').trim();
  if (!normalizedUrl) {
    throw new Error('MEDIA_NOT_FOUND');
  }

  const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value.trim());
  const mediaUrlSet = new Set();

  const collectMediaUrls = (node) => {
    if (!node) return;

    if (typeof node === 'string') {
      const clean = node.trim();
      if (isHttpUrl(clean)) {
        mediaUrlSet.add(clean);
      }
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        collectMediaUrls(item);
      }
      return;
    }

    if (typeof node !== 'object') return;

    const preferredKeys = [
      'url',
      'video',
      'videoUrl',
      'download',
      'downloadUrl',
      'directUrl',
      'src',
      'link',
      'image',
      'images',
      'media',
      'result',
      'results',
      'data'
    ];

    for (const key of preferredKeys) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        collectMediaUrls(node[key]);
      }
    }
  };

  try {
    let result;

    if (normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtu.be')) {
      result = await btch.youtube(normalizedUrl);
    } else if (normalizedUrl.includes('instagram.com')) {
      result = await btch.igdl(normalizedUrl);
    } else if (normalizedUrl.includes('tiktok.com')) {
      result = await btch.ttdl(normalizedUrl);
    } else if (normalizedUrl.includes('twitter.com') || normalizedUrl.includes('x.com')) {
      result = await btch.twitter(normalizedUrl);
    } else if (normalizedUrl.includes('facebook.com')) {
      result = await btch.fbdown(normalizedUrl);
    } else {
      throw new Error('MEDIA_NOT_FOUND');
    }

    console.log('btch-downloader result:', result);
    collectMediaUrls(result);

    const mediaUrls = Array.from(mediaUrlSet);
    if (mediaUrls.length === 0) throw new Error('MEDIA_NOT_FOUND');
    return mediaUrls;
  } catch (_error) {
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
