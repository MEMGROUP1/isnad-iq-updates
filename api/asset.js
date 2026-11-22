// ملفات النسخة (الحزمة والصور والخطوط). ثابتة ما تتغيّر أبداً، فتنخزن بالـCDN سنة.
const RAW = 'https://raw.githubusercontent.com/MEMGROUP1/isnad-iq-updates/main';
const TYPES = {
  hbc: 'application/javascript',
  js: 'application/javascript',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
  json: 'application/json',
};

module.exports = async (req, res) => {
  const id = String(req.query.id || '');
  const file = String(req.query.file || '');
  if (!/^[0-9a-f-]{36}$/.test(id) || !/^[A-Za-z0-9._-]+$/.test(file)) {
    res.statusCode = 400;
    return res.end('Bad asset');
  }
  const r = await fetch(`${RAW}/updates/${id}/${file}`);
  if (!r.ok) {
    res.statusCode = r.status === 404 ? 404 : 502;
    return res.end('Asset unavailable');
  }
  const buf = Buffer.from(await r.arrayBuffer());
  const ext = (file.split('.').pop() || '').toLowerCase();
  res.statusCode = 200;
  res.setHeader('content-type', TYPES[ext] || 'application/octet-stream');
  res.setHeader('cache-control', 'public, max-age=31536000, s-maxage=31536000, immutable');
  return res.end(buf);
};
