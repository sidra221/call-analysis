const KEYWORD_BUCKETS = ['negative', 'positive', 'neutral'];

const keywordPolarityColor = {
  negative: 'error',
  positive: 'success',
  neutral: 'primary',
};

const ISSUE_TYPE_LABELS = {
  technical: 'Technical',
  financial: 'Financial',
  account: 'Account',
  delivery: 'Delivery',
  legal: 'Legal',
  fraud: 'Fraud',
  scam: 'Scam',
  escalation: 'Escalation',
  anger: 'Anger',
  product_inquiry: 'Product Inquiry',
  sales_inquiry: 'Sales Inquiry',
  positive_feedback: 'Positive Feedback',
  general: 'General',
};

export function formatIssueType(type) {
  if (!type) return '';
  return ISSUE_TYPE_LABELS[type] || type.replace(/_/g, ' ');
}

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

  const pushItem = (text, polarity = 'neutral', category = '', keywordRole = '') => {
    const trimmed = text.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) return;
    seen.add(key);
    items.push({ text: trimmed, polarity, category, keywordRole });
  };

  const display = raw.display;
  if (Array.isArray(display) && display.length) {
    display.forEach((item) => {
      if (typeof item === 'string') {
        pushItem(item, raw.primary_polarity || 'neutral', raw.primary_issue_type || '');
      } else if (item && typeof item.text === 'string') {
        pushItem(
          item.text,
          item.polarity || 'neutral',
          item.category || '',
          item.keyword_role || item.keywordRole || '',
        );
      }
    });
    return items;
  }

  KEYWORD_BUCKETS.forEach((bucket) => {
    const list = raw[bucket];
    if (!Array.isArray(list)) return;
    list.forEach((item) => {
      if (typeof item === 'string') pushItem(item, bucket);
    });
  });

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

export function getKeywordsMeta(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { primary_polarity: '', primary_issue_type: '' };
  }
  return {
    primary_polarity: raw.primary_polarity || '',
    primary_issue_type: raw.primary_issue_type || '',
  };
}
