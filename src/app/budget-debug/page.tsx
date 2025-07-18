'use client';

import { useEffect, useState } from 'react';
import { useBudgetStore } from '@/store/budgetStore';

export default function BudgetStorageDebugPage() {
  const [localStorageData, setLocalStorageData] = useState<string>('');
  const [hasHydrated, setHasHydrated] = useState(false);
  
  const { budgetItems, addBudgetItem, clearAllData, resetToDefaults } = useBudgetStore();

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('budget-storage');
      setLocalStorageData(data || 'No data found');
      
      // Mark as hydrated after a short delay
      setTimeout(() => setHasHydrated(true), 100);
    }
  }, []);

  const clearStorage = () => {
    localStorage.removeItem('budget-storage');
    window.location.reload();
  };

  const addTestItem = () => {
    // Manually create a test budget item using the store's internal structure
    const { newItem, setNewItem } = useBudgetStore.getState();
    setNewItem({
      title: 'Test Budget Item',
      type: 'income',
      amount: 1000,
      recurring: 'monthly'
    });
    addBudgetItem();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Budget Storage Debug Page</h1>
        
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

        {/* Current Budget Items */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Budget Items ({budgetItems.length})</h2>
          {budgetItems.length === 0 ? (
            <p className="text-gray-500">No budget items found</p>
          ) : (
            <div className="space-y-3">
              {budgetItems.map(item => (
                <div key={item.id} className="border border-gray-200 rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">{item.title}</h3>
                      <p className="text-sm text-gray-600">
                        {item.type} • ${item.amount.toLocaleString()} • {item.recurring}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.paid ? 'Paid' : 'Unpaid'} • Created: {item.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">ID: {item.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={addTestItem}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Test Item
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
                const data = localStorage.getItem('budget-storage');
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
                console.log('Budget Store State:', { budgetItems });
                console.log('LocalStorage:', localStorage.getItem('budget-storage'));
              }}
              className="block px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Log State to Console
            </button>
            <button
              onClick={resetToDefaults}
              className="block px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              onClick={clearAllData}
              className="block px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Clear All Data
            </button>
            <button
              onClick={() => {
                const testData = {
                  state: {
                    budgetItems: [
                      {
                        id: 999,
                        title: 'Manual Test Item',
                        type: 'income',
                        amount: 5000,
                        paid: false,
                        recurring: 'monthly',
                        createdAt: new Date().toISOString(),
                        order: 1,
                      }
                    ],
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
                    editForm: { title: '', type: 'income', amount: 0, recurring: 'none' },
                    newItem: { title: '', type: 'income', amount: 0, recurring: 'none' },
                  },
                  version: 0,
                };
                localStorage.setItem('budget-storage', JSON.stringify(testData));
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
