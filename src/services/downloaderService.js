const axios = require('axios');
const btch = require('btch-downloader');

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

async function getDownloadUrl(url) {
  const normalizedUrl = String(url || '').trim();
  if (!normalizedUrl) {
    throw new Error('MEDIA_NOT_FOUND');
  }

  const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(String(value).trim());
  const mediaUrlSet = new Set();

  const collectUrls = (node) => {
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
        collectUrls(item);
      }
      return;
    }

    if (typeof node !== 'object') return;

    const candidateKeys = ['url', 'video', 'videoUrl', 'src', 'link', 'download', 'downloadUrl', 'directUrl', 'data'];
    for (const key of candidateKeys) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        collectUrls(node[key]);
      }
    }
  };

  try {
    if (normalizedUrl.includes('instagram.com')) {
      const result = await btch.igdl(normalizedUrl);
      console.log('btch-downloader result:', result);
      if (Array.isArray(result)) {
        for (const item of result) {
          collectUrls(item?.url);
          collectUrls(item);
        }
      } else {
        collectUrls(result);
      }
    } else if (normalizedUrl.includes('tiktok.com')) {
      const result = await btch.ttdl(normalizedUrl);
      console.log('btch-downloader result:', result);
      collectUrls(result?.video);
      collectUrls(result?.data?.video);
      collectUrls(result);
    } else if (normalizedUrl.includes('twitter.com') || normalizedUrl.includes('x.com')) {
      const res = await axios.get(`https://api.siputzx.my.id/api/d/twitter?url=${encodeURIComponent(normalizedUrl)}`);
      console.log('siputzx twitter result:', res?.data);
      collectUrls(res?.data?.data);
      collectUrls(res?.data?.url);
      collectUrls(res?.data);
    } else if (normalizedUrl.includes('facebook.com') || normalizedUrl.includes('fb.watch')) {
      throw new Error('FB_NOT_SUPPORTED');
    } else if (normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtu.be')) {
      const result = await btch.youtube(normalizedUrl);
      console.log('btch-downloader result:', result);
      collectUrls(result?.video);
      collectUrls(result?.data?.video);
      collectUrls(result);
    } else {
      throw new Error('MEDIA_NOT_FOUND');
    }

    const mediaUrls = Array.from(mediaUrlSet);
    if (mediaUrls.length === 0) throw new Error('MEDIA_NOT_FOUND');
    return mediaUrls;
  } catch (_error) {
    if (_error?.message === 'FB_NOT_SUPPORTED') {
      throw _error;
    }
    throw new Error('MEDIA_NOT_FOUND');
  }
}

async function getMediaBuffer(url) {
  const urlObj = new URL(url);
  const dynamicHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: '*/*',
    Referer: `${urlObj.origin}/`
  };

  const headRes = await axios.head(url, { headers: dynamicHeaders });
  const size = headRes?.headers?.['content-length'];
  if (size && parseInt(size, 10) > MAX_FILE_SIZE_BYTES) {
    throw new Error('FILE_TOO_LARGE');
  }

  const mediaRes = await axios.get(url, {
    responseType: 'arraybuffer',
    headers: dynamicHeaders
  });
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
