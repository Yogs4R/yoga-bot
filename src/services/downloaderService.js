const axios = require('axios');
const btch = require('btch-downloader');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

function isFfmpegMissingError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('ffmpeg') && (message.includes('not found') || message.includes('enoent') || message.includes('spawn'));
}

function safeUnlinkSync(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (_error) {
    // Ignore cleanup errors for temp files.
  }
}

async function convertVideoBufferToMp3(videoBuffer) {
  const tempDir = os.tmpdir();
  const randomId = crypto.randomBytes(6).toString('hex');
  const inputPath = path.join(tempDir, `audio_in_${randomId}.mp4`);
  const outputPath = path.join(tempDir, `audio_out_${randomId}.mp3`);

  await fs.promises.mkdir(tempDir, { recursive: true });
  await fs.promises.writeFile(inputPath, videoBuffer);

  try {
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .format('mp3')
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    return await fs.promises.readFile(outputPath);
  } finally {
    safeUnlinkSync(inputPath);
    safeUnlinkSync(outputPath);
  }
}

async function getDownloadUrl(url) {
  const normalizedUrl = String(url || '').trim();
  if (!normalizedUrl) {
    throw new Error('MEDIA_NOT_FOUND');
  }

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

    let mediaUrls = Array.from(mediaUrlSet).filter((item) => !isAudioUrl(item));

    if (normalizedUrl.includes('tiktok.com')) {
      const videoCandidateUrls = mediaUrls.filter((item) => isVideoLikeUrl(item) && !isImageLikeUrl(item));
      const nonTiktokioVideoUrls = videoCandidateUrls.filter((item) => !item.includes('tiktokio.com') && !item.includes('dl.tiktokio.com'));

      if (nonTiktokioVideoUrls.length > 0) {
        mediaUrls = nonTiktokioVideoUrls;
      } else if (videoCandidateUrls.length > 0) {
        mediaUrls = videoCandidateUrls;
      } else {
        const nonTiktokioUrls = mediaUrls.filter((item) => !item.includes('tiktokio.com') && !item.includes('dl.tiktokio.com') && !isImageLikeUrl(item));
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
  const isAudioUrl = (value) => /(^|[/?&_.-])(mp3|m4a|aac|wav)([/?&_.-]|$)|sf=\.mp3|audio_mpeg|mime_type=audio/i.test(String(value || ''));
  const isImageLikeUrl = (value) => /\.(jpg|jpeg|png|webp)(\?|$)|thumbnail|cover|origin_cover|dynamic_cover/i.test(String(value || ''));
  const isVideoLikeUrl = (value) => /\.(mp4|m3u8)(\?|$)|mime_type=video|video_mp4|\/video\//i.test(String(value || ''));
  const audioUrlSet = new Set();
  const mediaFallbackSet = new Set();
  const visitedNodes = new WeakSet();

  const collectAudioCandidates = (node) => {
    if (!node) return;

    if (typeof node === 'string') {
      const clean = node.trim();
      if (!isHttpUrl(clean)) return;

      if (isAudioUrl(clean)) {
        audioUrlSet.add(clean);
      } else if (isVideoLikeUrl(clean)) {
        mediaFallbackSet.add(clean);
      }
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        collectAudioCandidates(item);
      }
      return;
    }

    if (typeof node !== 'object') return;

    if (visitedNodes.has(node)) return;
    visitedNodes.add(node);

    const candidateKeys = [
      'mp3',
      'audio',
      'music',
      'audioUrl',
      'musicUrl',
      'play',
      'wmplay',
      'hdplay',
      'video',
      'url',
      'downloadLink',
      'media',
      'data',
      'result',
      'results',
      'music_info'
    ];

    for (const key of candidateKeys) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        collectAudioCandidates(node[key]);
      }
    }

    for (const value of Object.values(node)) {
      collectAudioCandidates(value);
    }
  };

  try {
    if (normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtu.be')) {
      const result = await btch.youtube(normalizedUrl);
      console.log('btch-downloader result:', result);
      collectAudioCandidates(result?.mp3);
      collectAudioCandidates(result?.data?.mp3);
      collectAudioCandidates(result);
    } else if (normalizedUrl.includes('tiktok.com')) {
      const result = await btch.ttdl(normalizedUrl);
      console.log('btch-downloader result:', result);
      collectAudioCandidates(result?.music);
      collectAudioCandidates(result?.audio);
      collectAudioCandidates(result);

      try {
        const sipuRes = await axios.get(`https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(normalizedUrl)}`);
        console.log('siputzx tiktok result:', sipuRes?.data);
        collectAudioCandidates(sipuRes?.data?.data?.music);
        collectAudioCandidates(sipuRes?.data?.data?.audio);
        collectAudioCandidates(sipuRes?.data?.data?.media);
      } catch (sipuErr) {
        console.error('Siputzx TikTok fallback failed:', sipuErr.message);
      }

      try {
        const tikwmRes = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(normalizedUrl)}`);
        console.log('tikwm result:', tikwmRes?.data);
        collectAudioCandidates(tikwmRes?.data?.data?.music);
        collectAudioCandidates(tikwmRes?.data?.data?.music_info?.play);
        collectAudioCandidates(tikwmRes?.data?.data?.play);
      } catch (tikwmErr) {
        console.error('TikWM fallback failed:', tikwmErr.message);
      }
    } else if (normalizedUrl.includes('instagram.com') || normalizedUrl.includes('twitter.com') || normalizedUrl.includes('x.com')) {
      const mediaUrls = await getDownloadUrl(normalizedUrl);
      for (const mediaUrl of mediaUrls) {
        collectAudioCandidates(mediaUrl);
      }
    } else if (normalizedUrl.includes('facebook.com') || normalizedUrl.includes('fb.watch')) {
      throw new Error('FB_NOT_SUPPORTED');
    } else {
      throw new Error('MEDIA_NOT_FOUND');
    }

    const directAudioUrls = Array.from(audioUrlSet).filter((item) => !isImageLikeUrl(item));
    if (directAudioUrls.length > 0) {
      return directAudioUrls[0];
    }

    const mediaFallbackUrls = Array.from(mediaFallbackSet).filter((item) => !isImageLikeUrl(item));
    if (mediaFallbackUrls.length > 0) {
      return mediaFallbackUrls[0];
    }

    throw new Error('AUDIO_NOT_FOUND');
  } catch (_error) {
    if (_error?.message === 'FB_NOT_SUPPORTED') {
      throw _error;
    }
    if (_error?.message === 'AUDIO_NOT_FOUND') {
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
  const media = await getMediaBuffer(url);

  if (media?.type === 'audio') {
    if (Buffer.byteLength(media.buffer) > MAX_FILE_SIZE_BYTES) {
      throw new Error('FILE_TOO_LARGE');
    }

    return {
      buffer: media.buffer,
      type: 'audio',
      mimetype: media.mimetype || 'audio/mpeg'
    };
  }

  if (media?.type !== 'video') {
    throw new Error('AUDIO_NOT_FOUND');
  }

  try {
    const audioBuffer = await convertVideoBufferToMp3(media.buffer);

    if (Buffer.byteLength(audioBuffer) > MAX_FILE_SIZE_BYTES) {
      throw new Error('FILE_TOO_LARGE');
    }

    return {
      buffer: audioBuffer,
      type: 'audio',
      mimetype: 'audio/mpeg'
    };
  } catch (error) {
    if (error?.message === 'FILE_TOO_LARGE') {
      throw error;
    }

    if (isFfmpegMissingError(error)) {
      throw new Error('FFMPEG_NOT_FOUND');
    }

    throw new Error('AUDIO_CONVERT_FAILED');
  }
}

module.exports = {
  getDownloadUrl,
  getAudioUrl,
  getMediaBuffer,
  getAudioBuffer
};
