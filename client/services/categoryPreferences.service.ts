import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORY_PREFERENCES_KEY = 'parrit_category_preferences';

/**
 * Category Preferences Service
 *
 * Manages which categories are enabled/disabled for display in transaction forms.
 * By default, all categories are enabled (checked).
 *
 * Storage format: { [categoryId]: boolean }
 * - true or undefined = enabled (checked)
 * - false = disabled (unchecked)
 */
class CategoryPreferencesService {
  /**
   * Get all category preferences for a user
   * Returns an object mapping category IDs to their enabled state
   */
  async getCategoryPreferences(userId: string): Promise<Record<string, boolean>> {
    try {
      const key = `${CATEGORY_PREFERENCES_KEY}_${userId}`;
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return {};
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load category preferences:', error);
      return {};
    }
  }

  /**
   * Save category preferences for a user
   */
  async saveCategoryPreferences(userId: string, preferences: Record<string, boolean>): Promise<void> {
    try {
      const key = `${CATEGORY_PREFERENCES_KEY}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save category preferences:', error);
      throw error;
    }
  }

  /**
   * Toggle a single category's enabled state
   */
  async toggleCategory(userId: string, categoryId: string): Promise<Record<string, boolean>> {
    const prefs = await this.getCategoryPreferences(userId);
    const currentState = prefs[categoryId] ?? true; // Default to true (enabled)
    const newPrefs = { ...prefs, [categoryId]: !currentState };
    await this.saveCategoryPreferences(userId, newPrefs);
    return newPrefs;
  }

  /**
   * Enable a category (used when user manually types a category)
   */
  async enableCategory(userId: string, categoryId: string): Promise<void> {
    const prefs = await this.getCategoryPreferences(userId);
    const newPrefs = { ...prefs, [categoryId]: true };
    await this.saveCategoryPreferences(userId, newPrefs);
  }

  /**
   * Check if a category is enabled
   * Returns true by default for categories not in preferences (all enabled by default)
   */
  async isCategoryEnabled(userId: string, categoryId: string): Promise<boolean> {
    const prefs = await this.getCategoryPreferences(userId);
    return prefs[categoryId] ?? true; // Default to enabled
  }

  /**
   * Filter categories to only include enabled ones
   */
  async filterEnabledCategories(userId: string, categories: any[]): Promise<any[]> {
    const prefs = await this.getCategoryPreferences(userId);
    return categories.filter(cat => {
      const id = cat.id || cat._id;
      return prefs[String(id)] ?? true; // Default to enabled
    });
  }
}

export default new CategoryPreferencesService();
