// خادم التحديث المباشر لتطبيق ISNAD IQ — بروتوكول expo-updates رقم 1.
// التطبيق يسأل هنا كل ما ينفتح: «أكو نسخة أحدث لنسختي الأصلية (runtime) ولهذا النظام؟»
// النسخ نفسها ملفات ثابتة تحت updates/<id>/، والفهرس updates/index.json يكتبه سكربت النشر.
const index = require('../updates/index.json');

function protocolHeaders(res) {
  res.setHeader('expo-protocol-version', '1');
  res.setHeader('expo-sfv-version', '0');
  res.setHeader('cache-control', 'private, max-age=0');
}

module.exports = (req, res) => {
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
  const withUrl = (a) => ({ ...a, url: `${base}/updates/${entry.id}/${a.file}`, file: undefined });
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
