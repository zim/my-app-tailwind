import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
  // New properties
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  description?: string;
  order: number;
  updatedAt: Date;
  // Sub-todo properties
  parentId?: number; // If this todo is a sub-todo, this is the parent's id
  level: number; // 0 = top-level, 1 = sub-todo, 2 = sub-sub-todo, etc.
  isCollapsed?: boolean; // Whether sub-todos are collapsed
}

export interface TodoList {
  id: number;
  name: string;
  description: string;
  todos: Todo[];
  createdAt: Date;
  lastModified: Date;
  // New properties
  color: string;
  isArchived: boolean;
  sortBy: 'manual' | 'priority' | 'dueDate' | 'created' | 'alphabetical';
  showCompleted: boolean;
}

interface TodoState {
  // State
  todoLists: TodoList[];
  currentListId: number | null;

  // Todo list management
  createTodoList: (name: string, description: string, color?: string) => void;
  deleteTodoList: (id: number) => void;
  updateTodoList: (id: number, updates: Partial<Pick<TodoList, 'name' | 'description' | 'color' | 'isArchived' | 'sortBy' | 'showCompleted'>>) => void;
  setCurrentList: (id: number | null) => void;

  // Todo management within a list
  addTodo: (listId: number, text: string, priority?: 'low' | 'medium' | 'high' | 'urgent', dueDate?: Date, description?: string) => void;
  addSubTodo: (listId: number, parentId: number, text: string, priority?: 'low' | 'medium' | 'high' | 'urgent', dueDate?: Date, description?: string) => void;
  toggleTodo: (listId: number, todoId: number) => void;
  deleteTodo: (listId: number, todoId: number) => void;
  updateTodo: (listId: number, todoId: number, updates: Partial<Pick<Todo, 'text' | 'priority' | 'dueDate' | 'description' | 'order'>>) => void;
  clearCompleted: (listId: number) => void;
  reorderTodos: (listId: number, todoIds: number[]) => void;
  toggleCollapse: (listId: number, todoId: number) => void;

  // Computed values
  getCurrentList: () => TodoList | null;
  getTotalTodos: (listId: number) => number;
  getActiveTodos: (listId: number) => number;
  getCompletedTodos: (listId: number) => number;
  getRecentLists: () => TodoList[];
  getSortedTodos: (listId: number) => Todo[];
  getPriorityTodos: (listId: number, priority: 'low' | 'medium' | 'high' | 'urgent') => Todo[];
  getOverdueTodos: (listId: number) => Todo[];
}

// Default colors for lists
const defaultColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

// Priority colors for UI
export const priorityColors = {
  low: '#10B981',     // green
  medium: '#F59E0B',  // yellow
  high: '#F97316',    // orange
  urgent: '#EF4444'   // red
};

// Helper function to get priority badge color
export const getPriorityColor = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
  return priorityColors[priority];
};

// Migration function to upgrade legacy data
const migrateTodoData = (data: any) => {
  console.log('Migrating todo data:', data); // Debug log

  if (!data || !data.todoLists) {
    console.log('No existing data, using defaults');
    return { todoLists: defaultTodoLists, currentListId: null };
  }

  const migratedLists = data.todoLists.map((list: any) => {
    console.log('Migrating list:', list.name, 'with todos:', list.todos?.length || 0);

    return {
      ...list,
      // Add missing list properties with defaults
      color: list.color || defaultColors[0],
      isArchived: list.isArchived ?? false,
      sortBy: list.sortBy || 'manual',
      showCompleted: list.showCompleted ?? true,
      // Migrate todos in the list
      todos: list.todos?.map((todo: any) => {
        const migratedTodo = {
          ...todo,
          // Add missing todo properties with defaults
          priority: todo.priority || 'medium',
          dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
          description: todo.description || undefined,
          order: todo.order ?? 1,
          updatedAt: todo.updatedAt ? new Date(todo.updatedAt) : new Date(),
          createdAt: todo.createdAt ? new Date(todo.createdAt) : new Date(),
          // Add sub-todo properties with proper defaults
          parentId: todo.parentId || undefined,
          level: todo.level ?? 0, // Default to top-level if not specified
          isCollapsed: todo.isCollapsed ?? false,
        };
        console.log('Migrated todo:', migratedTodo.text, 'level:', migratedTodo.level);
        return migratedTodo;
      }) || [],
      createdAt: list.createdAt ? new Date(list.createdAt) : new Date(),
      lastModified: list.lastModified ? new Date(list.lastModified) : new Date(),
    };
  });

  const result = {
    todoLists: migratedLists,
    currentListId: data.currentListId || null,
  };

  console.log('Migration complete, result:', result);
  return result;
};

