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

export const FALLBACK_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#A78BFA', '#F97316'];

export function normalizeCategoryKey(name: string | undefined | null) {
  if (!name) return '';
  return String(name || '').toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}
