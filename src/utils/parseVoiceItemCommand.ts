export interface ParsedVoiceItem {
  name: string;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  width: number | null;
  height: number | null;
  confidence: 'full' | 'partial' | 'name-only';
}

// Recognised unit keywords -> normalised unit string
const UNIT_MAP: Record<string, string> = {
  'sq ft': 'sq.ft', 'sq.ft': 'sq.ft', 'sqft': 'sq.ft', 'square feet': 'sq.ft', 'square foot': 'sq.ft',
  'sq m': 'sq.m', 'sq.m': 'sq.m', 'sqm': 'sq.m', 'square meter': 'sq.m', 'square metre': 'sq.m',
  'rft': 'rft', 'running feet': 'rft', 'running ft': 'rft', 'running foot': 'rft',
  'per meter': 'per meter', 'per metre': 'per meter', 'meter': 'per meter', 'metre': 'per meter',
  'piece': 'piece', 'pieces': 'piece', 'pcs': 'piece', 'pc': 'piece', 'nos': 'piece', 'no': 'piece',
  'unit': 'unit', 'units': 'unit',
  'kg': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
  'litre': 'litre', 'liter': 'litre', 'litres': 'litre', 'liters': 'litre', 'ltr': 'litre',
  'bag': 'bag', 'bags': 'bag',
  'hour': 'hours', 'hours': 'hours', 'hr': 'hours', 'hrs': 'hours',
  'lump sum': 'lump sum', 'lumpsum': 'lump sum', 'ls': 'lump sum',
  // Hindi / transliterated
  'वर्ग फीट': 'sq.ft', 'वर्ग फुट': 'sq.ft',
  'मीटर': 'per meter',
  'नग': 'piece', 'किलो': 'kg', 'बैग': 'bag', 'थैला': 'bag',
};

// Price trigger words in English and Hindi
const PRICE_WORDS = [
  'at', 'for', 'price', 'cost', 'rate', 'each', 'per',
  'rupees', 'rupee', 'rs', 'inr', '₹',
  'रुपये', 'रुपया', 'रु',
];

// "add / jodo / daalo" trigger words (not used for parsing but useful if extending)
// const ADD_WORDS = ['add', 'jodo', 'add karo', 'daalo', 'likho'];

function normaliseText(text: string): string {
  return text.toLowerCase()
    .replace(/[,]/g, ' ')
    .replace(/×/g, ' x ')
    .replace(/\bby\b/g, ' x ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractUnit(text: string): { unit: string; restText: string } | null {
  // Sort keys longest-first so multi-word units match first
  const sortedKeys = Object.keys(UNIT_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(text)) {
      const unit = UNIT_MAP[key];
      const restText = text.replace(regex, ' ').replace(/\s+/g, ' ').trim();
      return { unit, restText };
    }
  }
  return null;
}

function extractDimensions(text: string): { width: number; height: number; restText: string } | null {
  // Patterns: "12 x 8", "12by8", "12 feet by 8 feet", "12 by 8"
  const dimRegex = /(\d+(?:\.\d+)?)\s*(?:x|by|×)\s*(\d+(?:\.\d+)?)/i;
  const match = text.match(dimRegex);
  if (match) {
    return {
      width: parseFloat(match[1]),
      height: parseFloat(match[2]),
      restText: text.replace(dimRegex, ' ').replace(/\s+/g, ' ').trim(),
    };
  }
  return null;
}

function extractPrice(text: string): { price: number; restText: string } | null {
  // Try to find price after known price trigger words
  for (const trigger of PRICE_WORDS) {
    const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:${escaped})\\s*(\\d+(?:[,\\d]*)?(?:\\.\\d+)?)`, 'i');
    const match = text.match(regex);
    if (match) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0) {
        return {
          price,
          restText: text.replace(regex, ' ').replace(/\s+/g, ' ').trim(),
        };
      }
    }
  }

  // Fallback: any standalone large number (> 10) could be price if no quantity yet
  const numRegex = /\b(\d{2,}(?:[,\d]*)?(?:\.\d+)?)\b/g;
  const matches = [...text.matchAll(numRegex)];
  for (const m of matches) {
    const val = parseFloat(m[1].replace(/,/g, ''));
    if (val >= 10) {
      return {
        price: val,
        restText: text.replace(m[0], ' ').replace(/\s+/g, ' ').trim(),
      };
    }
  }
  return null;
}

function extractQuantity(text: string): { quantity: number; restText: string } | null {
  const match = text.match(/\b(\d+(?:\.\d+)?)\b/);
  if (match) {
    return {
      quantity: parseFloat(match[1]),
      restText: text.replace(match[0], ' ').replace(/\s+/g, ' ').trim(),
    };
  }
  return null;
}

function cleanName(text: string): string {
  // Remove leftover stop words
  const stopWords = ['add', 'please', 'karo', 'daalo', 'jodo', 'likho', 'the', 'a', 'an', 'some', 'of', 'and'];
  let result = text;
  for (const word of stopWords) {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), ' ');
  }
  return result.replace(/\s+/g, ' ').trim();
}

export function parseVoiceItemCommand(rawTranscript: string): ParsedVoiceItem {
  let text = normaliseText(rawTranscript);

  // Step 1: extract dimensions first (before unit extraction)
  let width: number | null = null;
  let height: number | null = null;
  const dimResult = extractDimensions(text);
  if (dimResult) {
    width = dimResult.width;
    height = dimResult.height;
    text = dimResult.restText;
  }

  // Step 2: extract unit
  let unit: string | null = null;
  const unitResult = extractUnit(text);
  if (unitResult) {
    unit = unitResult.unit;
    text = unitResult.restText;
  }

  // Step 3: extract price
  let unitPrice: number | null = null;
  const priceResult = extractPrice(text);
  if (priceResult) {
    unitPrice = priceResult.price;
    text = priceResult.restText;
  }

  // Step 4: extract quantity (first number remaining)
  let quantity: number | null = null;
  const qtyResult = extractQuantity(text);
  if (qtyResult) {
    quantity = qtyResult.quantity;
    text = qtyResult.restText;
  }

  // If dimensions were extracted but no explicit quantity, auto-calculate from area (width × height)
  if (width !== null && height !== null && quantity === null) {
    quantity = parseFloat((width * height).toFixed(4));
  }

  // Step 5: whatever text remains is the item name
  const name = cleanName(text);

  const confidence: ParsedVoiceItem['confidence'] =
    name && quantity !== null && (unitPrice !== null || unit !== null)
      ? 'full'
      : name && (quantity !== null || unit !== null)
      ? 'partial'
      : 'name-only';

  return { name, quantity, unit, unitPrice, width, height, confidence };
}
