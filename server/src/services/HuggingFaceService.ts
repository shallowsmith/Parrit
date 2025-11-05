/**
 * Hugging Face proxy service
 * Calls the Hugging Face Inference API using the server-side API key
 */
import type { IncomingHttpHeaders } from 'http';

const HF_MODEL_URL = process.env.HUGGINGFACE_MODEL_URL ||
  'https://router.huggingface.co/hf-inference/kuro-08/bert-transaction-categorization';

async function safeJson(res: Response) {
  const text = await res.text();
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try { return JSON.parse(text); } catch (e) { return text; }
  }
  try { return JSON.parse(text); } catch (e) { return text; }
}

export interface HuggingFaceResult {
  mapped: string;
  raw?: any;
}

export async function categorize(text: string): Promise<HuggingFaceResult> {
  const key = process.env.HUGGINGFACE_API_KEY;
  if (!key) throw new Error('Missing HUGGINGFACE_API_KEY environment variable on server');
  try {
    const res = await fetch(HF_MODEL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      } as unknown as Record<string, string>,
      body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
    });

    const rawText = await res.text();
    if (!res.ok) {
      const snippet = rawText ? rawText.slice(0, 1000) : `status ${res.status}`;
      return { mapped: 'misc', raw: { status: res.status, body: snippet } } as HuggingFaceResult;
    }

    let out: any;
    try { out = JSON.parse(rawText); } catch (e) { out = rawText; }

    let predictedLabel = '';
    if (Array.isArray(out) && out.length > 0) {
      const best = out.reduce((a: any, b: any) => (a.score > b.score ? a : b));
      predictedLabel = best.label || String(best);
    } else if (typeof out === 'object' && out?.label) {
      predictedLabel = out.label;
    } else if (typeof out === 'string') {
      predictedLabel = out;
    }

    const mapped = mapLabelToBucket(predictedLabel || '');
    if (mapped === 'misc') {
      try {
        console.warn('HF returned misc; text:', String(text).slice(0,200), ' raw:', JSON.stringify(out).slice(0, 1000));
      } catch (e) {
        console.warn('HF returned misc; (unable to stringify output)');
      }
      const keywordMap = mapTextToBucketByKeywords(text);
      if (keywordMap) return { mapped: keywordMap, raw: out } as HuggingFaceResult;
    }

    return { mapped, raw: out } as HuggingFaceResult;
  } catch (err: any) {
    const msg = err?.message ? String(err.message) : 'unknown error';
    return { mapped: 'misc', raw: { error: msg } } as HuggingFaceResult;
  }
}

// keyword based mapping as fallbacks
function mapTextToBucketByKeywords(text: string): string | null {
  if (!text) return null;
  const t = text.toLowerCase();
  // snack-specific terms -> prefer food even if "movie" appears
  if (/\b(popcorn|nachos|candy|candybar|concession|soda|soft drink|drink|chips|snack)\b/.test(t)) return 'food';
  // prioritize entertainment next
  if (/\b(movie|movies|netflix|spotify|concert|theater|theatre|entertainment|game|bar|club|ticket|cinema)\b/.test(t)) return 'entertainment';
  if (/\b(food|restaurant|coffee|cafe|grocery|supermarket|deli|meal|eat|lunch|dinner|breakfast|snack|latte|espresso|burger|pizza|sandwich)\b/.test(t)) return 'food';
    // explicit utility-bill phrases with highest priority for utilities
    if (/\b(electric bill|electricity bill|electricity|gas bill|water bill|sewer bill|sewer|sewage|trash bill|garbage bill|trash|garbage|phone bill|internet bill|utility bill)\b/.test(t)) return 'utilities';
    if (/\b(rent|landlord|apartment|lease|mortgage)\b/.test(t)) return 'rent';
    // general utilities: electricity, gas, water, sewer, trash, bills
    if (/\b(utility|utilities|electric|electricity|power|water|water bill|gas|gas bill|sewer|sewage|trash|garbage|internet|phone|bill|service charge)\b/.test(t)) return 'utilities';
  if (/\b(uber|lyft|taxi|bus|train|metro|transit|transport|rail|gas station|fuel|ride|fare)\b/.test(t)) return 'transportation';
  if (/\b(flight|airline|hotel|airbnb|travel|delta|expedia|booking)\b/.test(t)) return 'travel';
  if (/\b(gift|present|donation|charity)\b/.test(t)) return 'gift';
  return null;
}

function mapLabelToBucket(label: string) {
  const l = (label || '').toLowerCase();
  if (!l) return 'misc';
  if (/(food|restaurant|coffee|cafe|grocery|supermarket|deli|meal|eat|starbuck|subway|burger|pizza)/.test(l)) return 'food';
  if (/(rent|landlord|apartment|lease|mortgage)/.test(l)) return 'rent';
  if (/(utility|electric|water|gas|internet|phone|service charge|utility bill)/.test(l)) return 'utilities';
  if (/(uber|lyft|taxi|bus|train|metro|transit|transport|rail|gas station|fuel|ride)/.test(l)) return 'transportation';
  if (/\b(movie|movies|netflix|spotify|concert|theater|theatre|entertainment|game|bar|club|cinema)\b/.test(l)) return 'entertainment';
  if (/(flight|airline|hotel|airbnb|travel|delta|expedia|booking|uber travel)/.test(l)) return 'travel';
  if (/(gift|present|donation|charity)/.test(l)) return 'gift';
  return 'misc';
}

export default { categorize };
