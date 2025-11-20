export function mapTextToBucketByKeywords(text: string): string | null {
  if (!text) return null;
  const t = text.toLowerCase();
  if (/\b(popcorn|nachos|candy|candybar|concession|soda|soft drink|drink|chips|snack)\b/.test(t)) return 'food';
  if (/\b(movie|movies|netflix|spotify|concert|theater|theatre|entertainment|game|bar|club|ticket|cinema)\b/.test(t)) return 'entertainment';
  if (/\b(food|restaurant|coffee|cafe|grocery|groceries|grocer|supermarket|deli|meal|eat|lunch|dinner|breakfast|snack|latte|espresso|burger|pizza|sandwich|starbucks)\b/.test(t)) return 'food';
    if (/\b(electric bill|electricity bill|electricity|electric bill|gas bill|water bill|sewer bill|sewer|sewage|trash bill|garbage bill|trash|garbage|phone bill|internet bill|utility bill)\b/.test(t)) return 'utilities';
    if (/\b(rent|landlord|apartment|lease|mortgage)\b/.test(t)) return 'rent';
    if (/\b(utility|utilities|electric|electricity|power|water|water bill|gas|gas bill|sewer|sewage|trash|garbage|internet|phone|bill|service charge)\b/.test(t)) return 'utilities';
  if (/\b(uber|lyft|taxi|bus|train|metro|transit|transport|rail|gas station|fuel|ride|fare)\b/.test(t)) return 'transportation';
  if (/\b(flight|airline|hotel|airbnb|travel|delta|expedia|booking)\b/.test(t)) return 'travel';
  if (/\b(gift|present|donation|charity)\b/.test(t)) return 'gift';
  return null;
}

export default { mapTextToBucketByKeywords };
