'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTodoStore, Todo } from '@/store/todoStore';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function TodoListPage() {
    const params = useParams();
    const router = useRouter();
    const listId = parseInt(params.id as string);

    const {
        getCurrentList,
        addTodo,
        toggleTodo,
        deleteTodo,
        updateTodo,
        clearCompleted,
        updateTodoList,
        deleteTodoList,
        getActiveTodos,
        getCompletedTodos
    } = useTodoStore();

    const [newTodo, setNewTodo] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [searchText, setSearchText] = useState('');
    const [editingTodo, setEditingTodo] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const [isEditingListInfo, setIsEditingListInfo] = useState(false);
    const [listName, setListName] = useState('');
    const [listDescription, setListDescription] = useState('');

    // WebSocket for real-time collaboration
    const {
        isConnected,
        currentUser,
        activeUsers,
        typingUsers,
        sendTodoUpdate,
        sendTypingIndicator,
        onTodoUpdate
    } = useWebSocket(listId);

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Get current list
    const currentList = getCurrentList();

    useEffect(() => {
        if (currentList) {
            setListName(currentList.name);
            setListDescription(currentList.description);
        }
    }, [currentList]);

    // Redirect if list doesn't exist
    useEffect(() => {
        if (!currentList && listId) {
            router.push('/todos');
        }
    }, [currentList, listId, router]);

    // Set up real-time todo updates listener
    useEffect(() => {
        const cleanup = onTodoUpdate?.((update) => {
            // Apply real-time updates from other users
            switch (update.action) {
                case 'add':
                    if (update.todo) {
                        addTodo(listId, update.todo.text);
                    }
                    break;
                case 'update':
                    if (update.todoId && update.todo) {
                        updateTodo(listId, update.todoId, update.todo);
                    }
                    break;
                case 'delete':
                    if (update.todoId) {
                        deleteTodo(listId, update.todoId);
                    }
                    break;
                case 'toggle':
                    if (update.todoId) {
                        toggleTodo(listId, update.todoId);
                    }
                    break;
            }
        });

        return cleanup;
    }, [listId, onTodoUpdate, addTodo, updateTodo, deleteTodo, toggleTodo]);

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
            const newTodoText = newTodo.trim();
            addTodo(listId, newTodoText);
            setNewTodo('');

            // Send real-time update
            sendTodoUpdate({
                listId,
                action: 'add',
                todo: { text: newTodoText }
            });
        }
    };

    const handleStartEdit = (todo: Todo) => {
        setEditingTodo(todo.id);
        setEditText(todo.text);
    };

    const handleSaveEdit = () => {
        if (editingTodo && editText.trim()) {
            const updatedTodo = { text: editText.trim() };
            updateTodo(listId, editingTodo, updatedTodo);

            // Send real-time update
            sendTodoUpdate({
                listId,
                action: 'update',
                todoId: editingTodo,
                todo: updatedTodo
            });

            setEditingTodo(null);
            setEditText('');
        }
    };

    const handleCancelEdit = () => {
        setEditingTodo(null);
        setEditText('');
    };

    const handleToggleTodo = (todoId: number) => {
        toggleTodo(listId, todoId);

        // Send real-time update
        sendTodoUpdate({
            listId,
            action: 'toggle',
            todoId
        });
    };

    const handleDeleteTodo = (todoId: number) => {
        deleteTodo(listId, todoId);

        // Send real-time update
        sendTodoUpdate({
            listId,
            action: 'delete',
            todoId
        });
    };

    const handleTyping = (isTyping: boolean) => {
        sendTypingIndicator(isTyping);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // If user is typing, set a timeout to send "not typing" after 2 seconds
        if (isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
                sendTypingIndicator(false);
            }, 2000);
        }
    };
    if (listName.trim()) {
        updateTodoList(listId, {
            name: listName.trim(),
            description: listDescription.trim()
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

// Filter todos
let filteredTodos = currentList.todos;

// Filter by completion status
if (filter === 'active') {
    filteredTodos = filteredTodos.filter(todo => !todo.completed);
} else if (filter === 'completed') {
    filteredTodos = filteredTodos.filter(todo => todo.completed);
}

// Filter by search text
if (searchText) {
    filteredTodos = filteredTodos.filter(todo =>
        todo.text.toLowerCase().includes(searchText.toLowerCase())
    );
}

const activeTodosCount = getActiveTodos(listId);
const completedTodosCount = getCompletedTodos(listId);

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
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
                            <span>Last modified: {currentList.lastModified.toLocaleDateString()}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Add new todo */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                        placeholder="What needs to be done?"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleAddTodo}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* Search and filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Search todos..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex gap-2">
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
                </div>
            </div>

            {/* Todo list */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {filteredTodos.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        {searchText ? 'No todos match your search.' : 'No todos yet. Add one above!'}
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {filteredTodos.map((todo) => (
                            <li key={todo.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={todo.completed}
                                        onChange={() => toggleTodo(listId, todo.id)}
                                        className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                                    />
                                    {editingTodo === todo.id ? (
                                        <div className="flex-1 flex gap-2">
                                            <input
                                                type="text"
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') handleSaveEdit();
                                                    if (e.key === 'Escape') handleCancelEdit();
                                                }}
                                                className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleSaveEdit}
                                                className="px-2 py-1 text-green-600 hover:bg-green-50 rounded text-sm"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="px-2 py-1 text-gray-600 hover:bg-gray-50 rounded text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <span
                                            className={`flex-1 cursor-pointer ${todo.completed
                                                    ? 'text-gray-500 line-through'
                                                    : 'text-gray-800'
                                                }`}
                                            onClick={() => handleStartEdit(todo)}
                                        >
                                            {todo.text}
                                        </span>
                                    )}
                                    {editingTodo !== todo.id && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleStartEdit(todo)}
                                                className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteTodo(listId, todo.id)}
                                                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
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

