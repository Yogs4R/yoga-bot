const axios = require('axios');
const btch = require('btch-downloader');

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

function isUrlHostOrSubdomain(candidateUrl, baseDomain) {
  try {
    const hostname = new URL(String(candidateUrl || '').trim()).hostname.toLowerCase();
    const normalizedBaseDomain = String(baseDomain || '').toLowerCase();
    return hostname === normalizedBaseDomain || hostname.endsWith(`.${normalizedBaseDomain}`);
  } catch (_error) {
    return false;
  }
}

async function getDownloadUrl(url) {
  const normalizedUrl = String(url || '').trim();
  if (!normalizedUrl) {
    throw new Error('MEDIA_NOT_FOUND');
  }

  let normalizedHostname = '';
  try {
    normalizedHostname = new URL(normalizedUrl).hostname.toLowerCase();
  } catch (_error) {
    throw new Error('MEDIA_NOT_FOUND');
  }

  const isHostOrSubdomain = (hostname, domain) => hostname === domain || hostname.endsWith(`.${domain}`);
  const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(String(value).trim());
  const isAudioUrl = (value) => /(^|[/?&_.-])(mp3|m4a|aac|wav)([/?&_.-]|$)|sf=\.mp3/i.test(String(value || ''));
  const isImageLikeUrl = (value) => /\.(jpg|jpeg|png|webp)(\?|$)|thumbnail|cover|origin_cover|dynamic_cover/i.test(String(value || ''));
  const isVideoLikeUrl = (value) => /\.(mp4|m3u8)(\?|$)|mime_type=video|video_mp4|\/video\//i.test(String(value || ''));
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
    if (isHostOrSubdomain(normalizedHostname, 'instagram.com')) {
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
    } else if (isHostOrSubdomain(normalizedHostname, 'tiktok.com')) {
      const result = await btch.ttdl(normalizedUrl);
      console.log('btch-downloader result:', result);
      collectUrls(result?.video);
      collectUrls(result?.data?.video);

      try {
        const sipuRes = await axios.get(`https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(normalizedUrl)}`);
        console.log('siputzx tiktok result:', sipuRes?.data);
        collectUrls(sipuRes?.data?.data?.media);
        collectUrls(sipuRes?.data?.data?.url);
        collectUrls(sipuRes?.data?.data?.downloadLink);
      } catch (sipuErr) {
        console.error('Siputzx TikTok fallback failed:', sipuErr.message);
      }

      try {
        const tikwmRes = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(normalizedUrl)}`);
        console.log('tikwm result:', tikwmRes?.data);
        collectUrls(tikwmRes?.data?.data?.play);
        collectUrls(tikwmRes?.data?.data?.hdplay);
        collectUrls(tikwmRes?.data?.data?.wmplay);
      } catch (tikwmErr) {
        console.error('TikWM fallback failed:', tikwmErr.message);
      }
    } else if (isHostOrSubdomain(normalizedHostname, 'twitter.com') || isHostOrSubdomain(normalizedHostname, 'x.com')) {
      const res = await axios.get(`https://api.siputzx.my.id/api/d/twitter?url=${encodeURIComponent(normalizedUrl)}`);
      console.log('siputzx twitter result:', res?.data);
      collectUrls(res?.data?.data);
      collectUrls(res?.data?.url);
      collectUrls(res?.data);
    } else if (isHostOrSubdomain(normalizedHostname, 'facebook.com') || isHostOrSubdomain(normalizedHostname, 'fb.watch')) {
      throw new Error('FB_NOT_SUPPORTED');
    } else if (isHostOrSubdomain(normalizedHostname, 'youtube.com') || isHostOrSubdomain(normalizedHostname, 'youtu.be')) {
      const result = await btch.youtube(normalizedUrl);
      console.log('btch-downloader result:', result);
      collectUrls(result?.mp4);
      collectUrls(result?.data?.mp4);
      collectUrls(result?.video);
      collectUrls(result?.data?.video);
    } else {
      throw new Error('MEDIA_NOT_FOUND');
    }

    let mediaUrls = Array.from(mediaUrlSet).filter((item) => !isAudioUrl(item));

    if (isHostOrSubdomain(normalizedHostname, 'tiktok.com')) {
      const videoCandidateUrls = mediaUrls.filter((item) => isVideoLikeUrl(item) && !isImageLikeUrl(item));
      const nonTiktokioVideoUrls = videoCandidateUrls.filter(
        (item) => !isUrlHostOrSubdomain(item, 'tiktokio.com') && !isUrlHostOrSubdomain(item, 'dl.tiktokio.com')
      );

      if (nonTiktokioVideoUrls.length > 0) {
        mediaUrls = nonTiktokioVideoUrls;
      } else if (videoCandidateUrls.length > 0) {
        mediaUrls = videoCandidateUrls;
      } else {
        const nonTiktokioUrls = mediaUrls.filter(
          (item) =>
            !isUrlHostOrSubdomain(item, 'tiktokio.com') &&
            !isUrlHostOrSubdomain(item, 'dl.tiktokio.com') &&
            !isImageLikeUrl(item)
        );
        mediaUrls = nonTiktokioUrls.length > 0 ? nonTiktokioUrls : mediaUrls.filter((item) => !isImageLikeUrl(item));
      }

      if (mediaUrls.length > 1) {
        mediaUrls = [mediaUrls[0]];
      }
    }

    if (mediaUrls.length === 0) throw new Error('MEDIA_NOT_FOUND');
    return mediaUrls;
  } catch (_error) {
    if (_error?.message === 'FB_NOT_SUPPORTED') {
      throw _error;
    }
    throw new Error('MEDIA_NOT_FOUND');
  }
}

