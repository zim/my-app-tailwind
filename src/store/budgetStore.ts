import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface BudgetItem {
  id: number;
  title: string;
  type: 'income' | 'expense' | 'savings' | 'investment';
  amount: number;
  paid: boolean;
  recurring: 'monthly' | 'annual' | 'none';
  createdAt: Date;
  order: number;
}

export interface BudgetList {
  id: number;
  name: string;
  description: string;
  budgetItems: BudgetItem[];
  createdAt: Date;
  lastModified: Date;
  // Visual and behavior properties
  color: string;
  isArchived: boolean;
  currency: string;
}

interface BudgetState {
  // State
  budgetLists: BudgetList[];
  currentListId: number | null;
  filters: {
    search: string;
    type: string;
    paidStatus: string;
    recurring: string;
    minAmount: number;
    maxAmount: number;
  };
  sortConfig: {
    key: keyof BudgetItem | null;
    direction: 'asc' | 'desc';
  };
  showForm: boolean;
  editingItem: number | null;
  editForm: {
    title: string;
    type: BudgetItem['type'];
    amount: number;
    recurring: BudgetItem['recurring'];
  };
  newItem: {
    title: string;
    type: BudgetItem['type'];
    amount: number;
    recurring: BudgetItem['recurring'];
  };

  // Budget list management
  createBudgetList: (name: string, description: string, color?: string, currency?: string) => void;
  deleteBudgetList: (id: number) => void;
  updateBudgetList: (id: number, updates: Partial<Pick<BudgetList, 'name' | 'description' | 'color' | 'isArchived' | 'currency'>>) => void;
  setCurrentList: (id: number | null) => void;

  // Budget item actions (within a list)
  addBudgetItem: (listId: number) => void;
  updateBudgetItem: (listId: number, id: number, updates: Partial<BudgetItem>) => void;
  deleteBudgetItem: (listId: number, id: number) => void;
  togglePaid: (listId: number, id: number) => void;
  reorderItems: (listId: number, items: BudgetItem[]) => void;
  clearAllItemsInList: (listId: number) => void;
  resetToDefaults: () => void;
  clearAllData: () => void;

  // Filter actions
  setFilters: (filters: Partial<BudgetState['filters']>) => void;
  clearFilters: () => void;

  // Sort actions
  setSortConfig: (config: BudgetState['sortConfig']) => void;

  // Form actions
  setShowForm: (show: boolean) => void;
  setNewItem: (item: Partial<BudgetState['newItem']>) => void;
  resetNewItem: () => void;

  // Edit actions
  startEditing: (item: BudgetItem) => void;
  cancelEditing: () => void;
  saveEditedItem: (listId: number, id: number) => void;
  setEditForm: (form: Partial<BudgetState['editForm']>) => void;

  // Computed values
  getCurrentList: () => BudgetList | null;
  getFilteredItems: (listId: number) => BudgetItem[];
  getTotals: (listId: number) => {
    income: number;
    expenses: number;
    savings: number;
    investments: number;
    paid: number;
    unpaid: number;
  };
  getBalance: (listId: number) => number;
  getRecentLists: () => BudgetList[];
}

// Default colors for budget lists
const defaultColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

// Default budget items for the default list
const defaultBudgetItems: BudgetItem[] = [
  { id: 1, title: 'Salary', type: 'income', amount: 3500, paid: true, recurring: 'monthly', createdAt: new Date('2024-01-01'), order: 1 },
  { id: 2, title: 'Rent', type: 'expense', amount: 1000, paid: true, recurring: 'monthly', createdAt: new Date('2024-01-01'), order: 2 },
  { id: 3, title: 'Groceries', type: 'expense', amount: 300, paid: false, recurring: 'none', createdAt: new Date('2024-01-02'), order: 3 },
  { id: 4, title: 'Emergency Fund', type: 'savings', amount: 400, paid: true, recurring: 'monthly', createdAt: new Date('2024-01-01'), order: 4 },
  { id: 5, title: 'ISA Investment', type: 'investment', amount: 600, paid: false, recurring: 'none', createdAt: new Date('2024-01-03'), order: 5 },
  { id: 6, title: 'Utilities', type: 'expense', amount: 120, paid: true, recurring: 'monthly', createdAt: new Date('2024-01-01'), order: 6 },
  { id: 7, title: 'Freelance Work', type: 'income', amount: 800, paid: false, recurring: 'none', createdAt: new Date('2024-01-05'), order: 7 },
  { id: 8, title: 'Council Tax', type: 'expense', amount: 150, paid: true, recurring: 'monthly', createdAt: new Date('2024-01-01'), order: 8 },
];

