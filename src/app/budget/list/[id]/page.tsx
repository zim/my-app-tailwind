'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useBudgetStore, type BudgetItem } from '@/store/budgetStore';
import { useHydration } from '@/hooks/useHydration';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Modal Component
function AddItemModal({
    isOpen,
    onClose,
    newItem,
    setNewItem,
    onAddItem,
    currency
}: {
    isOpen: boolean;
    onClose: () => void;
    newItem: any;
    setNewItem: (item: any) => void;
    onAddItem: () => void;
    currency: string;
}) {
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItem.title.trim()) {
            onAddItem();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
                <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Add Budget Item</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Item Title
                            </label>
                            <input
                                type="text"
                                placeholder="Enter item title"
                                value={newItem.title}
                                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type
                                </label>
                                <select
                                    value={newItem.type}
                                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value as BudgetItem['type'] })}
                                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                                >
                                    <option value="income">💰 Income</option>
                                    <option value="expense">💳 Expense</option>
                                    <option value="savings">🏦 Savings</option>
                                    <option value="investment">📈 Investment</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount ({currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'})
                                </label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={newItem.amount || ''}
                                    onChange={(e) => setNewItem({ ...newItem, amount: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Recurring
                            </label>
                            <select
                                value={newItem.recurring}
                                onChange={(e) => setNewItem({ ...newItem, recurring: e.target.value as BudgetItem['recurring'] })}
                                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                            >
                                <option value="none">⚪ One-time</option>
                                <option value="monthly">🗓️ Monthly</option>
                                <option value="annual">📅 Annual</option>
                            </select>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
                            >
                                Add Item
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Type configurations
const typeConfig = {
    income: { color: 'bg-green-500', textColor: 'text-green-700', icon: '💰' },
    expense: { color: 'bg-red-500', textColor: 'text-red-700', icon: '💳' },
    savings: { color: 'bg-blue-500', textColor: 'text-blue-700', icon: '🏦' },
    investment: { color: 'bg-purple-500', textColor: 'text-purple-700', icon: '📈' }
};

// Sortable Row Component
function SortableTableRow({
    item,
    editingItem,
    editForm,
    setEditForm,
    togglePaid,
    startEditing,
    cancelEditing,
    saveEditedItem,
    deleteBudgetItem,
    listId
}: {
    item: BudgetItem;
    editingItem: number | null;
    editForm: any;
    setEditForm: (form: any) => void;
    togglePaid: (listId: number, id: number) => void;
    startEditing: (item: BudgetItem) => void;
    cancelEditing: () => void;
    saveEditedItem: (listId: number, id: number) => void;
    deleteBudgetItem: (listId: number, id: number) => void;
    listId: number;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const config = typeConfig[item.type];
    const isEditing = editingItem === item.id;

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={`hover:bg-gray-50 ${isDragging ? 'shadow-lg z-10' : ''}`}
        >
            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div className="flex items-center">
                    {/* Drag Handle */}
                    <button
                        {...attributes}
                        {...listeners}
                        className="mr-2 sm:mr-3 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing focus:outline-none"
                        title="Drag to reorder"
                    >
                        ⋮⋮
                    </button>
                    <span className="text-base sm:text-xl mr-2 sm:mr-3">{config.icon}</span>
                    <div className="min-w-[100px] sm:min-w-[120px] flex items-center align-middle">
                        {isEditing ? (
                            <input
                                type="text"
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                className="text-xs sm:text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full min-h-[24px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        ) : (
                            <div className="min-h-[24px] flex flex-col justify-center">
                                <div className="text-xs sm:text-sm font-medium text-gray-900">
                                    {item.title}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div className="min-w-[60px] sm:min-w-[80px] min-h-[28px] flex items-center">
                    {isEditing ? (
                        <select
                            value={editForm.type}
                            onChange={(e) => setEditForm({ ...editForm, type: e.target.value as BudgetItem['type'] })}
                            className="text-xs font-medium border border-gray-300 rounded px-2 py-1 w-full min-h-[28px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                            <option value="savings">Savings</option>
                            <option value="investment">Investment</option>
                        </select>
                    ) : (
                        <span className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} text-white min-h-[28px]`}>
                            {item.type}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div className="min-w-[60px] sm:min-w-[80px] min-h-[24px] flex items-center">
                    {isEditing ? (
                        <input
                            type="number"
                            value={editForm.amount || ''}
                            onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                            className="text-xs sm:text-sm font-medium border border-gray-300 rounded px-2 py-1 w-full min-h-[24px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    ) : (
                        <div className={`text-xs sm:text-sm font-medium ${config.textColor}`}>
                            £{item.amount.toLocaleString()}
                        </div>
                    )}
                </div>
            </td>
            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                <div className="min-w-[70px] sm:min-w-[90px] min-h-[28px] flex items-center">
                    {isEditing ? (
                        <select
                            value={editForm.recurring}
                            onChange={(e) => setEditForm({ ...editForm, recurring: e.target.value as BudgetItem['recurring'] })}
                            className="text-xs font-medium border border-gray-300 rounded px-2 py-1 w-full min-h-[28px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="none">One-time</option>
                            <option value="monthly">Monthly</option>
                            <option value="annual">Annual</option>
                        </select>
                    ) : (
                        <span className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium min-h-[28px] ${item.recurring === 'monthly' ? 'bg-blue-100 text-blue-800' :
                            item.recurring === 'annual' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {item.recurring === 'monthly' ? '🗓️ Monthly' :
                                item.recurring === 'annual' ? '📅 Annual' :
                                    '⚪ One-time'}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                <div className="min-w-[60px] sm:min-w-[80px] min-h-[28px] flex items-center">
                    <button
                        onClick={() => togglePaid(listId, item.id)}
                        disabled={isEditing}
                        className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors min-h-[28px] ${item.paid
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {item.paid ? '✅ Paid' : '⏳ Unpaid'}
                    </button>
                </div>
            </td>
            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                {item.createdAt.toLocaleDateString()}
            </td>
            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                <div className="flex gap-1 sm:gap-2 min-w-[100px] sm:min-w-[120px] min-h-[28px] items-center">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => saveEditedItem(listId, item.id)}
                                className="text-green-600 hover:text-green-900 transition-colors flex items-center text-xs sm:text-sm"
                            >
                                💾 <span className="hidden sm:inline ml-1">Save</span>
                            </button>
                            <button
                                onClick={cancelEditing}
                                className="text-gray-600 hover:text-gray-900 transition-colors flex items-center text-xs sm:text-sm"
                            >
                                ❌ <span className="hidden sm:inline ml-1">Cancel</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => startEditing(item)}
                                className="text-blue-600 hover:text-blue-900 transition-colors flex items-center text-xs sm:text-sm"
                            >
                                ✏️ <span className="hidden sm:inline ml-1">Edit</span>
                            </button>
                            <button
                                onClick={() => deleteBudgetItem(listId, item.id)}
                                className="text-red-600 hover:text-red-900 transition-colors flex items-center text-xs sm:text-sm"
                            >
                                🗑️ <span className="hidden sm:inline ml-1">Delete</span>
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}

export default function BudgetListPage() {
    const params = useParams();
    const router = useRouter();
    const listId = parseInt(params.id as string);
    const isHydrated = useHydration();

    // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
    const {
        getCurrentList,
        addBudgetItem,
        updateBudgetItem,
        deleteBudgetItem,
        togglePaid,
        clearAllItemsInList,
        updateBudgetList,
        deleteBudgetList,
        getFilteredItems,
        getTotals,
        getBalance,
        reorderItems,
        // Filter and form state
        filters,
        setFilters,
        clearFilters,
        sortConfig,
        setSortConfig,
        showForm,
        setShowForm,
        newItem,
        setNewItem,
        resetNewItem,
        // Edit state
        editingItem,
        editForm,
        setEditForm,
        startEditing,
        cancelEditing,
        saveEditedItem,
    } = useBudgetStore();

    // Local state for list editing
    const [isEditingListInfo, setIsEditingListInfo] = useState(false);
    const [listName, setListName] = useState('');
    const [listDescription, setListDescription] = useState('');
    const [listColor, setListColor] = useState('#3B82F6');
    const [listCurrency, setListCurrency] = useState('GBP');

    // Get current list
    const currentList = getCurrentList();

    // Get computed values (always call these hooks, but handle null currentList)
    const filteredItems = isHydrated && currentList ? getFilteredItems(listId) : [];
    const totals = isHydrated && currentList ? getTotals(listId) : { income: 0, expenses: 0, savings: 0, investments: 0, paid: 0, unpaid: 0 };
    const balance = isHydrated && currentList ? getBalance(listId) : 0;

    // Drag and drop sensors - always initialize
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Wait for hydration to complete before rendering content
    useEffect(() => {
        if (currentList) {
            setListName(currentList.name);
            setListDescription(currentList.description);
            setListColor(currentList.color);
            setListCurrency(currentList.currency);
        }
    }, [currentList]);

    // Redirect if list doesn't exist - only after hydration
    useEffect(() => {
        if (isHydrated && !currentList && listId) {
            router.push('/budget');
        }
    }, [isHydrated, currentList, listId, router]);

    // Don't render content until hydrated to prevent hydration mismatch
    if (!isHydrated) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex items-center justify-between mb-8">
                        <Link
                            href="/budget"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            ← Back to Budget Lists
                        </Link>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">Loading...</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <div className="text-gray-500">Loading budget list...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentList) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Budget List Not Found</h1>
                    <Link
                        href="/budget"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        ← Back to Budget Lists
                    </Link>
                </div>
            </div>
        );
    }

    const handleUpdateListInfo = () => {
        if (listName.trim()) {
            updateBudgetList(listId, {
                name: listName.trim(),
                description: listDescription.trim(),
                color: listColor,
                currency: listCurrency
            });
            setIsEditingListInfo(false);
        }
    };

    const handleDeleteList = () => {
        if (confirm(`Are you sure you want to delete "${currentList.name}"? This will permanently remove all budget items in this list.`)) {
            deleteBudgetList(listId);
            router.push('/budget');
        }
    };

    const handleAddBudgetItem = () => {
        if (newItem.title.trim()) {
            addBudgetItem(listId);
            setShowForm(false);
            resetNewItem();
        }
    };

    // Handle drag end
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = filteredItems.findIndex((item) => item.id === active.id);
            const newIndex = filteredItems.findIndex((item) => item.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const reorderedItems = arrayMove(filteredItems, oldIndex, newIndex);
                reorderItems(listId, reorderedItems);
                // Reset sort when manually reordering
                setSortConfig({ key: null, direction: 'asc' });
            }
        }
    };

    // Handle sorting
    const handleSort = (key: keyof BudgetItem) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Get sort icon for header
    const getSortIcon = (key: keyof BudgetItem) => {
        if (sortConfig.key !== key) {
            return '↕️'; // Default sort icon
        }
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    // Get header class based on sort status
    const getHeaderClass = (key: keyof BudgetItem) => {
        const baseClass = "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none transition-colors";
        if (sortConfig.key === key) {
            return `${baseClass} text-blue-600 bg-blue-50 hover:bg-blue-100`;
        }
        return `${baseClass} text-gray-500 hover:bg-gray-100`;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                    <Link
                        href="/budget"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-sm sm:text-base"
                    >
                        ← Back to Budget Lists
                    </Link>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setIsEditingListInfo(true)}
                            className="px-3 py-1 text-xs sm:text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                        >
                            Edit Info
                        </button>
                        <button
                            onClick={handleDeleteList}
                            className="px-3 py-1 text-xs sm:text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                            Delete List
                        </button>
                    </div>
                </div>

                {/* List header with editable info */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4" style={{ borderLeftColor: currentList?.color || '#3B82F6' }}>
                    {isEditingListInfo ? (
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={listName}
                                onChange={(e) => setListName(e.target.value)}
                                className="w-full text-2xl font-bold px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <textarea
                                value={listDescription}
                                onChange={(e) => setListDescription(e.target.value)}
                                placeholder="Add a description..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium text-gray-700">Color:</label>
                                    <input
                                        type="color"
                                        value={listColor}
                                        onChange={(e) => setListColor(e.target.value)}
                                        className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-500">{listColor}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium text-gray-700">Currency:</label>
                                    <select
                                        value={listCurrency}
                                        onChange={(e) => setListCurrency(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="GBP">GBP (£)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleUpdateListInfo}
                                    disabled={!listName.trim()}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditingListInfo(false);
                                        setListName(currentList.name);
                                        setListDescription(currentList.description);
                                        setListColor(currentList.color);
                                        setListCurrency(currentList.currency);
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">{currentList.name}</h1>
                            {currentList.description && (
                                <p className="text-gray-600 mb-4">{currentList.description}</p>
                            )}
                            <div className="flex gap-6 text-sm text-gray-500">
                                <span>{currentList.budgetItems.length} total items</span>
                                <span>Currency: {currentList.currency}</span>
                                <span>Last modified: {currentList.lastModified.toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                    <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Income</p>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                                    {currentList.currency === 'USD' ? '$' : currentList.currency === 'EUR' ? '€' : '£'}{totals.income.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-xl sm:text-2xl lg:text-3xl">💰</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Expenses</p>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">
                                    {currentList.currency === 'USD' ? '$' : currentList.currency === 'EUR' ? '€' : '£'}{totals.expenses.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-xl sm:text-2xl lg:text-3xl">💳</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Balance</p>
                                <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {currentList.currency === 'USD' ? '$' : currentList.currency === 'EUR' ? '€' : '£'}{balance.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-xl sm:text-2xl lg:text-3xl">{balance >= 0 ? '✅' : '⚠️'}</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Items</p>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-700">
                                    {isHydrated ? currentList.budgetItems.length : '...'}
                                </p>
                            </div>
                            <div className="text-xl sm:text-2xl lg:text-3xl">📊</div>
                        </div>
                    </div>
                </div>

                {/* Add New Item Button */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-800">Budget Items</h2>
                        <button
                            onClick={() => {
                                if (editingItem) {
                                    cancelEditing();
                                }
                                setShowForm(true);
                            }}
                            disabled={editingItem !== null}
                            className={`px-4 py-2 text-white rounded-lg transition-colors ${editingItem !== null
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                        >
                            + Add New Item
                        </button>
                    </div>
                </div>

                {/* Add Item Modal */}
                <AddItemModal
                    isOpen={showForm}
                    onClose={() => setShowForm(false)}
                    newItem={newItem}
                    setNewItem={setNewItem}
                    onAddItem={handleAddBudgetItem}
                    currency={currentList.currency}
                />

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Filters</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                        />
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                        >
                            <option value="all">All Types</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                            <option value="savings">Savings</option>
                            <option value="investment">Investment</option>
                        </select>
                        <select
                            value={filters.paidStatus}
                            onChange={(e) => setFilters({ ...filters, paidStatus: e.target.value })}
                            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                        >
                            <option value="all">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                        </select>
                        <select
                            value={filters.recurring}
                            onChange={(e) => setFilters({ ...filters, recurring: e.target.value })}
                            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                        >
                            <option value="all">All Recurring</option>
                            <option value="none">One-time</option>
                            <option value="monthly">Monthly</option>
                            <option value="annual">Annual</option>
                        </select>
                        <input
                            type="number"
                            placeholder="Min Amount"
                            value={filters.minAmount || ''}
                            onChange={(e) => setFilters({ ...filters, minAmount: parseFloat(e.target.value) || 0 })}
                            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                        />
                        <input
                            type="number"
                            placeholder="Max Amount"
                            value={filters.maxAmount || ''}
                            onChange={(e) => setFilters({ ...filters, maxAmount: parseFloat(e.target.value) || 10000 })}
                            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                        />
                    </div>
                </div>

                {/* Budget Items List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                            Budget Items {isHydrated ? `(${filteredItems.length})` : ''}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            💡 Click column headers to sort • {sortConfig.key ? 'Manual reordering disabled during sorting' : 'Drag the ⋮⋮ handle to reorder items manually'}
                        </p>
                    </div>

                    {filteredItems.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center text-gray-500">
                            No budget items match your current filters.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={filteredItems.map(item => item.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <table className="w-full min-w-[800px]">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th
                                                    className={getHeaderClass('title')}
                                                    onClick={() => handleSort('title')}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs sm:text-sm">Item</span>
                                                        <span className={sortConfig.key === 'title' ? 'text-blue-600' : 'text-gray-400'}>{getSortIcon('title')}</span>
                                                    </div>
                                                </th>
                                                <th
                                                    className={getHeaderClass('type')}
                                                    onClick={() => handleSort('type')}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs sm:text-sm">Type</span>
                                                        <span className={sortConfig.key === 'type' ? 'text-blue-600' : 'text-gray-400'}>{getSortIcon('type')}</span>
                                                    </div>
                                                </th>
                                                <th
                                                    className={getHeaderClass('amount')}
                                                    onClick={() => handleSort('amount')}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs sm:text-sm">Amount</span>
                                                        <span className={sortConfig.key === 'amount' ? 'text-blue-600' : 'text-gray-400'}>{getSortIcon('amount')}</span>
                                                    </div>
                                                </th>
                                                <th
                                                    className={`${getHeaderClass('recurring')} hidden sm:table-cell`}
                                                    onClick={() => handleSort('recurring')}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs sm:text-sm">Recurring</span>
                                                        <span className={sortConfig.key === 'recurring' ? 'text-blue-600' : 'text-gray-400'}>{getSortIcon('recurring')}</span>
                                                    </div>
                                                </th>
                                                <th
                                                    className={getHeaderClass('paid')}
                                                    onClick={() => handleSort('paid')}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs sm:text-sm">Status</span>
                                                        <span className={sortConfig.key === 'paid' ? 'text-blue-600' : 'text-gray-400'}>{getSortIcon('paid')}</span>
                                                    </div>
                                                </th>
                                                <th
                                                    className={`${getHeaderClass('createdAt')} hidden lg:table-cell`}
                                                    onClick={() => handleSort('createdAt')}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs sm:text-sm">Date</span>
                                                        <span className={sortConfig.key === 'createdAt' ? 'text-blue-600' : 'text-gray-400'}>{getSortIcon('createdAt')}</span>
                                                    </div>
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredItems.map((item) => (
                                                <SortableTableRow
                                                    key={item.id}
                                                    item={item}
                                                    listId={listId}
                                                    editingItem={editingItem}
                                                    editForm={editForm}
                                                    setEditForm={setEditForm}
                                                    togglePaid={togglePaid}
                                                    startEditing={startEditing}
                                                    cancelEditing={cancelEditing}
                                                    saveEditedItem={saveEditedItem}
                                                    deleteBudgetItem={deleteBudgetItem}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}
                </div>

                {/* Summary Stats */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Payment Status</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm sm:text-base text-gray-600">Paid Items</span>
                                <span className="font-medium text-green-600 text-sm sm:text-base">
                                    {currentList.currency === 'USD' ? '$' : currentList.currency === 'EUR' ? '€' : '£'}{totals.paid.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm sm:text-base text-gray-600">Unpaid Items</span>
                                <span className="font-medium text-red-600 text-sm sm:text-base">
                                    {currentList.currency === 'USD' ? '$' : currentList.currency === 'EUR' ? '€' : '£'}{totals.unpaid.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Category Breakdown</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm sm:text-base text-gray-600">💰 Income</span>
                                <span className="font-medium text-green-600 text-sm sm:text-base">
                                    {currentList.currency === 'USD' ? '$' : currentList.currency === 'EUR' ? '€' : '£'}{totals.income.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm sm:text-base text-gray-600">💳 Expenses</span>
                                <span className="font-medium text-red-600 text-sm sm:text-base">
                                    {currentList.currency === 'USD' ? '$' : currentList.currency === 'EUR' ? '€' : '£'}{totals.expenses.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm sm:text-base text-gray-600">🏦 Savings</span>
                                <span className="font-medium text-blue-600 text-sm sm:text-base">
                                    {currentList.currency === 'USD' ? '$' : currentList.currency === 'EUR' ? '€' : '£'}{totals.savings.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm sm:text-base text-gray-600">📈 Investments</span>
                                <span className="font-medium text-purple-600 text-sm sm:text-base">
                                    {currentList.currency === 'USD' ? '$' : currentList.currency === 'EUR' ? '€' : '£'}{totals.investments.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
