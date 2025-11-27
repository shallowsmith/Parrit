export const CATEGORY_COLORS: Record<string, string> = {
  food: '#EF4444',        // bright red
  groceries: '#F97316',   // orange
  rent: '#7C3AED',        // violet (changed from dark red)
  utilities: '#3B82F6',   // blue
  transportation: '#10B981', // emerald green
  entertainment: '#A855F7',  // purple (brighter)
  travel: '#14B8A6',      // teal (changed from cyan to be more distinct)
  gifts: '#EC4899',       // pink
  gift: '#EC4899',        // pink
  misc: '#FBBF24',        // amber/yellow
};

export const FALLBACK_COLORS = ['#06B6D4','#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#A78BFA', '#F97316'];

export const DEFAULT_NEW_CATEGORY_COLOR = '#06B6D4';

// Base color palette for dynamic category assignment (18 highly distinct colors, no white/black)
// Each color is maximally different from others to ensure visual distinction
export const BASE_COLORS = [
  '#DC2626', // deep red - position 0
  '#2563EB', // royal blue - position 1
  '#16A34A', // forest green - position 2
  '#D97706', // dark orange - position 3
  '#DB2777', // deep pink - position 4
  '#7C3AED', // deep purple - position 5
  '#0891B2', // dark cyan - position 6
  '#EA580C', // burnt orange - position 7
  '#65A30D', // olive green - position 8
  '#BE185D', // wine red - position 9
  '#4F46E5', // deep indigo - position 10
  '#0D9488', // dark teal - position 11
  '#CA8A04', // dark gold - position 12
  '#C026D3', // dark magenta - position 13
  '#0284C7', // steel blue - position 14
  '#15803D', // dark green - position 15
  '#9333EA', // vivid purple - position 16
  '#B45309', // brown orange - position 17
];

// Custom category color palette - specifically chosen to NOT conflict with default categories
// Includes pale, bright/neon, and dull variations for maximum variety
export const CUSTOM_CATEGORY_COLORS = [
  // Bright/Neon variations (eye-catching, saturated colors)
  '#22D3EE', // bright cyan
  '#A3E635', // lime neon
  '#FACC15', // bright yellow
  '#F59E0B', // bright amber
  '#0EA5E9', // bright sky blue
  '#10B981', // bright emerald (different from transportation)
  '#F472B6', // hot pink
  '#C084FC', // bright purple
  '#FB7185', // coral
  '#14F195', // neon green
  '#06B6D4', // bright teal
  '#FBBF24', // golden yellow
  '#E879F9', // neon magenta
  '#2DD4BF', // bright turquoise
  '#84CC16', // chartreuse

  // Pale/Pastel variations (soft, light colors)
  '#BFDBFE', // pale blue
  '#BBF7D0', // pale green
  '#FED7AA', // pale peach
  '#FBCFE8', // pale pink
  '#DDD6FE', // pale lavender
  '#BAE6FD', // pale sky
  '#FEF3C7', // pale yellow
  '#D9F99D', // pale lime
  '#FED7D7', // pale rose
  '#E0E7FF', // pale indigo
  '#CCFBF1', // pale teal
  '#FCE7F3', // pale magenta
  '#DBEAFE', // pale blue
  '#D1FAE5', // pale emerald
  '#FEE2E2', // pale red

  // Dull/Muted variations (subdued, desaturated colors)
  '#9CA3AF', // slate gray
  '#6B7280', // cool gray
  '#78716C', // stone gray
  '#737373', // neutral gray
  '#64748B', // blue gray
  '#71717A', // zinc gray
  '#7C8B84', // sage gray
  '#8B7D6B', // taupe
  '#6D7F8B', // steel gray
  '#7A8B8A', // dusty teal
  '#8B7A7A', // dusty rose
  '#7A7B8B', // dusty purple
  '#8B8A7A', // olive gray
  '#7A8B7F', // moss gray
  '#8B7F7A', // mocha gray

  // Medium saturation variations (balanced colors)
  '#60A5FA', // medium blue
  '#34D399', // medium mint
  '#FB923C', // medium orange
  '#F9A8D4', // medium pink
  '#818CF8', // medium indigo
  '#FCD34D', // medium yellow
  '#A78BFA', // medium purple
  '#6EE7B7', // medium seafoam
  '#FCA5A5', // medium salmon
  '#93C5FD', // medium powder blue
  '#FDE047', // medium lemon
  '#86EFAC', // medium green
  '#FDA4AF', // medium rose
  '#BAE6FF', // medium sky
  '#FDBA74', // medium peach
];

/**
 * Get all colors used by default/predefined categories
 */
export function getDefaultCategoryColors(): string[] {
  return Object.values(CATEGORY_COLORS);
}

/**
 * Get a color for a new custom category that doesn't conflict with default categories
 * @param existingCategories - Array of existing categories to check for color conflicts
 */
