const KEYWORD_BUCKETS = ['negative', 'positive', 'neutral'];

const keywordPolarityColor = {
  negative: 'error',
  positive: 'success',
  neutral: 'primary',
};

export function parseKeywords(raw) {
  if (!raw) return [];

  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .map((text) => ({ text, polarity: 'neutral' }));
  }

  if (Array.isArray(raw)) {
    return raw
      .filter((k) => typeof k === 'string' && k.trim())
      .map((text) => ({ text: text.trim(), polarity: 'neutral' }));
  }

  if (typeof raw !== 'object') return [];

  const items = [];
  const seen = new Set();

  const pushItem = (text, polarity = 'neutral') => {
    const trimmed = text.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) return;
    seen.add(key);
    items.push({ text: trimmed, polarity });
  };

  KEYWORD_BUCKETS.forEach((bucket) => {
    const list = raw[bucket];
    if (!Array.isArray(list)) return;
    list.forEach((item) => {
      if (typeof item === 'string') pushItem(item, bucket);
    });
  });

  const categories = raw.categories;
  if (categories && typeof categories === 'object') {
    Object.values(categories).forEach((list) => {
      if (!Array.isArray(list)) return;
      list.forEach((item) => {
        if (typeof item === 'string') pushItem(item, 'neutral');
      });
    });
  }

  return items;
}

export function formatKeywords(raw) {
  return parseKeywords(raw)
    .map((item) => item.text)
    .join(', ');
}

export function getKeywordChipColor(polarity) {
  return keywordPolarityColor[polarity] || 'primary';
}
