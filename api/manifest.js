// خادم التحديث المباشر لتطبيق ISNAD IQ — بروتوكول expo-updates رقم 1.
// التطبيق يسأل هنا كل ما ينفتح: «أكو نسخة أحدث لنسختي الأصلية (runtime) ولهذا النظام؟»
// الفهرس والملفات بريبو MEMGROUP1/isnad-iq-updates (يكتبها سكربت النشر)، وهذا الخادم يقراها من GitHub.
const RAW = 'https://raw.githubusercontent.com/MEMGROUP1/isnad-iq-updates/main';

let cache = { at: 0, data: null };
async function loadIndex() {
  if (cache.data && Date.now() - cache.at < 30_000) return cache.data;
  const r = await fetch(`${RAW}/updates/index.json?t=${Math.floor(Date.now() / 30_000)}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`index ${r.status}`);
  cache = { at: Date.now(), data: await r.json() };
  return cache.data;
}

function protocolHeaders(res) {
  res.setHeader('expo-protocol-version', '1');
  res.setHeader('expo-sfv-version', '0');
  res.setHeader('cache-control', 'private, max-age=0');
}

module.exports = async (req, res) => {
  const platform = req.headers['expo-platform'] || req.query.platform;
  const runtime = req.headers['expo-runtime-version'] || req.query['runtime-version'];
  const protocol = req.headers['expo-protocol-version'];
  if (protocol && protocol !== '1') {
    res.statusCode = 406;
    return res.end('Unsupported protocol version');
  }
  if (platform !== 'android' && platform !== 'ios') {
    res.statusCode = 400;
    return res.end('Unsupported platform');
  }
  if (!runtime) {
    res.statusCode = 400;
    return res.end('Missing runtime version');
  }

  let index;
  try {
    index = await loadIndex();
  } catch (e) {
    res.statusCode = 503;
    return res.end('Index unavailable');
  }
  const entry = index[runtime] && index[runtime][platform];
  const accept = String(req.headers.accept || 'multipart/mixed');
  protocolHeaders(res);

  // ماكو نسخة لهذا الـruntime: «ماكو تحديث» (204 بلا أجزاء).
  if (!entry) {
    res.statusCode = 204;
    return res.end();
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const base = `https://${host}`;
  const withUrl = (a) => {
    const { file, ...rest } = a;
    return { ...rest, url: `${base}/api/asset?id=${entry.id}&file=${encodeURIComponent(file)}` };
  };
  const manifest = {
    id: entry.id,
    createdAt: entry.createdAt,
    runtimeVersion: runtime,
    launchAsset: withUrl(entry.launchAsset),
    assets: entry.assets.map(withUrl),
    metadata: {},
    extra: entry.extra || {},
  };
  const body = JSON.stringify(manifest);

  if (accept.includes('multipart/mixed')) {
    const boundary = `isnad-${entry.id}`;
    const part =
      `--${boundary}\r\n` +
      'content-disposition: form-data; name="manifest"\r\n' +
      'content-type: application/json; charset=utf-8\r\n\r\n' +
      `${body}\r\n` +
      `--${boundary}--\r\n`;
    res.statusCode = 200;
    res.setHeader('content-type', `multipart/mixed; boundary=${boundary}`);
    return res.end(part);
  }
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  return res.end(body);
};