export function getColorForNewCategory(existingCategories: any[] = []): string {
  // Collect all colors already in use by custom categories (not default ones)
  const usedCustomColors = new Set(
    existingCategories
      .map((c: any) => c.color)
      .filter(Boolean)
      .filter((color: string) => !Object.values(CATEGORY_COLORS).includes(color))
  );

  // Find first available color from CUSTOM_CATEGORY_COLORS
  for (const color of CUSTOM_CATEGORY_COLORS) {
    if (!usedCustomColors.has(color)) {
      return color;
    }
  }

  // If all custom colors are used, try pale variations
  for (const baseColor of CUSTOM_CATEGORY_COLORS) {
    const paleColor = generateColorVariation(baseColor, 'pale');
    if (!usedCustomColors.has(paleColor)) {
      return paleColor;
    }
  }

  // If those are all used, try bright variations
  for (const baseColor of CUSTOM_CATEGORY_COLORS) {
    const brightColor = generateColorVariation(baseColor, 'bright');
    if (!usedCustomColors.has(brightColor)) {
      return brightColor;
    }
  }

  // Fallback: cycle through custom colors
  return CUSTOM_CATEGORY_COLORS[Math.floor(Math.random() * CUSTOM_CATEGORY_COLORS.length)];
}

/**
 * Convert hex color to HSL
 */
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 50 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to hex color
 */
function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate color variation (pale or bright) from base color
 * @param baseColor - Hex color string
 * @param type - 'pale' or 'bright'
 */
export function generateColorVariation(baseColor: string, type: 'pale' | 'bright'): string {
  const hsl = hexToHSL(baseColor);

  if (type === 'pale') {
    // Pale: increase lightness, decrease saturation
    hsl.l = Math.min(75, hsl.l + 20);
    hsl.s = Math.max(30, hsl.s - 15);
  } else {
    // Bright: increase saturation, adjust lightness
    hsl.s = Math.min(100, hsl.s + 20);
    hsl.l = Math.min(65, Math.max(50, hsl.l));
  }

  return hslToHex(hsl.h, hsl.s, hsl.l);
}

export function normalizeCategoryKey(name: string | undefined | null) {
  if (!name) return '';
  return String(name || '').toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

export function getCategoryColor(key: string | undefined | null, categories: any[] | undefined, fallbackIndex?: number, seed?: string) {
  const norm = normalizeCategoryKey(String(key || ''));

  // Priority 1: Check predefined category colors
  if (norm && CATEGORY_COLORS[norm]) return CATEGORY_COLORS[norm];

  // Priority 2: Check if category has custom color in database
  if (categories && categories.length) {
    const found = categories.find((c: any) => String(c.id) === String(key) || String(c._id) === String(key) || normalizeCategoryKey(c.name) === norm || normalizeCategoryKey(c.name) === normalizeCategoryKey(String(key || '')) );
    if (found) {
      // Skip the default cyan color - let it fall through to deterministic assignment
      if ((found as any).color && (found as any).color !== '#06B6D4') return (found as any).color;
      const byName = normalizeCategoryKey(found.name || '');
      if (byName && CATEGORY_COLORS[byName]) return CATEGORY_COLORS[byName];
    }
  }

  // Priority 3: Deterministic color assignment based on category position
  // This ensures same category always gets same color across donut chart and transactions
  if (categories && categories.length && key) {
    // Sort categories by ID for consistent ordering
    const sortedCategories = [...categories].sort((a, b) => {
      const idA = String(a.id || a._id || '');
      const idB = String(b.id || b._id || '');
      return idA.localeCompare(idB);
    });

    // Find the index of current category in sorted list
    const categoryIndex = sortedCategories.findIndex((c: any) =>
      String(c.id) === String(key) ||
      String(c._id) === String(key) ||
      normalizeCategoryKey(c.name) === norm ||
      normalizeCategoryKey(c.name) === normalizeCategoryKey(String(key || ''))
    );

    if (categoryIndex !== -1) {
      const baseColorCount = BASE_COLORS.length;

      if (categoryIndex < baseColorCount) {
        // Categories 0-17: Use base colors
        return BASE_COLORS[categoryIndex];
      } else if (categoryIndex < baseColorCount * 2) {
        // Categories 18-35: Use pale variations
        const baseIndex = categoryIndex % baseColorCount;
        return generateColorVariation(BASE_COLORS[baseIndex], 'pale');
      } else if (categoryIndex < baseColorCount * 3) {
        // Categories 36-53: Use bright variations
        const baseIndex = categoryIndex % baseColorCount;
        return generateColorVariation(BASE_COLORS[baseIndex], 'bright');
      } else {
        // Categories 54+: Cycle through base colors again
        const baseIndex = categoryIndex % baseColorCount;
        return BASE_COLORS[baseIndex];
      }
    }
  }

  // Fallback: Use better hash-based color assignment
  const palette = BASE_COLORS;
  if (typeof fallbackIndex === 'number') return palette[fallbackIndex % palette.length];

  // Create a simple hash from the key string to get consistent but distributed colors
  const s = String(seed || key || '');
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  const idx = Math.abs(hash) % palette.length;
  return palette[idx];
}
