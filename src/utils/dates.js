function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value));
}

function isoDate(value) {
  if (!value) return '';
  return new Date(value).toISOString();
}

module.exports = { formatDate, isoDate };