async function getAudioUrl(url) {
  const normalizedUrl = String(url || '').trim();
  if (!normalizedUrl) {
    throw new Error('MEDIA_NOT_FOUND');
  }

  const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(String(value).trim());
  const isYoutubeUrl =
    normalizedUrl.includes('youtube.com') ||
    normalizedUrl.includes('youtu.be') ||
    normalizedUrl.includes('music.youtube.com');

  try {
    if (!isYoutubeUrl) {
      throw new Error('AUDIO_PLATFORM_NOT_SUPPORTED');
    }

    const result = await btch.youtube(normalizedUrl);
    console.log('btch-downloader result:', result);

    const directMp3 = String(result?.mp3 || result?.data?.mp3 || '').trim();
    if (isHttpUrl(directMp3)) {
      return directMp3;
    }

    throw new Error('AUDIO_NOT_FOUND');
  } catch (_error) {
    if (_error?.message === 'AUDIO_NOT_FOUND' || _error?.message === 'AUDIO_PLATFORM_NOT_SUPPORTED') {
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
    const mediaType = type.includes('video') ? 'video' : type.includes('audio') ? 'audio' : 'image';
    return {
      buffer: res.data,
      type: mediaType,
      mimetype: type
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
        const retryMediaType = retryType.includes('video') ? 'video' : retryType.includes('audio') ? 'audio' : 'image';
        return {
          buffer: retryRes.data,
          type: retryMediaType,
          mimetype: retryType
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

async function getAudioBuffer(url) {
  const normalizedUrl = String(url || '').trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    throw new Error('AUDIO_NOT_FOUND');
  }

  try {
    const res = await axios.get(normalizedUrl, {
      responseType: 'arraybuffer',
      maxContentLength: MAX_FILE_SIZE_BYTES,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: normalizedUrl.includes('savenow') ? 'https://savenow.to/' : undefined
      }
    });

    const audioBuffer = res.data;
    if (Buffer.byteLength(audioBuffer) > MAX_FILE_SIZE_BYTES) {
      throw new Error('FILE_TOO_LARGE');
    }

    const contentType = String(res?.headers?.['content-type'] || '').toLowerCase();
    const mimeType = contentType && contentType !== 'application/octet-stream' ? contentType : 'audio/mpeg';

    return {
      buffer: audioBuffer,
      type: 'audio',
      mimetype: mimeType
    };
  } catch (error) {
    if (error?.message === 'FILE_TOO_LARGE') {
      throw error;
    }

    if (Number(error?.response?.status || 0) === 403) {
      throw new Error('DOWNLOAD_BUFFER_FAILED');
    }

    throw new Error('AUDIO_NOT_FOUND');
  }
}

module.exports = {
  getDownloadUrl,
  getAudioUrl,
  getMediaBuffer,
  getAudioBuffer
};
