const { generateBoxTemplate } = require('../utils/formatter');

const DEFAULT_MONITOR_TIMEOUT_MS = 10000;
const MONITOR_BUTTON_LABELS = ['Fuenzer Apps', 'Fuenzer Studio', 'Ridwan Portfolio'];

function parseMonitorUrls() {
  return String(process.env.MONITOR_URLS || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
}

function getFallbackLabel(url, index) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./i, '');
    return hostname || `Website ${index + 1}`;
  } catch (_error) {
    return `Website ${index + 1}`;
  }
}

function getMonitorWebsiteLinks() {
  const urls = parseMonitorUrls();

  return urls.map((url, index) => ({
    label: MONITOR_BUTTON_LABELS[index] || getFallbackLabel(url, index),
    url
  }));
}

async function checkSingleWebsite(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_MONITOR_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal
    });

    return {
      url,
      ok: response.ok,
      statusCode: response.status,
      statusText: response.ok ? 'OK' : 'Down',
      label: `${response.status} ${response.ok ? 'OK' : 'Down'}`
    };
  } catch (error) {
    const isTimeout = error?.name === 'AbortError';

    return {
      url,
      ok: false,
      statusCode: null,
      statusText: isTimeout ? 'Timeout' : 'Down',
      label: isTimeout ? 'Timeout Down' : 'Fetch Error Down',
      errorMessage: error?.message || 'Unknown error'
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function checkWebsites() {
  const monitorUrls = parseMonitorUrls();
  const results = [];

  for (const url of monitorUrls) {
    results.push(await checkSingleWebsite(url));
  }

  return {
    results,
    hasError: results.some((result) => !result.ok)
  };
}

function formatMonitorMessage(results = [], headerOverride) {
  if (!Array.isArray(results) || results.length === 0) {
    const header = headerOverride || '> *MONITOR BELUM DIKONFIGURASI* ⚠️';
    const body = generateBoxTemplate([
      'MONITOR_URLS belum diatur.',
      'Isi environment dengan daftar URL dipisahkan koma.'
    ]);
    return `${header}\n\n${body}`;
  }

  const hasError = results.some((result) => !result.ok);
  const header = headerOverride || (hasError ? '> *STATUS WEB MONITOR* ⚠️' : '> *STATUS WEB MONITOR* ✅');
  const body = generateBoxTemplate(
    results.map((result) => `${result.url} -> ${result.label}`)
  );
  const downCount = results.filter((result) => !result.ok).length;
  const footer = `\nTotal: ${results.length} | Down: ${downCount}`;

  return `${header}\n\n${body}${footer}`;
}

module.exports = {
  checkWebsites,
  formatMonitorMessage,
  getMonitorWebsiteLinks
};