// Default budget lists
const defaultBudgetLists: BudgetList[] = [
  {
    id: 1,
    name: 'Personal Budget',
    description: 'My main budget tracker',
    budgetItems: defaultBudgetItems,
    createdAt: new Date(),
    lastModified: new Date(),
    color: defaultColors[0],
    isArchived: false,
    currency: 'GBP',
  },
  {
    id: 2,
    name: 'Business Budget',
    description: 'Business expenses and income',
    budgetItems: [
      { id: 9, title: 'Client Payment', type: 'income', amount: 2000, paid: true, recurring: 'none', createdAt: new Date(), order: 1 },
      { id: 10, title: 'Office Rent', type: 'expense', amount: 500, paid: true, recurring: 'monthly', createdAt: new Date(), order: 2 },
      { id: 11, title: 'Software Subscriptions', type: 'expense', amount: 200, paid: false, recurring: 'monthly', createdAt: new Date(), order: 3 },
    ],
    createdAt: new Date(),
    lastModified: new Date(),
    color: defaultColors[1],
    isArchived: false,
    currency: 'GBP',
  },
];

// Helper functions for filtering
const filterByText = (items: BudgetItem[], search: string, fields: (keyof BudgetItem)[]): BudgetItem[] => {
  if (!search) return items;
  const searchLower = search.toLowerCase();
  return items.filter(item =>
    fields.some(field => String(item[field]).toLowerCase().includes(searchLower))
  );
};

const filterByProperty = <T, K extends keyof T>(items: T[], key: K, value: T[K]): T[] => {
  return items.filter(item => item[key] === value);
};

