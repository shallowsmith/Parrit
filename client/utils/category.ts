export function mapTextToBucketByKeywords(text: string): string | null {
  if (!text) return null;
  const t = text.toLowerCase();
  if (/(food|restaurant|coffee|cafe|grocery|supermarket|deli|meal|eat|lunch|dinner|breakfast|snack|latte|espresso|burger|pizza|sandwich|starbucks)/.test(t)) return 'food';
  if (/(rent|landlord|apartment|lease|mortgage)/.test(t)) return 'rent';
  if (/(utility|electric|water|gas|internet|phone|bill|service charge)/.test(t)) return 'utilities';
  if (/(uber|lyft|taxi|bus|train|metro|transit|transport|rail|gas station|fuel|ride|fare)/.test(t)) return 'transportation';
  if (/(movie|netflix|spotify|concert|theater|entertainment|game|bar|club|ticket)/.test(t)) return 'entertainment';
  if (/(flight|airline|hotel|airbnb|travel|delta|expedia|booking)/.test(t)) return 'travel';
  if (/(gift|present|donation|charity)/.test(t)) return 'gift';
  return null;
}

export default { mapTextToBucketByKeywords };
