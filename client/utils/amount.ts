// Utilities to extract money amounts from speech to text results 
// Returns a number in dollars or null if not found.

const SMALL: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

function wordsToNumber(words: string): number | null {
  words = words.toLowerCase().replace(/[^a-z\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!words) return null;
  const parts = words.split(/ |-/);
  let total = 0;
  let current = 0;

  for (const part of parts) {
    if (SMALL[part] !== undefined) {
      current += SMALL[part];
    } else if (TENS[part] !== undefined) {
      current += TENS[part];
    } else if (part === 'hundred') {
      if (current === 0) current = 1;
      current *= 100;
      total += current;
      current = 0;
    } else if (part === 'thousand') {
      if (current === 0) current = 1;
      current *= 1000;
      total += current;
      current = 0;
    } else {
      return null;
    }
  }
  return total + current;
}

export function extractAmount(text: string): number | null {
  if (!text) return null;
  const s = String(text).replace(/,/g, '');

  // handle numeric with k/m suffix like "11k", "1.3k", "2M"
  const suffixNum = s.match(/([0-9]+(?:\.[0-9]+)?)\s*([kKmM])\b/);
  if (suffixNum) {
    const n = parseFloat(suffixNum[1]);
    const suf = suffixNum[2].toLowerCase();
    if (suf === 'k') return n * 1000;
    if (suf === 'm') return n * 1000000;
  }

  // handle word-number with k/m like "eleven k dollars" or "one point three k"
  const wordSuffix = s.match(/([a-z\s-]+?)\s*([kKmM])\b/i);
  if (wordSuffix) {
    const words = wordSuffix[1];
    const n = wordsToNumber(words);
    if (n !== null) {
      const suf = wordSuffix[2].toLowerCase();
      if (suf === 'k') return n * 1000;
      if (suf === 'm') return n * 1000000;
    }
  }

  // handle numeric + "hundred" or "thousand" e.g. "13 hundred", "11 thousand"
  const numberMultiplier = s.match(/([0-9]+(?:\.[0-9]+)?)\s*(hundred|thousand)\b/i);
  if (numberMultiplier) {
    const base = parseFloat(numberMultiplier[1]);
    const mult = numberMultiplier[2].toLowerCase();
    if (mult === 'hundred') return base * 100;
    if (mult === 'thousand') return base * 1000;
  }

  const dollarWithCents = s.match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)(?:\s*(?:and|,)\s*([0-9]+(?:\.[0-9]{1,2})?)\s*cents?)?/i);
  if (dollarWithCents) {
    const dollars = parseFloat(dollarWithCents[1]);
    const centsPart = dollarWithCents[2];
    if (centsPart !== undefined) {
      const cents = centsPart.includes('.') ? parseFloat(centsPart) : parseInt(centsPart, 10) || 0;
      const centsValue = centsPart.includes('.') ? cents : cents / 100;
      return parseFloat((dollars + centsValue).toFixed(2));
    }
    return parseFloat(dollars.toFixed(2));
  }

  const numericWords = s.match(/([0-9]+(?:\.[0-9]{1,2})?)\s*(?:dollars|bucks|usd)\b(?:\s*(?:and|,)\s*([0-9]+)\s*cents?)?/i);
  if (numericWords) {
    const value = parseFloat(numericWords[1]);
    const centsMatch = numericWords[2];
    if (centsMatch !== undefined) {
      const cents = parseInt(centsMatch, 10) || 0;
      return parseFloat((value + cents / 100).toFixed(2));
    }
    return value;
  }

  const wordsPattern = /([a-z\s-\-]+?)\s+(?:dollars|dollar|bucks)\b(?:\s*(?:and|,)\s*([a-z\s-\-]+?)\s+cents?)?/i;
  const wordsMatch = s.match(wordsPattern);
  if (wordsMatch) {
    const dollarsWords = wordsMatch[1];
    const centsWords = wordsMatch[2];
    const dollars = wordsToNumber(dollarsWords);
    let cents = 0;
    if (centsWords) {
      const c = wordsToNumber(centsWords);
      if (c !== null) cents = c;
    }
    if (dollars !== null) return dollars + cents / 100;
  }

  const centsOnly = s.match(/([a-z\s-\-]+?)\s+cents?\b/i);
  if (centsOnly) {
    const centsWords = centsOnly[1];
    const c = wordsToNumber(centsWords);
    if (c !== null) return c / 100;
  }

  const mixed = s.match(/([a-z\s-\-]+?)\s+dollar[s]?\s+([a-z0-9\s-]+)\b/i);
  if (mixed) {
    const dollarsWords = mixed[1];
    const tail = mixed[2];
    const dollars = wordsToNumber(dollarsWords);
    let cents = 0;
    const tailNum = tail.match(/([0-9]+)(?:\.[0-9]{1,2})?/);
    if (tailNum) {
      const t = parseFloat(tailNum[1]);
      if (t < 100) cents = t;
    } else {
      const tailWordsNum = wordsToNumber(tail);
      if (tailWordsNum !== null) cents = tailWordsNum;
    }
    if (dollars !== null) return dollars + cents / 100;
  }

  return null;
}

export default { extractAmount };
