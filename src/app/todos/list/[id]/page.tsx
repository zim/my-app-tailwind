'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTodoStore, Todo, getPriorityColor } from '@/store/todoStore';
import { useHydration } from '@/hooks/useHydration';
import Modal from '@/components/Modal';

export default function TodoListPage() {
    const params = useParams();
    const router = useRouter();
    const listId = parseInt(params.id as string);
    const isHydrated = useHydration();

    const {
        getCurrentList,
        addTodo,
        addSubTodo,
        toggleTodo,
        deleteTodo,
        updateTodo,
        clearCompleted,
        updateTodoList,
        deleteTodoList,
        getActiveTodos,
        getCompletedTodos,
        getSortedTodos,
        getPriorityTodos,
        getOverdueTodos,
        toggleCollapse
    } = useTodoStore();

    const [newTodo, setNewTodo] = useState('');
    const [newTodoPriority, setNewTodoPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
    const [newTodoDueDate, setNewTodoDueDate] = useState('');
    const [newTodoDescription, setNewTodoDescription] = useState('');
    const [showAddTodoModal, setShowAddTodoModal] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [searchText, setSearchText] = useState('');
    const [editingTodo, setEditingTodo] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
    const [editDueDate, setEditDueDate] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [isEditingListInfo, setIsEditingListInfo] = useState(false);
    const [listName, setListName] = useState('');
    const [listDescription, setListDescription] = useState('');
    const [listColor, setListColor] = useState('#3B82F6');
    const [addingSubTodoFor, setAddingSubTodoFor] = useState<number | null>(null);
    const [newSubTodo, setNewSubTodo] = useState('');
    const [newSubTodoPriority, setNewSubTodoPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
    const [newSubTodoDueDate, setNewSubTodoDueDate] = useState('');
    const [newSubTodoDescription, setNewSubTodoDescription] = useState('');

    // Get current list
    const currentList = getCurrentList();

    // Wait for hydration to complete before rendering content
    useEffect(() => {
        if (currentList) {
            setListName(currentList.name);
            setListDescription(currentList.description);
            setListColor(currentList.color);
        }
    }, [currentList]);

    // Redirect if list doesn't exist - only after hydration
    useEffect(() => {
        if (isHydrated && !currentList && listId) {
            router.push('/todos');
        }
    }, [isHydrated, currentList, listId, router]);

    // Don't render content until hydrated to prevent hydration mismatch
    if (!isHydrated) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <Link
                            href="/todos"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            ← Back to Todo Lists
                        </Link>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">Loading...</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <div className="text-gray-500">Loading todo list...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentList) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Todo List Not Found</h1>
                    <Link
                        href="/todos"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        ← Back to Todo Lists
                    </Link>
                </div>
            </div>
        );
    }

    const handleAddTodo = () => {
        if (newTodo.trim()) {
            const dueDate = newTodoDueDate ? new Date(newTodoDueDate) : undefined;
            addTodo(listId, newTodo.trim(), newTodoPriority, dueDate, newTodoDescription.trim() || undefined);
            setNewTodo('');
            setNewTodoPriority('medium');
            setNewTodoDueDate('');
            setNewTodoDescription('');
            setShowAddTodoModal(false);
        }
    };

    const handleStartEdit = (todo: Todo) => {
        setEditingTodo(todo.id);
        setEditText(todo.text);
        setEditPriority(todo.priority || 'medium');
        setEditDueDate(todo.dueDate ? todo.dueDate.toISOString().split('T')[0] : '');
        setEditDescription(todo.description || '');
    };

    const handleSaveEdit = () => {
        if (editingTodo && editText.trim()) {
            const dueDate = editDueDate ? new Date(editDueDate) : undefined;
            updateTodo(listId, editingTodo, {
                text: editText.trim(),
                priority: editPriority,
                dueDate,
                description: editDescription.trim() || undefined
            });
            setEditingTodo(null);
            setEditText('');
            setEditPriority('medium');
            setEditDueDate('');
            setEditDescription('');
        }
    };

    const handleCancelEdit = () => {
        setEditingTodo(null);
        setEditText('');
        setEditPriority('medium');
        setEditDueDate('');
        setEditDescription('');
    };

    const handleToggleTodo = (todoId: number) => {
        toggleTodo(listId, todoId);
    };

    const handleDeleteTodo = (todoId: number) => {
        deleteTodo(listId, todoId);
    };

    const handleAddSubTodo = (parentId: number) => {
        if (newSubTodo.trim()) {
            const dueDate = newSubTodoDueDate ? new Date(newSubTodoDueDate) : undefined;
            addSubTodo(listId, parentId, newSubTodo.trim(), newSubTodoPriority, dueDate, newSubTodoDescription.trim() || undefined);
            setNewSubTodo('');
            setNewSubTodoPriority('medium');
            setNewSubTodoDueDate('');
            setNewSubTodoDescription('');
            setAddingSubTodoFor(null);
        }
    };

    const handleCancelSubTodo = () => {
        setAddingSubTodoFor(null);
        setNewSubTodo('');
        setNewSubTodoPriority('medium');
        setNewSubTodoDueDate('');
        setNewSubTodoDescription('');
    };

    const handleToggleCollapse = (todoId: number) => {
        toggleCollapse(listId, todoId);
    };

    const handleUpdateListInfo = () => {
        if (listName.trim()) {
            updateTodoList(listId, {
                name: listName.trim(),
                description: listDescription.trim(),
                color: listColor
            });
            setIsEditingListInfo(false);
        }
    };

    const handleDeleteList = () => {
        if (confirm(`Are you sure you want to delete "${currentList.name}"? This will permanently remove all todos in this list.`)) {
            deleteTodoList(listId);
            router.push('/todos');
        }
    };

    // Filter todos using the enhanced getSortedTodos method
    let filteredTodos = getSortedTodos(listId);

    // Filter by completion status
    if (filter === 'active') {
        filteredTodos = filteredTodos.filter(todo => !todo.completed);
    } else if (filter === 'completed') {
        filteredTodos = filteredTodos.filter(todo => todo.completed);
    }

    // Filter by search text
    if (searchText) {
        filteredTodos = filteredTodos.filter(todo =>
            todo.text.toLowerCase().includes(searchText.toLowerCase()) ||
            (todo.description && todo.description.toLowerCase().includes(searchText.toLowerCase()))
        );
    }

    const activeTodosCount = getActiveTodos(listId);
    const completedTodosCount = getCompletedTodos(listId);
    const urgentTodosCount = getPriorityTodos(listId, 'urgent').length;
    const overdueTodosCount = getOverdueTodos(listId).length;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link
                        href="/todos"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        ← Back to Todo Lists
                    </Link>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditingListInfo(true)}
                            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                        >
                            Edit Info
                        </button>
                        <button
                            onClick={handleDeleteList}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
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
                                <span>{currentList.todos.length} total todos</span>
                                <span>{activeTodosCount} active</span>
                                <span>{completedTodosCount} completed</span>
                                {urgentTodosCount > 0 && (
                                    <span className="text-red-600 font-medium">{urgentTodosCount} urgent</span>
                                )}
                                {overdueTodosCount > 0 && (
                                    <span className="text-red-600 font-medium">{overdueTodosCount} overdue</span>
                                )}
                                <span>Last modified: {currentList.lastModified.toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Add new todo button */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Quick Actions</h3>
                        <button
                            onClick={() => setShowAddTodoModal(true)}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                            Add New Todo
                        </button>
                    </div>
                </div>

                {/* Add New Todo Modal */}
                <Modal
                    isOpen={showAddTodoModal}
                    onClose={() => {
                        setShowAddTodoModal(false);
                        setNewTodo('');
                        setNewTodoPriority('medium');
                        setNewTodoDueDate('');
                        setNewTodoDescription('');
                    }}
                    title="Add New Todo"
                    maxWidth="lg"
                >
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                            placeholder="What needs to be done?"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select
                                    value={newTodoPriority}
                                    onChange={(e) => setNewTodoPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={newTodoDueDate}
                                    onChange={(e) => setNewTodoDueDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <textarea
                            value={newTodoDescription}
                            onChange={(e) => setNewTodoDescription(e.target.value)}
                            placeholder="Description (optional)..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />

                        <div className="flex gap-2 pt-4">
                            <button
                                onClick={handleAddTodo}
                                disabled={!newTodo.trim()}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                                Add Todo
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddTodoModal(false);
                                    setNewTodo('');
                                    setNewTodoPriority('medium');
                                    setNewTodoDueDate('');
                                    setNewTodoDescription('');
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Search and filters */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Search todos..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />

                        <div className="flex flex-col sm:flex-row gap-4 justify-between">
                            <div className="flex gap-2">
                                <span className="text-sm font-medium text-gray-700 self-center">Filter:</span>
                                {(['all', 'active', 'completed'] as const).map((filterType) => (
                                    <button
                                        key={filterType}
                                        onClick={() => setFilter(filterType)}
                                        className={`px-4 py-2 rounded-lg capitalize transition-colors ${filter === filterType
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {filterType}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <span className="text-sm font-medium text-gray-700 self-center">Sort:</span>
                                <select
                                    value={currentList?.sortBy || 'manual'}
                                    onChange={(e) => updateTodoList(listId, { sortBy: e.target.value as 'manual' | 'priority' | 'dueDate' | 'created' | 'alphabetical' })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="manual">Manual Order</option>
                                    <option value="priority">Priority</option>
                                    <option value="dueDate">Due Date</option>
                                    <option value="created">Created Date</option>
                                    <option value="alphabetical">Alphabetical</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Todo list */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {filteredTodos.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            {searchText ? 'No todos match your search.' : 'No todos yet. Add one above!'}
                        </div>
                    ) : (<ul className="divide-y divide-gray-200">
                        {filteredTodos.map((todo) => {
                            const isOverdue = todo.dueDate && todo.dueDate < new Date() && !todo.completed;
                            const isDueSoon = todo.dueDate && !todo.completed &&
                                todo.dueDate > new Date() &&
                                todo.dueDate <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // Due within 2 days

                            const hasChildren = currentList?.todos.some(t => t.parentId === todo.id);
                            const indentLevel = todo.level || 0;
                            const indentClass = `ml-${indentLevel * 8}`;

                            return (
                                <div key={todo.id}>
                                    <li className="p-4 hover:bg-gray-50 transition-colors" style={{ marginLeft: `${indentLevel * 2}rem` }}>
                                        {editingTodo === todo.id ? (
                                            <div className="space-y-4">
                                                <input
                                                    type="text"
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') handleSaveEdit();
                                                        if (e.key === 'Escape') handleCancelEdit();
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    autoFocus
                                                />

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                                        <select
                                                            value={editPriority}
                                                            onChange={(e) => setEditPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value="low">Low</option>
                                                            <option value="medium">Medium</option>
                                                            <option value="high">High</option>
                                                            <option value="urgent">Urgent</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                                        <input
                                                            type="date"
                                                            value={editDueDate}
                                                            onChange={(e) => setEditDueDate(e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>

                                                <textarea
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    placeholder="Description (optional)..."
                                                    rows={2}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    {/* Collapse/Expand button for todos with children */}
                                                    {hasChildren ? (
                                                        <button
                                                            onClick={() => handleToggleCollapse(todo.id)}
                                                            className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700"
                                                        >
                                                            {todo.isCollapsed ? '▶' : '▼'}
                                                        </button>
                                                    ) : (
                                                        <div className="w-5 h-5" /> // Spacer for alignment
                                                    )}

                                                    <input
                                                        type="checkbox"
                                                        checked={todo.completed}
                                                        onChange={() => handleToggleTodo(todo.id)}
                                                        className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                                                    />

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`font-medium cursor-pointer ${todo.completed
                                                                    ? 'text-gray-500 line-through'
                                                                    : 'text-gray-800'
                                                                    }`}
                                                                onClick={() => handleStartEdit(todo)}
                                                            >
                                                                {todo.text}
                                                            </span>

                                                            {/* Priority indicator */}
                                                            <span
                                                                className="px-2 py-1 text-xs font-medium rounded-full text-white"
                                                                style={{ backgroundColor: getPriorityColor(todo.priority || 'medium') }}
                                                            >
                                                                {(todo.priority || 'medium').toUpperCase()}
                                                            </span>

                                                            {/* Due date indicator */}
                                                            {todo.dueDate && (
                                                                <span className={`px-2 py-1 text-xs rounded-full ${isOverdue ? 'bg-red-100 text-red-800' :
                                                                    isDueSoon ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-gray-100 text-gray-600'
                                                                    }`}>
                                                                    {isOverdue ? 'Overdue' :
                                                                        isDueSoon ? 'Due Soon' :
                                                                            `Due ${todo.dueDate.toLocaleDateString()}`}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Description */}
                                                        {todo.description && (
                                                            <p className={`text-sm mt-1 ${todo.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {todo.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => setAddingSubTodoFor(todo.id)}
                                                            className="px-2 py-1 text-green-600 hover:bg-green-50 rounded text-sm"
                                                            title="Add sub-todo"
                                                        >
                                                            + Sub
                                                        </button>
                                                        <button
                                                            onClick={() => handleStartEdit(todo)}
                                                            className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTodo(todo.id)}
                                                            className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Todo metadata */}
                                                <div className="text-xs text-gray-400" style={{ marginLeft: '2rem' }}>
                                                    Created: {todo.createdAt.toLocaleDateString()} ·
                                                    Updated: {todo.updatedAt.toLocaleDateString()}
                                                </div>
                                            </div>
                                        )}
                                    </li>

                                    {/* Sub-todo creation form */}
                                    {addingSubTodoFor === todo.id && (
                                        <div className="bg-gray-50 p-4 border-l-4 border-blue-500" style={{ marginLeft: `${(indentLevel + 1) * 2}rem` }}>
                                            <h4 className="text-sm font-medium text-gray-700 mb-3">Add Sub-Todo</h4>
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    value={newSubTodo}
                                                    onChange={(e) => setNewSubTodo(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleAddSubTodo(todo.id)}
                                                    placeholder="Sub-todo description..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    autoFocus
                                                />

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                                                        <select
                                                            value={newSubTodoPriority}
                                                            onChange={(e) => setNewSubTodoPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value="low">Low</option>
                                                            <option value="medium">Medium</option>
                                                            <option value="high">High</option>
                                                            <option value="urgent">Urgent</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                                                        <input
                                                            type="date"
                                                            value={newSubTodoDueDate}
                                                            onChange={(e) => setNewSubTodoDueDate(e.target.value)}
                                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>

                                                <textarea
                                                    value={newSubTodoDescription}
                                                    onChange={(e) => setNewSubTodoDescription(e.target.value)}
                                                    placeholder="Description (optional)..."
                                                    rows={2}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAddSubTodo(todo.id)}
                                                        disabled={!newSubTodo.trim()}
                                                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 text-sm"
                                                    >
                                                        Add Sub-Todo
                                                    </button>
                                                    <button
                                                        onClick={handleCancelSubTodo}
                                                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </ul>
                    )}
                </div>

                {/* Footer */}
                {currentList.todos.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-4 mt-6">
                        <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>
                                {activeTodosCount} {activeTodosCount === 1 ? 'item' : 'items'} left
                            </span>
                            {completedTodosCount > 0 && (
                                <button
                                    onClick={() => clearCompleted(listId)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                    Clear completed ({completedTodosCount})
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