// Default todo lists
const defaultTodoLists: TodoList[] = [
  {
    id: 1,
    name: 'Personal Tasks',
    description: 'My personal todo list',
    todos: [
      {
        id: 1,
        text: 'Learn Next.js',
        completed: false,
        createdAt: new Date(),
        priority: 'high',
        order: 1,
        updatedAt: new Date(),
        description: 'Complete the Next.js tutorial and build a sample app',
        level: 0
      },
      {
        id: 11,
        text: 'Set up development environment',
        completed: true,
        createdAt: new Date(),
        priority: 'medium',
        order: 2,
        updatedAt: new Date(),
        level: 1,
        parentId: 1
      },
      {
        id: 12,
        text: 'Complete tutorial chapters',
        completed: false,
        createdAt: new Date(),
        priority: 'high',
        order: 3,
        updatedAt: new Date(),
        level: 1,
        parentId: 1
      },
      {
        id: 121,
        text: 'Chapter 1: Getting Started',
        completed: true,
        createdAt: new Date(),
        priority: 'medium',
        order: 4,
        updatedAt: new Date(),
        level: 2,
        parentId: 12
      },
      {
        id: 122,
        text: 'Chapter 2: Pages and Routing',
        completed: false,
        createdAt: new Date(),
        priority: 'medium',
        order: 5,
        updatedAt: new Date(),
        level: 2,
        parentId: 12
      },
      {
        id: 2,
        text: 'Build a todo app',
        completed: true,
        createdAt: new Date(),
        priority: 'medium',
        order: 6,
        updatedAt: new Date(),
        level: 0
      },
      {
        id: 3,
        text: 'Deploy to Vercel',
        completed: false,
        createdAt: new Date(),
        priority: 'medium',
        order: 7,
        updatedAt: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        level: 0
      },
    ],
    createdAt: new Date(),
    lastModified: new Date(),
    color: defaultColors[0],
    isArchived: false,
    sortBy: 'manual',
    showCompleted: true,
  },
  {
    id: 2,
    name: 'Work Projects',
    description: 'Tasks related to work',
    todos: [
      {
        id: 4,
        text: 'Review code',
        completed: false,
        createdAt: new Date(),
        priority: 'urgent',
        order: 1,
        updatedAt: new Date(),
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        level: 0
      },
      {
        id: 41,
        text: 'Review frontend changes',
        completed: false,
        createdAt: new Date(),
        priority: 'urgent',
        order: 2,
        updatedAt: new Date(),
        level: 1,
        parentId: 4
      },
      {
        id: 42,
        text: 'Review backend API',
        completed: false,
        createdAt: new Date(),
        priority: 'high',
        order: 3,
        updatedAt: new Date(),
        level: 1,
        parentId: 4
      },
      {
        id: 5,
        text: 'Update documentation',
        completed: false,
        createdAt: new Date(),
        priority: 'low',
        order: 4,
        updatedAt: new Date(),
        level: 0
      },
    ],
    createdAt: new Date(),
    lastModified: new Date(),
    color: defaultColors[1],
    isArchived: false,
    sortBy: 'priority',
    showCompleted: true,
  },
];

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
      // Initial state
      todoLists: defaultTodoLists,
      currentListId: null,

      // Todo list management
      createTodoList: (name: string, description: string, color?: string) => {
        const newList: TodoList = {
          id: Math.max(...get().todoLists.map(list => list.id), 0) + 1,
          name,
          description,
          todos: [],
          createdAt: new Date(),
          lastModified: new Date(),
          color: color || defaultColors[get().todoLists.length % defaultColors.length],
          isArchived: false,
          sortBy: 'manual',
          showCompleted: true,
        };
        set(state => ({
          todoLists: [...state.todoLists, newList],
          currentListId: newList.id,
        }));
      },

      deleteTodoList: (id: number) => {
        set(state => ({
          todoLists: state.todoLists.filter(list => list.id !== id),
          currentListId: state.currentListId === id ? null : state.currentListId,
        }));
      },

      updateTodoList: (id: number, updates: Partial<Pick<TodoList, 'name' | 'description' | 'color' | 'isArchived' | 'sortBy' | 'showCompleted'>>) => {
        set(state => ({
          todoLists: state.todoLists.map(list =>
            list.id === id
              ? { ...list, ...updates, lastModified: new Date() }
              : list
          ),
        }));
      },

      setCurrentList: (id: number | null) => {
        set({ currentListId: id });
      },

      // Todo management within a list
      addTodo: (listId: number, text: string, priority = 'medium' as const, dueDate?: Date, description?: string) => {
        if (!text.trim()) return;

        const list = get().todoLists.find(l => l.id === listId);
        const maxOrder = list ? Math.max(...list.todos.map(t => t.order), 0) : 0;

        const newTodo: Todo = {
          id: Date.now(),
          text: text.trim(),
          completed: false,
          createdAt: new Date(),
          priority,
          dueDate,
          description,
          order: maxOrder + 1,
          updatedAt: new Date(),
          level: 0, // Default to top-level todo
        };

        set(state => ({
          todoLists: state.todoLists.map(list =>
            list.id === listId
              ? {
                ...list,
                todos: [...list.todos, newTodo],
                lastModified: new Date(),
              }
              : list
          ),
        }));
      },

      addSubTodo: (listId: number, parentId: number, text: string, priority = 'medium' as const, dueDate?: Date, description?: string) => {
        if (!text.trim()) return;

        const list = get().todoLists.find(l => l.id === listId);
        if (!list) return;

        const parentTodo = list.todos.find(t => t.id === parentId);
        if (!parentTodo) return;

        const maxOrder = Math.max(...list.todos.map(t => t.order), 0);

        const newSubTodo: Todo = {
          id: Date.now(),
          text: text.trim(),
          completed: false,
          createdAt: new Date(),
          priority,
          dueDate,
          description,
          order: maxOrder + 1,
          updatedAt: new Date(),
          level: parentTodo.level + 1,
          parentId: parentId,
        };

        set(state => ({
          todoLists: state.todoLists.map(list =>
            list.id === listId
              ? {
                ...list,
                todos: [...list.todos, newSubTodo],
                lastModified: new Date(),
              }
              : list
          ),
        }));
      },

      toggleTodo: (listId: number, todoId: number) => {
        set(state => ({
          todoLists: state.todoLists.map(list =>
            list.id === listId
              ? {
                ...list,
                todos: list.todos.map(todo =>
                  todo.id === todoId
                    ? { ...todo, completed: !todo.completed }
                    : todo
                ),
                lastModified: new Date(),
              }
              : list
          ),
        }));
      },

      deleteTodo: (listId: number, todoId: number) => {
        set(state => ({
          todoLists: state.todoLists.map(list =>
            list.id === listId
              ? {
                ...list,
                // Delete the todo and all its children recursively
                todos: list.todos.filter(todo => {
                  // Helper function to check if todo is a descendant
                  const isDescendant = (todo: Todo, parentId: number): boolean => {
                    if (todo.id === parentId) return true;
                    if (todo.parentId === parentId) return true;
                    if (todo.parentId) {
                      const parent = list.todos.find(t => t.id === todo.parentId);
                      return parent ? isDescendant(parent, parentId) : false;
                    }
                    return false;
                  };
                  return !isDescendant(todo, todoId);
                }),
                lastModified: new Date(),
              }
              : list
          ),
        }));
      },

      updateTodo: (listId: number, todoId: number, updates: Partial<Pick<Todo, 'text' | 'priority' | 'dueDate' | 'description' | 'order'>>) => {
        set(state => ({
          todoLists: state.todoLists.map(list =>
            list.id === listId
              ? {
                ...list,
                todos: list.todos.map(todo =>
                  todo.id === todoId
                    ? { ...todo, ...updates, updatedAt: new Date() }
                    : todo
                ),
                lastModified: new Date(),
              }
              : list
          ),
        }));
      },

      clearCompleted: (listId: number) => {
        set(state => ({
          todoLists: state.todoLists.map(list =>
            list.id === listId
              ? {
                ...list,
                todos: list.todos.filter(todo => !todo.completed),
                lastModified: new Date(),
              }
              : list
          ),
        }));
      },

      reorderTodos: (listId: number, todoIds: number[]) => {
        set(state => ({
          todoLists: state.todoLists.map(list =>
            list.id === listId
              ? {
                ...list,
                todos: list.todos.map(todo => {
                  const newOrder = todoIds.indexOf(todo.id) + 1;
                  return newOrder > 0 ? { ...todo, order: newOrder, updatedAt: new Date() } : todo;
                }),
                lastModified: new Date(),
              }
              : list
          ),
        }));
      },

      toggleCollapse: (listId: number, todoId: number) => {
        set(state => ({
          todoLists: state.todoLists.map(list =>
            list.id === listId
              ? {
                ...list,
                todos: list.todos.map(todo =>
                  todo.id === todoId
                    ? { ...todo, isCollapsed: !todo.isCollapsed, updatedAt: new Date() }
                    : todo
                ),
                lastModified: new Date(),
              }
              : list
          ),
        }));
      },

      // Computed values
      getCurrentList: () => {
        const { todoLists, currentListId } = get();
        return todoLists.find(list => list.id === currentListId) || null;
      },

      getTotalTodos: (listId: number) => {
        const list = get().todoLists.find(l => l.id === listId);
        return list ? list.todos.length : 0;
      },

      getActiveTodos: (listId: number) => {
        const list = get().todoLists.find(l => l.id === listId);
        return list ? list.todos.filter(todo => !todo.completed).length : 0;
      },

      getCompletedTodos: (listId: number) => {
        const list = get().todoLists.find(l => l.id === listId);
        return list ? list.todos.filter(todo => todo.completed).length : 0;
      },

      getRecentLists: () => {
        return get().todoLists
          .filter(list => !list.isArchived)
          .slice()
          .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
          .slice(0, 5);
      },

      getSortedTodos: (listId: number) => {
        const list = get().todoLists.find(l => l.id === listId);
        if (!list) {
          console.log('No list found for id:', listId);
          return [];
        }

        console.log('getSortedTodos called for list:', list.name, 'todos count:', list.todos.length);
        console.log('Raw todos:', list.todos.map(t => ({ id: t.id, text: t.text, level: t.level, parentId: t.parentId })));

        let todos = [...list.todos];

        // Filter completed todos if showCompleted is false
        if (!list.showCompleted) {
          todos = todos.filter(todo => !todo.completed);
          console.log('After filtering completed todos:', todos.length);
        }

        // Helper function to build hierarchical structure
        const buildHierarchy = (todos: Todo[]): Todo[] => {
          const result: Todo[] = [];
          const todoMap = new Map(todos.map(t => [t.id, t]));

          // First, add all top-level todos (level 0, no parent)
          const topLevel = todos.filter(t => (t.level === 0 || t.level === undefined) && !t.parentId);
          console.log('Top level todos:', topLevel.length, topLevel.map(t => t.text));

          // Then recursively add children
          const addChildren = (parentTodos: Todo[], currentLevel: number): Todo[] => {
            const hierarchical: Todo[] = [];

            for (const parent of parentTodos) {
              hierarchical.push(parent);

              // Find children of this parent
              const children = todos.filter(t => t.parentId === parent.id);
              console.log('Children for', parent.text, ':', children.length);

              // Only add children if parent is not collapsed
              if (!parent.isCollapsed && children.length > 0) {
                const sortedChildren = sortTodos(children, list.sortBy);
                hierarchical.push(...addChildren(sortedChildren, currentLevel + 1));
              }
            }

            return hierarchical;
          };

          const result_final = addChildren(sortTodos(topLevel, list.sortBy), 0);
          console.log('Final hierarchical result:', result_final.length, result_final.map(t => ({ text: t.text, level: t.level })));
          return result_final;
        };

        // Helper function to sort todos by the specified method
        const sortTodos = (todosToSort: Todo[], sortBy: string) => {
          switch (sortBy) {
            case 'priority':
              const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
              return todosToSort.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

            case 'dueDate':
              return todosToSort.sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return a.dueDate.getTime() - b.dueDate.getTime();
              });

            case 'created':
              return todosToSort.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            case 'alphabetical':
              return todosToSort.sort((a, b) => a.text.localeCompare(b.text));

            case 'manual':
            default:
              return todosToSort.sort((a, b) => a.order - b.order);
          }
        };

        return buildHierarchy(todos);
      },

      getPriorityTodos: (listId: number, priority: 'low' | 'medium' | 'high' | 'urgent') => {
        const list = get().todoLists.find(l => l.id === listId);
        return list ? list.todos.filter(todo => todo.priority === priority && !todo.completed) : [];
      },

      getOverdueTodos: (listId: number) => {
        const list = get().todoLists.find(l => l.id === listId);
        const now = new Date();
        return list ? list.todos.filter(todo =>
          todo.dueDate &&
          todo.dueDate < now &&
          !todo.completed
        ) : [];
      },
    }),
    {
      name: 'todo-storage',
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
      // Add migration to handle upgrading legacy data
      migrate: (persistedState: any, version: number) => {
        console.log('Migration called with version:', version, 'data:', persistedState);
        return migrateTodoData(persistedState);
      },
      version: 2, // Increased version to force migration
    }
  )
);
