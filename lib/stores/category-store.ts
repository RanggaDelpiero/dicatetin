// ============================================
// Pundi — Category Store (Zustand)
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Category, CategoryType } from '@/lib/types';
import { generateId, PRESET_CATEGORIES } from '@/lib/data/presets';

interface CategoryState {
  categories: (Omit<Category, 'id'> & { id: string })[];

  // Actions
  addCategory: (cat: { name: string; type: CategoryType; icon: string; color: string }) => string;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  archiveCategory: (id: string) => void;
  unarchiveCategory: (id: string) => void;
  mergeCategories: (sourceId: string, targetId: string) => { mergedTransactionIds: string[] };
  reorderCategories: (ids: string[]) => void;
  deleteCategory: (id: string) => void;
  getActiveCategories: (type?: CategoryType) => (Omit<Category, 'id'> & { id: string })[];
  getCategoryById: (id: string) => (Omit<Category, 'id'> & { id: string }) | undefined;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      categories: PRESET_CATEGORIES.map((c) => ({
        ...c,
        id: generateId(),
        isArchived: false,
        isCustom: false,
      })),

      addCategory: (cat) => {
        const id = generateId();
        const newCat: Omit<Category, 'id'> & { id: string } = {
          ...cat,
          id,
          user_id: 'local-user',
          order: get().categories.length,
          isArchived: false,
          isCustom: true,
        };
        set((state) => ({
          categories: [...state.categories, newCat],
        }));
        return id;
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      archiveCategory: (id) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, isArchived: true } : c
          ),
        }));
      },

      unarchiveCategory: (id) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, isArchived: false } : c
          ),
        }));
      },

      mergeCategories: (sourceId, targetId) => {
        // Returns the IDs of transactions that need to be reassigned
        // The actual transaction reassignment happens in the calling component
        // because category store shouldn't depend on transaction store

        // Archive the source category after merge
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === sourceId ? { ...c, isArchived: true, name: `${c.name} (digabung)` } : c
          ),
        }));

        return { mergedTransactionIds: [] }; // Caller handles tx reassignment
      },

      reorderCategories: (ids) => {
        set((state) => ({
          categories: state.categories.map((c) => {
            const newOrder = ids.indexOf(c.id);
            return newOrder >= 0 ? { ...c, order: newOrder } : c;
          }),
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }));
      },

      getActiveCategories: (type) => {
        const cats = get().categories.filter((c) => !c.isArchived);
        if (type) return cats.filter((c) => c.type === type);
        return cats;
      },

      getCategoryById: (id) => {
        return get().categories.find((c) => c.id === id);
      },
    }),
    {
      name: 'pundi-categories',
    }
  )
);
