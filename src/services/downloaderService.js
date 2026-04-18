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
  const visitedNodes = new WeakSet();

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

    if (visitedNodes.has(node)) return;
    visitedNodes.add(node);

    const candidateKeys = [
      'url',
      'video',
      'videoUrl',
      'mp4',
      'imgUrl',
      'downloadLink',
      'src',
      'link',
      'download',
      'downloadUrl',
      'directUrl',
      'data',
      'result',
      'results',
      'videos',
      'images'
    ];
    for (const key of candidateKeys) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        collectUrls(node[key]);
      }
    }

    for (const value of Object.values(node)) {
      collectUrls(value);
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
      collectUrls(result?.mp4);
      collectUrls(result?.data?.mp4);
      collectUrls(result?.video);
      collectUrls(result?.data?.video);
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
  const tryDownload = async (headers) => {
    return axios.get(url, {
      responseType: 'arraybuffer',
      maxContentLength: MAX_FILE_SIZE_BYTES,
      headers
    });
  };

  let axiosConfig = {
    responseType: 'arraybuffer',
    maxContentLength: MAX_FILE_SIZE_BYTES
  };

  if (url.includes('tiktokio')) {
    axiosConfig.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Referer: 'https://tiktokio.com/'
    };
  }

  try {
    const res = await axios.get(url, axiosConfig);

    const type = res?.headers?.['content-type'] || '';
    return {
      buffer: res.data,
      type: type && type.includes('video') ? 'video' : 'image'
    };
  } catch (err) {
    const statusCode = Number(err?.response?.status || 0);
    if (statusCode === 403) {
      try {
        let fallbackHeaders = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        };

        if (url.includes('tiktokio')) {
          fallbackHeaders = {
            ...fallbackHeaders,
            Referer: 'https://dl.tiktokio.com/',
            Origin: 'https://tiktokio.com'
          };
        } else if (url.includes('rapidcdn')) {
          fallbackHeaders = {
            ...fallbackHeaders,
            Referer: 'https://snapinsta.app/'
          };
        } else if (url.includes('savenow')) {
          fallbackHeaders = {
            ...fallbackHeaders,
            Referer: 'https://savenow.to/'
          };
        }

        const retryRes = await tryDownload(fallbackHeaders);
        const retryType = retryRes?.headers?.['content-type'] || '';
        return {
          buffer: retryRes.data,
          type: retryType && retryType.includes('video') ? 'video' : 'image'
        };
      } catch (retryErr) {
        console.error('Retry download failed for:', url);
        console.error('Retry reason:', retryErr.message);
      }
    }

    console.error('Gagal mendownload buffer dari:', url);
    console.error('Alasan:', err.message);
    throw new Error('DOWNLOAD_BUFFER_FAILED');
  }
}

module.exports = {
  getDownloadUrl,
  getMediaBuffer
};
