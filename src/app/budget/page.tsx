'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useBudgetStore, type BudgetList } from '@/store/budgetStore';
import { useHydration } from '@/hooks/useHydration';
import PageLoadingSkeleton from '@/components/PageLoadingSkeleton';

/**
 * Generates a random password with specified length
 * @param length - The length of the password
 * @returns A random password string
 */
const generatePassword = (length: number): string => {
  if (length < 8) {
    throw new Error('Password length must be at least 8 characters');
  }
  // Character set for the password
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  console.log(password);
  return password;
};


function BudgetContent() {
  const isHydrated = useHydration();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListColor, setNewListColor] = useState('#3B82F6');
  const [newListCurrency, setNewListCurrency] = useState('GBP');
  const [expandedRecentLists, setExpandedRecentLists] = useState<Set<number>>(new Set());

  const {
    budgetLists,
    createBudgetList,
    deleteBudgetList,
    setCurrentList,
    getRecentLists,
    resetToDefaults,
    clearAllData,
    getTotals,
    getBalance,
  } = useBudgetStore();

  const handleCreateList = () => {
    if (newListName.trim()) {
      createBudgetList(newListName.trim(), newListDescription.trim(), newListColor, newListCurrency);
      setNewListName('');
      setNewListDescription('');
      setNewListColor('#3B82F6');
      setNewListCurrency('GBP');
      setShowCreateForm(false);
    }
  };

  const handleDeleteList = (listId: number, listName: string) => {
    if (confirm(`Are you sure you want to delete "${listName}"? This will permanently remove all budget items in this list.`)) {
      deleteBudgetList(listId);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP':
      default: return '£';
    }
  };

  const getListSummary = (list: BudgetList) => {
    const totals = getTotals(list.id);
    const balance = getBalance(list.id);
    return { totals, balance };
  };

  const toggleRecentListExpansion = (listId: number) => {
    setExpandedRecentLists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(listId)) {
        newSet.delete(listId);
      } else {
        newSet.add(listId);
      }
      return newSet;
    });
  };

  const recentLists = isHydrated ? getRecentLists() : [];

  generatePassword(12);
  // generatePassword(4);

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="text-center flex-1 sm:flex-none">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
              Budget Lists
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              💾 Data automatically saved to your browser
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
            >
              Create Budget List
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset all data to defaults? This will delete all your current budget lists.')) {
                  resetToDefaults();
                }
              }}
              className="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              title="Reset to default budget lists"
            >
              🔄 Reset
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all budget data? This action cannot be undone.')) {
                  clearAllData();
                }
              }}
              className="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              title="Clear all budget data"
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* Create New Budget List Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Create New Budget List</h2>
            <div className="space-y-3 sm:space-y-4">
              <input
                type="text"
                placeholder="Budget list name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
              <textarea
                placeholder="Description (optional)"
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                rows={2}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Color:</label>
                  <input
                    type="color"
                    value={newListColor}
                    onChange={(e) => setNewListColor(e.target.value)}
                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-gray-500">{newListColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Currency:</label>
                  <select
                    value={newListCurrency}
                    onChange={(e) => setNewListCurrency(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={handleCreateList}
                  disabled={!newListName.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors text-sm sm:text-base"
                >
                  Create List
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewListName('');
                    setNewListDescription('');
                    setNewListColor('#3B82F6');
                    setNewListCurrency('GBP');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Budget Lists */}
        {recentLists.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">Recent Budget Lists</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {recentLists.map((list) => {
                const { totals, balance } = getListSummary(list);
                const currencySymbol = getCurrencySymbol(list.currency);
                const isExpanded = expandedRecentLists.has(list.id);

                return (
                  <div
                    key={list.id}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4"
                    style={{ borderLeftColor: list.color }}
                  >
                    <div className="p-4 sm:p-6">
                      {/* Title and expand/collapse button */}
                      <div className="flex items-center justify-between mb-3">
                        <Link
                          href={`/budget/list/${list.id}`}
                          onClick={() => setCurrentList(list.id)}
                          className="text-base sm:text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors truncate flex-1"
                        >
                          {list.name}
                        </Link>
                        <button
                          onClick={() => toggleRecentListExpansion(list.id)}
                          className="ml-2 p-1 text-gray-500 hover:text-gray-700 transition-colors"
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      </div>

                      {/* Expandable content */}
                      {isExpanded && (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-gray-500">{list.currency}</span>
                          </div>

                          {list.description && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{list.description}</p>
                          )}

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Items:</span>
                              <span className="font-medium">{list.budgetItems.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Balance:</span>
                              <span className={`font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {currencySymbol}{balance.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-green-600">+{currencySymbol}{totals.income.toLocaleString()}</span>
                              <span className="text-red-600">-{currencySymbol}{totals.expenses.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="mt-3 text-xs text-gray-500">
                            Modified: {list.lastModified.toLocaleDateString()}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Budget Lists */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
              All Budget Lists {isHydrated ? `(${budgetLists.length})` : ''}
            </h3>
          </div>

          {budgetLists.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-gray-500">
              <div className="text-4xl sm:text-6xl mb-4">💰</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Budget Lists Yet</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">Create your first budget list to start tracking your finances.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
              >
                Create Your First Budget List
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {budgetLists.map((list) => {
                const { totals, balance } = getListSummary(list);
                const currencySymbol = getCurrencySymbol(list.currency);

                return (
                  <div key={list.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                            style={{ backgroundColor: list.color }}
                          ></div>
                          <Link
                            href={`/budget/list/${list.id}`}
                            onClick={() => setCurrentList(list.id)}
                            className="text-lg sm:text-xl font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                          >
                            {list.name}
                          </Link>
                          {list.isArchived && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              Archived
                            </span>
                          )}
                        </div>
                        {list.description && (
                          <p className="text-gray-600 mb-3 text-sm sm:text-base">{list.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 sm:gap-6 text-xs sm:text-sm text-gray-500">
                          <span>{list.budgetItems.length} items</span>
                          <span>Currency: {list.currency}</span>
                          <span className="hidden sm:inline">Created: {list.createdAt.toLocaleDateString()}</span>
                          <span>Modified: {list.lastModified.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-row lg:flex-col items-center lg:items-end gap-4 lg:gap-2 lg:ml-6">
                        <div className="text-center lg:text-right">
                          <div className={`text-lg font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {currencySymbol}{balance.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">Balance</div>
                        </div>
                        <div className="flex gap-2 sm:gap-4 text-xs">
                          <div className="text-center">
                            <div className="text-green-600 font-medium">+{currencySymbol}{totals.income.toLocaleString()}</div>
                            <div className="text-gray-500">Income</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-600 font-medium">-{currencySymbol}{totals.expenses.toLocaleString()}</div>
                            <div className="text-gray-500">Expenses</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/budget/list/${list.id}`}
                            onClick={() => setCurrentList(list.id)}
                            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            Open
                          </Link>
                          <button
                            onClick={() => handleDeleteList(list.id, list.name)}
                            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Overall Summary */}
        {budgetLists.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-700">{budgetLists.length}</div>
                <div className="text-sm text-gray-500">Total Budget Lists</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-700">
                  {budgetLists.reduce((sum, list) => sum + list.budgetItems.length, 0)}
                </div>
                <div className="text-sm text-gray-500">Total Budget Items</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-700">
                  {budgetLists.filter(list => !list.isArchived).length}
                </div>
                <div className="text-sm text-gray-500">Active Lists</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BudgetPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <BudgetContent />
    </Suspense>
  );
}