const filterByNumericRange = <T>(items: T[], key: keyof T, min: number, max: number): T[] => {
  return items.filter(item => {
    const value = Number(item[key]);
    return value >= min && value <= max;
  });
};

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      // Initial state
      budgetLists: defaultBudgetLists,
      currentListId: null,
      filters: {
        search: '',
        type: 'all',
        paidStatus: 'all',
        recurring: 'all',
        minAmount: 0,
        maxAmount: 10000,
      },
      sortConfig: {
        key: null,
        direction: 'asc',
      },
      showForm: false,
      editingItem: null,
      editForm: {
        title: '',
        type: 'expense',
        amount: 0,
        recurring: 'none',
      },
      newItem: {
        title: '',
        type: 'expense',
        amount: 0,
        recurring: 'none',
      },

      // Budget list management
      createBudgetList: (name: string, description: string, color?: string, currency = 'GBP') => {
        const newList: BudgetList = {
          id: Math.max(...get().budgetLists.map(list => list.id), 0) + 1,
          name,
          description,
          budgetItems: [],
          createdAt: new Date(),
          lastModified: new Date(),
          color: color || defaultColors[get().budgetLists.length % defaultColors.length],
          isArchived: false,
          currency,
        };
        set(state => ({
          budgetLists: [...state.budgetLists, newList],
          currentListId: newList.id,
        }));
      },

      deleteBudgetList: (id: number) => {
        set(state => ({
          budgetLists: state.budgetLists.filter(list => list.id !== id),
          currentListId: state.currentListId === id ? null : state.currentListId,
        }));
      },

      updateBudgetList: (id: number, updates: Partial<Pick<BudgetList, 'name' | 'description' | 'color' | 'isArchived' | 'currency'>>) => {
        set(state => ({
          budgetLists: state.budgetLists.map(list =>
            list.id === id
              ? { ...list, ...updates, lastModified: new Date() }
              : list
          ),
        }));
      },

      setCurrentList: (id: number | null) => {
        set({ currentListId: id });
      },

      // Budget item actions (within a list)
      addBudgetItem: (listId: number) => {
        const { newItem } = get();
        if (newItem.title && newItem.amount > 0) {
          const list = get().budgetLists.find(l => l.id === listId);
          if (!list) return;

          const maxOrder = Math.max(...list.budgetItems.map(item => item.order), 0);
          const item: BudgetItem = {
            id: Math.max(...list.budgetItems.map(item => item.id), 0) + 1,
            title: newItem.title,
            type: newItem.type,
            amount: newItem.amount,
            paid: false,
            recurring: newItem.recurring,
            createdAt: new Date(),
            order: maxOrder + 1
          };

          set(state => ({
            budgetLists: state.budgetLists.map(list =>
              list.id === listId
                ? {
                  ...list,
                  budgetItems: [...list.budgetItems, item],
                  lastModified: new Date(),
                }
                : list
            ),
            showForm: false,
          }));
          get().resetNewItem();
        }
      },

      updateBudgetItem: (listId: number, id: number, updates: Partial<BudgetItem>) => {
        set(state => ({
          budgetLists: state.budgetLists.map(list =>
            list.id === listId
              ? {
                ...list,
                budgetItems: list.budgetItems.map(item =>
                  item.id === id ? { ...item, ...updates } : item
                ),
                lastModified: new Date(),
              }
              : list
          ),
        }));
      },

      deleteBudgetItem: (listId: number, id: number) => {
        set(state => ({
          budgetLists: state.budgetLists.map(list =>
            list.id === listId
              ? {
                ...list,
                budgetItems: list.budgetItems.filter(item => item.id !== id),
                lastModified: new Date(),
              }
              : list
          ),
        }));
      },

      togglePaid: (listId: number, id: number) => {
        set(state => ({
          budgetLists: state.budgetLists.map(list =>
            list.id === listId
              ? {
                ...list,
                budgetItems: list.budgetItems.map(item =>
                  item.id === id ? { ...item, paid: !item.paid } : item
                ),
                lastModified: new Date(),
              }
              : list
          ),
        }));
      },

      reorderItems: (listId: number, items: BudgetItem[]) => {
        const updatedItems = items.map((item, index) => ({
          ...item,
          order: index + 1
        }));
        set(state => ({
          budgetLists: state.budgetLists.map(list =>
            list.id === listId
              ? {
                ...list,
                budgetItems: updatedItems,
                lastModified: new Date(),
              }
              : list
          ),
        }));
      },

      clearAllItemsInList: (listId: number) => {
        set(state => ({
          budgetLists: state.budgetLists.map(list =>
            list.id === listId
              ? {
                ...list,
                budgetItems: [],
                lastModified: new Date(),
              }
              : list
          ),
        }));
      },

      resetToDefaults: () => {
        set({
          budgetLists: defaultBudgetLists,
          currentListId: null,
          filters: {
            search: '',
            type: 'all',
            paidStatus: 'all',
            recurring: 'all',
            minAmount: 0,
            maxAmount: 10000,
          },
          sortConfig: { key: null, direction: 'asc' },
          showForm: false,
          editingItem: null,
        });
        get().resetNewItem();
        get().cancelEditing();
      },

      clearAllData: () => {
        set({
          budgetLists: [],
          currentListId: null,
          filters: {
            search: '',
            type: 'all',
            paidStatus: 'all',
            recurring: 'all',
            minAmount: 0,
            maxAmount: 10000,
          },
          sortConfig: { key: null, direction: 'asc' },
          showForm: false,
          editingItem: null,
        });
        get().resetNewItem();
        get().cancelEditing();
      },

      // Filter actions
      setFilters: (newFilters: Partial<BudgetState['filters']>) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      clearFilters: () => {
        set({
          filters: {
            search: '',
            type: 'all',
            paidStatus: 'all',
            recurring: 'all',
            minAmount: 0,
            maxAmount: 10000,
          },
        });
      },

      // Sort actions
      setSortConfig: (config: BudgetState['sortConfig']) => {
        set({ sortConfig: config });
      },

      // Form actions
      setShowForm: (show: boolean) => {
        set({ showForm: show });
        if (show) {
          get().cancelEditing();
        }
      },

      setNewItem: (item: Partial<BudgetState['newItem']>) => {
        set(state => ({
          newItem: { ...state.newItem, ...item },
        }));
      },

      resetNewItem: () => {
        set({
          newItem: {
            title: '',
            type: 'expense',
            amount: 0,
            recurring: 'none',
          },
        });
      },

      // Edit actions
      startEditing: (item: BudgetItem) => {
        set({
          showForm: false,
          editingItem: item.id,
          editForm: {
            title: item.title,
            type: item.type,
            amount: item.amount,
            recurring: item.recurring,
          },
        });
      },

      cancelEditing: () => {
        set({
          editingItem: null,
          editForm: {
            title: '',
            type: 'expense',
            amount: 0,
            recurring: 'none',
          },
        });
      },

      saveEditedItem: (listId: number, id: number) => {
        const { editForm } = get();
        if (editForm.title && editForm.amount > 0) {
          get().updateBudgetItem(listId, id, {
            title: editForm.title,
            type: editForm.type,
            amount: editForm.amount,
            recurring: editForm.recurring,
          });
          get().cancelEditing();
        }
      },

      setEditForm: (form: Partial<BudgetState['editForm']>) => {
        set(state => ({
          editForm: { ...state.editForm, ...form },
        }));
      },

      // Computed values
      getCurrentList: () => {
        const { budgetLists, currentListId } = get();
        return budgetLists.find(list => list.id === currentListId) || null;
      },

      getFilteredItems: (listId: number) => {
        const list = get().budgetLists.find(l => l.id === listId);
        if (!list) return [];

        const { filters, sortConfig } = get();
        let filteredItems = list.budgetItems;

        // Apply filters
        if (filters.search) {
          filteredItems = filterByText(filteredItems, filters.search, ['title']);
        }

        if (filters.type !== 'all') {
          filteredItems = filterByProperty(filteredItems, 'type', filters.type as BudgetItem['type']);
        }

        if (filters.paidStatus !== 'all') {
          const isPaid = filters.paidStatus === 'paid';
          filteredItems = filterByProperty(filteredItems, 'paid', isPaid);
        }

        if (filters.recurring !== 'all') {
          filteredItems = filterByProperty(filteredItems, 'recurring', filters.recurring as BudgetItem['recurring']);
        }

        filteredItems = filterByNumericRange(filteredItems, 'amount', filters.minAmount, filters.maxAmount);

        // Apply sorting
        if (sortConfig.key) {
          filteredItems.sort((a, b) => {
            const aValue = a[sortConfig.key!];
            const bValue = b[sortConfig.key!];

            let comparison = 0;

            if (sortConfig.key === 'amount') {
              comparison = (aValue as number) - (bValue as number);
            } else if (sortConfig.key === 'createdAt') {
              comparison = (aValue as Date).getTime() - (bValue as Date).getTime();
            } else if (sortConfig.key === 'paid') {
              comparison = (aValue as boolean) === (bValue as boolean) ? 0 : (aValue as boolean) ? 1 : -1;
            } else if (sortConfig.key === 'order') {
              comparison = (aValue as number) - (bValue as number);
            } else {
              // String comparison for title, type, recurring
              comparison = String(aValue).localeCompare(String(bValue));
            }

            return sortConfig.direction === 'desc' ? -comparison : comparison;
          });
        } else {
          // Default sort by order when no sort is active
          filteredItems.sort((a, b) => a.order - b.order);
        }

        return filteredItems;
      },

      getTotals: (listId: number) => {
        const list = get().budgetLists.find(l => l.id === listId);
        if (!list) return { income: 0, expenses: 0, savings: 0, investments: 0, paid: 0, unpaid: 0 };

        const { budgetItems } = list;
        return {
          income: budgetItems.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0),
          expenses: budgetItems.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0),
          savings: budgetItems.filter(item => item.type === 'savings').reduce((sum, item) => sum + item.amount, 0),
          investments: budgetItems.filter(item => item.type === 'investment').reduce((sum, item) => sum + item.amount, 0),
          paid: budgetItems.filter(item => item.paid).reduce((sum, item) => sum + item.amount, 0),
          unpaid: budgetItems.filter(item => !item.paid).reduce((sum, item) => sum + item.amount, 0),
        };
      },

      getBalance: (listId: number) => {
        const totals = get().getTotals(listId);
        return totals.income - totals.expenses - totals.savings - totals.investments;
      },

      getRecentLists: () => {
        return get().budgetLists
          .filter(list => !list.isArchived)
          .slice()
          .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
          .slice(0, 5);
      },
    }),
    {
      name: 'budget-storage',
      storage: createJSONStorage(() => localStorage, {
        reviver: (key, value) => {
          // Convert ISO date strings back to Date objects
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
            return new Date(value);
          }
          return value;
        },
        replacer: (key, value) => {
          // Convert Date objects to ISO strings for storage
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        },
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.budgetLists && state.budgetLists.length > 0) {
            // Ensure order exists for backward compatibility
            state.budgetLists = state.budgetLists.map((list: any) => ({
              ...list,
              budgetItems: list.budgetItems?.map((item: any, index: number) => ({
                ...item,
                order: item.order ?? index + 1,
              })) || [],
            }));
          } else {
            // No persisted data found, use default budget lists
            state.budgetLists = defaultBudgetLists;
          }
        }
      },
    }
  )
);
