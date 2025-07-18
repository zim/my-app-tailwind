'use client';

import { useEffect, useState } from 'react';
import { useTodoStore } from '@/store/todoStore';

export default function StorageDebugPage() {
  const [localStorageData, setLocalStorageData] = useState<string>('');
  const [hasHydrated, setHasHydrated] = useState(false);

  const { todoLists, createTodoList } = useTodoStore();

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('todo-storage');
      setLocalStorageData(data || 'No data found');

      // Mark as hydrated after a short delay
      setTimeout(() => setHasHydrated(true), 100);
    }
  }, []);

  const clearStorage = () => {
    localStorage.removeItem('todo-storage');
    window.location.reload();
  };

  const addTestList = () => {
    createTodoList('Test List', 'A test list created on ' + new Date().toLocaleString());
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Storage Debug Page</h1>

        {/* Hydration Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Hydration Status</h2>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${hasHydrated ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`font-medium ${hasHydrated ? 'text-green-700' : 'text-red-700'}`}>
              {hasHydrated ? 'Store has hydrated' : 'Store is hydrating...'}
            </span>
          </div>
        </div>

        {/* Current Todo Lists */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Todo Lists ({todoLists.length})</h2>
          {todoLists.length === 0 ? (
            <p className="text-gray-500">No todo lists found</p>
          ) : (
            <div className="space-y-3">
              {todoLists.map(list => (
                <div key={list.id} className="border border-gray-200 rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">{list.name}</h3>
                      <p className="text-sm text-gray-600">{list.description}</p>
                      <p className="text-xs text-gray-500">
                        {list.todos.length} todos • Created: {list.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">ID: {list.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={addTestList}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Test List
          </button>
        </div>

        {/* LocalStorage Data */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">LocalStorage Data</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-auto max-h-96">
              {localStorageData}
            </pre>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                const data = localStorage.getItem('todo-storage');
                setLocalStorageData(data || 'No data found');
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Refresh Data
            </button>
            <button
              onClick={clearStorage}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Clear Storage & Reload
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Actions</h2>
          <div className="space-y-2">
            <button
              onClick={() => {
                console.log('Todo Store State:', { todoLists });
                console.log('LocalStorage:', localStorage.getItem('todo-storage'));
              }}
              className="block px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Log State to Console
            </button>
            <button
              onClick={() => {
                const testData = {
                  state: {
                    todoLists: [
                      {
                        id: 999,
                        name: 'Manual Test List',
                        description: 'Added manually to test storage',
                        todos: [],
                        createdAt: new Date().toISOString(),
                        lastModified: new Date().toISOString(),
                      }
                    ],
                    currentListId: null,
                  },
                  version: 0,
                };
                localStorage.setItem('todo-storage', JSON.stringify(testData));
                window.location.reload();
              }}
              className="block px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Manually Set Test Data & Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
