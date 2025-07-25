'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTodoStore } from '@/store/todoStore';
import { useHydration } from '@/hooks/useHydration';
import Modal from '@/components/Modal';

function TodosContent() {
  const isHydrated = useHydration();
  const {
    todoLists,
    createTodoList,
    deleteTodoList,
    setCurrentList,
    getTotalTodos,
    getActiveTodos,
    getCompletedTodos,
    getRecentLists
  } = useTodoStore();

  const [showForm, setShowForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListColor, setNewListColor] = useState('#3B82F6');
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showRecentLists, setShowRecentLists] = useState(false);

  const handleCreateList = () => {
    if (newListName.trim()) {
      createTodoList(newListName.trim(), newListDescription.trim(), newListColor);
      setNewListName('');
      setNewListDescription('');
      setNewListColor('#3B82F6');
      setShowForm(false);
    }
  };

  const handleResetData = () => {
    if (confirm('This will clear all todo data and reset to defaults. Are you sure?')) {
      localStorage.removeItem('todo-storage');
      window.location.reload();
    }
  };

  const handleDeleteList = (id: number, listName: string) => {
    if (confirm(`Are you sure you want to delete "${listName}"? This will permanently remove all todos in this list.`)) {
      deleteTodoList(id);
    }
  };

  const handleOpenList = (id: number) => {
    setCurrentList(id);
  };

  // Don't render content until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-300 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gray-800">
              Todo Lists
            </h1>
            <div className="px-4 py-2 bg-gray-200 text-gray-400 rounded-lg cursor-not-allowed">
              + New List
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  // Filter lists by search text
  const filteredLists = searchText
    ? todoLists.filter(list =>
      list.name.toLowerCase().includes(searchText.toLowerCase()) ||
      list.description.toLowerCase().includes(searchText.toLowerCase())
    )
    : todoLists;

  const recentLists = getRecentLists();

  return (
    <div className="min-h-screen bg-slate-300 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-8">
            <h1 className="text-4xl font-bold text-gray-800">
              Todo Lists
            </h1>
            {/* Stats overview - inline with title */}
            {todoLists.length > 0 && (
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <span className="text-gray-500">Lists:</span>
                  <span className="font-medium text-blue-600">{todoLists.length}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-gray-500">Total:</span>
                  <span className="font-medium text-green-600">
                    {todoLists.reduce((sum, list) => sum + getTotalTodos(list.id), 0)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-gray-500">Active:</span>
                  <span className="font-medium text-orange-600">
                    {todoLists.reduce((sum, list) => sum + getActiveTodos(list.id), 0)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-gray-500">Done:</span>
                  <span className="font-medium text-gray-700">
                    {todoLists.reduce((sum, list) => sum + getCompletedTodos(list.id), 0)}
                  </span>
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              + New List
            </button>
            <button
              onClick={handleResetData}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              title="Reset all data to defaults"
            >
              Reset Data
            </button>
          </div>
        </div>

        {/* Search and View Controls */}
        <div className="mb-6 space-y-4">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search todo lists..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* View Mode Toggle */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                List
              </button>
            </div>
            <span className="text-sm text-gray-500">
              {filteredLists.length} {filteredLists.length === 1 ? 'list' : 'lists'}
            </span>
          </div>
        </div>

        {/* Create New Todo List Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setNewListName('');
            setNewListDescription('');
            setNewListColor('#3B82F6');
          }}
          title="Create New Todo List"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="List name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              value={newListDescription}
              onChange={(e) => setNewListDescription(e.target.value)}
              placeholder="Description (optional)..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Color picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">List Color</label>
              <div className="flex gap-2">
                {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280', '#F97316'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewListColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${newListColor === color ? 'border-gray-800 scale-110' : 'border-gray-300 hover:scale-105'
                      }`}
                    style={{ backgroundColor: color }}
                    title={`Select ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleCreateList}
                disabled={!newListName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Create List
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setNewListName('');
                  setNewListDescription('');
                  setNewListColor('#3B82F6');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>



        {/* Recent lists section */}
        {recentLists.length > 0 && !searchText && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Recently Modified</h2>
              <button
                onClick={() => setShowRecentLists(!showRecentLists)}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <span>{showRecentLists ? 'Hide' : 'Show'}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showRecentLists ? 'rotate-180' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {showRecentLists && (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentLists.slice(0, 3).map((list) => (
                      <Link
                        key={list.id}
                        href={`/todos/list/${list.id}`}
                        onClick={() => handleOpenList(list.id)}
                        className="bg-white rounded-lg shadow-md p-4 border-l-4 hover:shadow-xl hover:bg-gray-50 hover:scale-105 transition-all duration-300 cursor-pointer block"
                        style={{ borderLeftColor: list.color }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg text-gray-800 truncate">{list.name}</h3>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteList(list.id, list.name);
                            }}
                            className="text-red-500 hover:text-red-700 text-sm p-1 hover:bg-red-50 rounded"
                            title="Delete list"
                          >
                            ✕
                          </button>
                        </div>
                        {list.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{list.description}</p>
                        )}
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex gap-4 text-sm">
                            <span className="text-blue-600 font-medium">{getTotalTodos(list.id)} total</span>
                            <span className="text-green-600">{getCompletedTodos(list.id)} done</span>
                            <span className="text-orange-600">{getActiveTodos(list.id)} active</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          Modified: {list.lastModified.toLocaleDateString()}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="divide-y divide-gray-200">
                      {recentLists.slice(0, 5).map((list) => (
                        <Link
                          key={list.id}
                          href={`/todos/list/${list.id}`}
                          onClick={() => handleOpenList(list.id)}
                          className="p-4 hover:bg-gray-50 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-l-4 block cursor-pointer"
                          style={{ borderLeftColor: list.color }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-lg text-gray-800 truncate">{list.name}</h3>
                                  {list.description && (
                                    <p className="text-gray-600 text-sm truncate mt-1">{list.description}</p>
                                  )}
                                </div>

                                <div className="flex items-center gap-6 text-sm">
                                  <div className="flex gap-4">
                                    <span className="text-blue-600 font-medium">{getTotalTodos(list.id)} total</span>
                                    <span className="text-green-600">{getCompletedTodos(list.id)} done</span>
                                    <span className="text-orange-600">{getActiveTodos(list.id)} active</span>
                                  </div>

                                  <div className="text-xs text-gray-500 hidden sm:block">
                                    Modified: {list.lastModified.toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteList(list.id, list.name);
                                }}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete list"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* All todo lists */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {searchText ? 'Search Results' : 'All Todo Lists'}
          </h2>

          {filteredLists.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-gray-500">
                {searchText ? (
                  <p>No todo lists match your search.</p>
                ) : (
                  <div>
                    <p className="mb-4">You haven't created any todo lists yet.</p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Create Your First List
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLists.map((list) => (
                <Link
                  key={list.id}
                  href={`/todos/list/${list.id}`}
                  onClick={() => handleOpenList(list.id)}
                  className="bg-gray-50 rounded-lg shadow-sm p-6 hover:shadow-xl hover:bg-white hover:scale-105 transition-all duration-300 border-l-4 cursor-pointer block border border-gray-200"
                  style={{ borderLeftColor: list.color }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-xl text-gray-800 truncate">{list.name}</h3>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteList(list.id, list.name);
                      }}
                      className="text-red-500 hover:text-red-700 text-sm p-1 hover:bg-red-50 rounded"
                      title="Delete list"
                    >
                      ✕
                    </button>
                  </div>

                  {list.description && (
                    <p className="text-gray-600 mb-4 line-clamp-3">{list.description}</p>
                  )}

                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-4 text-sm">
                      <span className="text-blue-600 font-medium">{getTotalTodos(list.id)} total</span>
                      <span className="text-green-600">{getCompletedTodos(list.id)} done</span>
                      <span className="text-orange-600">{getActiveTodos(list.id)} active</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    Created: {list.createdAt.toLocaleDateString()}
                    <br />
                    Modified: {list.lastModified.toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
              <div className="divide-y divide-gray-200">
                {filteredLists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/todos/list/${list.id}`}
                    onClick={() => handleOpenList(list.id)}
                    className="p-4 hover:bg-white hover:shadow-lg hover:scale-[1.02] transition-all duration-300 block cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-gray-800 truncate">{list.name}</h3>
                            {list.description && (
                              <p className="text-gray-600 text-sm truncate mt-1">{list.description}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex gap-4">
                              <span className="text-blue-600 font-medium">{getTotalTodos(list.id)} total</span>
                              <span className="text-green-600">{getCompletedTodos(list.id)} done</span>
                              <span className="text-orange-600">{getActiveTodos(list.id)} active</span>
                            </div>

                            <div className="text-xs text-gray-500 hidden sm:block">
                              Modified: {list.lastModified.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteList(list.id, list.name);
                          }}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete list"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TodosHomePage() {
  return <TodosContent />;
}
