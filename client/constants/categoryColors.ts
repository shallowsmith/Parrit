export const CATEGORY_COLORS: Record<string, string> = {
  food: '#EF4444',
  groceries: '#F97316',
  rent: '#DC2626',
  utilities: '#3B82F6',
  transportation: '#10B981',
  entertainment: '#8B5CF6',
  travel: '#06B6D4',
  gifts: '#EC4899',
  gift: '#EC4899',
  misc: '#FBBF24',
};

export const FALLBACK_COLORS = ['#06B6D4','#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#A78BFA', '#F97316'];

export const DEFAULT_NEW_CATEGORY_COLOR = '#06B6D4';

export function normalizeCategoryKey(name: string | undefined | null) {
  if (!name) return '';
  return String(name || '').toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

export function getCategoryColor(key: string | undefined | null, categories: any[] | undefined, fallbackIndex?: number, seed?: string) {
  const norm = normalizeCategoryKey(String(key || ''));
  if (norm && CATEGORY_COLORS[norm]) return CATEGORY_COLORS[norm];

  if (categories && categories.length) {
    const found = categories.find((c: any) => String(c.id) === String(key) || String(c._id) === String(key) || normalizeCategoryKey(c.name) === norm || normalizeCategoryKey(c.name) === normalizeCategoryKey(String(key || '')) );
    if (found) {
      if ((found as any).color) return (found as any).color;
      const byName = normalizeCategoryKey(found.name || '');
      if (byName && CATEGORY_COLORS[byName]) return CATEGORY_COLORS[byName];
    }
  }

  const palette = FALLBACK_COLORS;
  if (typeof fallbackIndex === 'number') return palette[fallbackIndex % palette.length];
  const s = String(seed || key || '');
  const idx = Math.abs(s.length) % palette.length;
  return palette[idx];
}
