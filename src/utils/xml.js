function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function rfc822(date) {
  return new Date(date).toUTCString();
}

function isoDay(date) {
  return new Date(date).toISOString().slice(0, 10);
}

module.exports = { escapeXml, rfc822, isoDay };
