const DEFAULT_MONITOR_TIMEOUT_MS = 10000;
const MONITOR_BUTTON_LABELS = ['🌐 Fuenzer Apps', '🌐 Fuenzer Studio', '👨‍💻 Ridwan Portfolio'];

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

function getPlatformName(platform) {
  const value = String(platform || '').toLowerCase().trim();
  if (value === 'whatsapp' || value === 'telegram') {
    return value;
  }
  return 'telegram';
}

function getWebsiteLabel(result, index) {
  return MONITOR_BUTTON_LABELS[index] || getFallbackLabel(result?.url, index);
}

function formatMonitorMessage(results = [], headerOverride, platform) {
  const platformName = getPlatformName(platform);
  const isWhatsApp = platformName === 'whatsapp';

  if (!Array.isArray(results) || results.length === 0) {
    const header = headerOverride
      || (isWhatsApp ? '> *MONITOR BELUM DIKONFIGURASI* ⚠️' : '<b>MONITOR BELUM DIKONFIGURASI</b> ⚠️');
    const body = [
      'MONITOR_URLS belum diatur.',
      'Isi environment dengan daftar URL dipisahkan koma.'
    ].join('\n');
    return `${header}\n\n${body}`;
  }

  const hasError = results.some((result) => !result.ok);
  const header = headerOverride
    || (isWhatsApp
      ? (hasError ? '> *STATUS WEB MONITOR* ⚠️' : '> *STATUS WEB MONITOR* ✅')
      : (hasError ? '<b>STATUS WEB MONITOR</b> ⚠️' : '<b>STATUS WEB MONITOR</b> ✅'));
  const sectionTitle = isWhatsApp ? '📡 *FITUR MONITOR*' : '<b>FITUR MONITOR</b> 📡';
  const bodyLines = results.map((result, index) => {
    const websiteLabel = getWebsiteLabel(result, index);
    return isWhatsApp
      ? `- ${websiteLabel} : ${result.label}`
      : `• ${websiteLabel} : ${result.label}`;
  });
  const body = [sectionTitle, ...bodyLines].join('\n');
  const downCount = results.filter((result) => !result.ok).length;
  const footer = ['—'.repeat(19), `Total: ${results.length} | Down: ${downCount}`].join('\n');

  return `${header}\n\n${body}\n\n${footer}`;
}

module.exports = {
  checkWebsites,
  formatMonitorMessage,
  getMonitorWebsiteLinks
};
