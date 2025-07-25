'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTodoStore, Todo, getPriorityColor } from '@/store/todoStore';
import { useHydration } from '@/hooks/useHydration';
import Modal from '@/components/Modal';
import {
    DndContext,
    closestCenter,
    pointerWithin,
    rectIntersection,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragOverEvent,
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
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// Sortable Todo Item Component
function SortableTodoItem({
    todo,
    currentList,
    listId,
    handleToggleCollapse,
    handleToggleTodo,
    handleStartEdit,
    handleOpenSubTodoModal,
    handleDeleteTodo,
    getPriorityColor,
    isDragActive,
}: {
    todo: Todo;
    currentList: any;
    listId: number;
    handleToggleCollapse: (todoId: number) => void;
    handleToggleTodo: (todoId: number) => void;
    handleStartEdit: (todo: Todo) => void;
    handleOpenSubTodoModal: (todoId: number) => void;
    handleDeleteTodo: (todoId: number) => void;
    getPriorityColor: (priority: 'low' | 'medium' | 'high' | 'urgent') => string;
    isDragActive?: boolean;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: todo.id });

    // Add droppable functionality for sub-todo creation
    const {
        setNodeRef: setDroppableRef,
        isOver,
    } = useDroppable({
        id: `drop-${todo.id}`,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isOverdue = todo.dueDate && todo.dueDate < new Date() && !todo.completed;
    const isDueSoon = todo.dueDate && !todo.completed &&
        todo.dueDate > new Date() &&
        todo.dueDate <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // Due within 2 days

    const hasChildren = currentList?.todos.some((t: Todo) => t.parentId === todo.id);
    const indentLevel = todo.level || 0;

    // Don't show drop zone if dragging this item
    // Allow unlimited nesting depth
    const showDropZone = isDragActive && !isDragging;

    return (
        <li
            ref={setNodeRef}
            style={{ ...style, marginLeft: `${indentLevel * 2}rem` }}
            className={`transition-all duration-300 ${
                isDragging ? 'shadow-lg z-10 opacity-50' : ''
            } ${
                isOver ? 'bg-blue-50' : ''
            }`}
        >
            <div className="p-4 hover:bg-gray-50 border-b border-gray-100">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        {/* Drag Handle */}
                        <button
                            {...attributes}
                            {...listeners}
                            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing focus:outline-none p-1"
                            title="Drag to reorder or drop on another todo to make it a sub-task"
                        >
                            ⋮⋮
                        </button>

                        {/* Indent indicator */}
                        {indentLevel > 0 && (
                            <div className="flex items-center text-gray-300">
                                {'└─'.repeat(Math.min(indentLevel, 3))}
                            </div>
                        )}

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

                                {/* Level indicator */}
                                {indentLevel > 0 && (
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                        Level {indentLevel + 1}
                                    </span>
                                )}

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
                            {todo.level < 3 && (
                                <button
                                    onClick={() => handleOpenSubTodoModal(todo.id)}
                                    className="px-2 py-1 text-green-600 hover:bg-green-50 rounded text-sm"
                                    title="Add sub-todo"
                                >
                                    + Sub
                                </button>
                            )}
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
            </div>

            {/* Drop Zone for making this a parent of dragged items */}
            {showDropZone && (
                <div
                    ref={setDroppableRef}
                    className={`transition-all duration-200 mx-2 my-1 ${
                        isOver 
                            ? 'p-4 bg-blue-100 border-2 border-blue-500 border-dashed rounded-lg shadow-md' 
                            : 'p-3 bg-gray-50 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 hover:bg-blue-50'
                    }`}
                    style={{ marginLeft: `${(indentLevel + 1) * 2 + 0.5}rem` }}
                >
                    <div className={`text-sm text-center font-medium ${
                        isOver ? 'text-blue-800' : 'text-gray-600'
                    }`}>
                        {isOver 
                            ? `📌 Drop to make sub-task of "${todo.text.length > 20 ? todo.text.substring(0, 20) + '...' : todo.text}"` 
                            : `➕ Drop here to create sub-task (Level ${indentLevel + 2}) - Unlimited depth allowed`
                        }
                    </div>
                </div>
            )}
        </li>
    );
}

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
        toggleCollapse,
        moveToSubTodo,
        moveToSameLevel
    } = useTodoStore();

    const [newTodo, setNewTodo] = useState('');
    const [newTodoPriority, setNewTodoPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
    const [newTodoDueDate, setNewTodoDueDate] = useState('');
    const [newTodoDescription, setNewTodoDescription] = useState('');
    const [showAddTodoModal, setShowAddTodoModal] = useState(false);
    const [showEditTodoModal, setShowEditTodoModal] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [searchText, setSearchText] = useState('');
    const [editingTodo, setEditingTodo] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
    const [editDueDate, setEditDueDate] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [showEditListModal, setShowEditListModal] = useState(false);
    const [listName, setListName] = useState('');
    const [listDescription, setListDescription] = useState('');
    const [listColor, setListColor] = useState('#3B82F6');
    const [showAddSubTodoModal, setShowAddSubTodoModal] = useState(false);
    const [addingSubTodoFor, setAddingSubTodoFor] = useState<number | null>(null);
    const [newSubTodo, setNewSubTodo] = useState('');
    const [newSubTodoPriority, setNewSubTodoPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
    const [newSubTodoDueDate, setNewSubTodoDueDate] = useState('');
    const [newSubTodoDescription, setNewSubTodoDescription] = useState('');
    const [isDragActive, setIsDragActive] = useState(false);
    const [draggedTodoText, setDraggedTodoText] = useState('');
    const [, forceUpdate] = useState({});

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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
            <div className="min-h-screen bg-slate-300 py-8">
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
            <div className="min-h-screen bg-slate-300 flex items-center justify-center">
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
        setShowEditTodoModal(true);
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
            setShowEditTodoModal(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingTodo(null);
        setEditText('');
        setEditPriority('medium');
        setEditDueDate('');
        setEditDescription('');
        setShowEditTodoModal(false);
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
            setShowAddSubTodoModal(false);
            setAddingSubTodoFor(null);
        }
    };

    const handleCancelSubTodo = () => {
        setShowAddSubTodoModal(false);
        setAddingSubTodoFor(null);
        setNewSubTodo('');
        setNewSubTodoPriority('medium');
        setNewSubTodoDueDate('');
        setNewSubTodoDescription('');
    };

    const handleOpenSubTodoModal = (parentId: number) => {
        setAddingSubTodoFor(parentId);
        setShowAddSubTodoModal(true);
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
            setShowEditListModal(false);
        }
    };

    const handleOpenEditListModal = () => {
        setListName(currentList.name);
        setListDescription(currentList.description);
        setListColor(currentList.color);
        setShowEditListModal(true);
    };

    const handleCancelEditList = () => {
        setShowEditListModal(false);
        setListName(currentList.name);
        setListDescription(currentList.description);
        setListColor(currentList.color);
    };

    const handleDeleteList = () => {
        if (confirm(`Are you sure you want to delete "${currentList.name}"? This will permanently remove all todos in this list.`)) {
            deleteTodoList(listId);
            router.push('/todos');
        }
    };

    // Handle drag start
    const handleDragStart = (event: any) => {
        setIsDragActive(true);
        const draggedTodo = currentList?.todos.find(t => t.id === event.active.id);
        if (draggedTodo) {
            setDraggedTodoText(draggedTodo.text);
        }
    };

    // Handle drag end for reordering and sub-todo creation
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setIsDragActive(false);
        setDraggedTodoText('');

        console.log('=== Drag End Event ===');
        console.log('Active ID:', active.id, 'type:', typeof active.id);
        console.log('Over ID:', over?.id, 'type:', typeof over?.id);
        console.log('All current todos:', currentList?.todos.map(t => ({ id: t.id, text: t.text, level: t.level, parentId: t.parentId })));

        if (!over || active.id === over.id) {
            console.log('No valid drop target or same item');
            return;
        }

        // Check if dropping on a droppable area (for sub-todo creation)
        if (typeof over.id === 'string' && over.id.startsWith('drop-')) {
            const targetTodoId = parseInt(over.id.replace('drop-', ''));
            const draggedTodoId = active.id as number;
            
            console.log('🎯 DROP ZONE: Moving todo', draggedTodoId, 'to become sub-todo of', targetTodoId);
            
            // Simple validation - just prevent self-drop and circular dependencies
            if (draggedTodoId === targetTodoId) {
                console.log('Cannot drop on self');
                return;
            }

            // Check for circular dependency
            const wouldCreateCircle = (checkId: number, targetParentId: number): boolean => {
                if (checkId === targetParentId) return true;
                const checkParent = currentList?.todos.find(t => t.id === targetParentId);
                return checkParent?.parentId ? wouldCreateCircle(checkId, checkParent.parentId) : false;
            };

            if (wouldCreateCircle(draggedTodoId, targetTodoId)) {
                console.log('Would create circular dependency');
                return;
            }

            console.log('✅ Creating sub-task relationship');
            moveToSubTodo(listId, draggedTodoId, targetTodoId);
            
            // Auto-expand parent if collapsed
            setTimeout(() => {
                const parent = getCurrentList()?.todos.find(t => t.id === targetTodoId);
                if (parent?.isCollapsed) {
                    toggleCollapse(listId, targetTodoId);
                }
                forceUpdate({});
            }, 100);
            return;
        }

        // Check if dropping directly on another todo item (make sibling at same level)  
        const targetTodoId = over.id as number;
        const draggedTodoId = active.id as number;
        
        console.log('🎯 DIRECT DROP: Moving todo', draggedTodoId, 'to same level as', targetTodoId);
        
        const targetTodo = currentList?.todos.find(todo => todo.id === targetTodoId);
        const draggedTodo = currentList?.todos.find(todo => todo.id === draggedTodoId);
        
        if (targetTodo && draggedTodo) {
            // Simple validation - prevent self-drop and circular dependencies
            if (draggedTodoId === targetTodoId) {
                console.log('Cannot drop on self');
                return;
            }

            // Check for circular dependency
            const wouldCreateCircle = (checkId: number, targetParentId: number): boolean => {
                if (checkId === targetParentId) return true;
                const checkParent = currentList?.todos.find(t => t.id === targetParentId);
                return checkParent?.parentId ? wouldCreateCircle(checkId, checkParent.parentId) : false;
            };

            if (targetTodo.parentId && wouldCreateCircle(draggedTodoId, targetTodo.parentId)) {
                console.log('Would create circular dependency');
                return;
            }

            console.log('✅ Making items siblings');
            console.log('Target level:', targetTodo.level, 'Target parent:', targetTodo.parentId);
            moveToSameLevel(listId, draggedTodoId, targetTodoId);
            
            setTimeout(() => {
                forceUpdate({});
            }, 100);
            return;
        }

        // Otherwise, handle regular reordering (only for items at the same level)
        const oldIndex = filteredTodos.findIndex((todo) => todo.id === active.id);
        const newIndex = filteredTodos.findIndex((todo) => todo.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            console.log('Regular reordering from index', oldIndex, 'to', newIndex);
            const reorderedTodos = arrayMove(filteredTodos, oldIndex, newIndex);
            // Update each todo's position in the store
            reorderedTodos.forEach((todo, index) => {
                updateTodo(listId, todo.id, { ...todo, order: index });
            });
        }

        console.log('=== Drag End Complete ===');
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
        <div className="min-h-screen bg-slate-300 py-8">
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
                            onClick={handleOpenEditListModal}
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
                </div>

                {/* Add new todo button */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Quick Actions</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                💡 <strong>Drag & Drop Tips:</strong> Grab the ⋮⋮ handle and drag todo items onto the drop zones that appear below other todos to create sub-tasks. Maximum 4 hierarchy levels supported.
                            </p>
                        </div>
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

                {/* Add Sub-Todo Modal */}
                <Modal
                    isOpen={showAddSubTodoModal}
                    onClose={handleCancelSubTodo}
                    title="Add Sub-Todo"
                    maxWidth="lg"
                >
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={newSubTodo}
                            onChange={(e) => setNewSubTodo(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addingSubTodoFor && handleAddSubTodo(addingSubTodoFor)}
                            placeholder="What needs to be done?"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select
                                    value={newSubTodoPriority}
                                    onChange={(e) => setNewSubTodoPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
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
                                    value={newSubTodoDueDate}
                                    onChange={(e) => setNewSubTodoDueDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <textarea
                            value={newSubTodoDescription}
                            onChange={(e) => setNewSubTodoDescription(e.target.value)}
                            placeholder="Description (optional)..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />

                        <div className="flex gap-2 pt-4">
                            <button
                                onClick={() => addingSubTodoFor && handleAddSubTodo(addingSubTodoFor)}
                                disabled={!newSubTodo.trim()}
                                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                            >
                                Add Sub-Todo
                            </button>
                            <button
                                onClick={handleCancelSubTodo}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Edit List Info Modal */}
                <Modal
                    isOpen={showEditListModal}
                    onClose={handleCancelEditList}
                    title="Edit List Information"
                    maxWidth="lg"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">List Name</label>
                            <input
                                type="text"
                                value={listName}
                                onChange={(e) => setListName(e.target.value)}
                                placeholder="Enter list name..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={listDescription}
                                onChange={(e) => setListDescription(e.target.value)}
                                placeholder="Add a description (optional)..."
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Color Theme</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={listColor}
                                    onChange={(e) => setListColor(e.target.value)}
                                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                                />
                                <span className="text-sm text-gray-500 px-3 py-1 bg-gray-100 rounded">{listColor}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <button
                                onClick={handleUpdateListInfo}
                                disabled={!listName.trim()}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={handleCancelEditList}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Edit Todo Modal */}
                <Modal
                    isOpen={showEditTodoModal}
                    onClose={handleCancelEdit}
                    title="Edit Todo"
                    maxWidth="lg"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Todo Text</label>
                            <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                                placeholder="What needs to be done?"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select
                                    value={editPriority}
                                    onChange={(e) => setEditPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
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
                                    value={editDueDate}
                                    onChange={(e) => setEditDueDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Description (optional)..."
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex gap-2 pt-4">
                            <button
                                onClick={handleSaveEdit}
                                disabled={!editText.trim()}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={handleCancelEdit}
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
                    {isDragActive && (
                        <div className="bg-blue-50 border-b border-blue-200 p-4">
                            <div className="text-sm text-blue-700 text-center">
                                🎯 <strong>Dragging:</strong> "{draggedTodoText.length > 30 ? draggedTodoText.substring(0, 30) + '...' : draggedTodoText}" 
                                <br />
                                <span className="text-xs">Drop ON items = same level siblings | Drop IN zones = sub-tasks (unlimited depth)</span>
                            </div>
                        </div>
                    )}
                    {filteredTodos.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            {searchText ? 'No todos match your search.' : 'No todos yet. Add one above!'}
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={filteredTodos.map(todo => todo.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <ul className="divide-y divide-gray-200">
                                    {filteredTodos.map((todo) => (
                                        <SortableTodoItem
                                            key={todo.id}
                                            todo={todo}
                                            currentList={currentList}
                                            listId={listId}
                                            handleToggleCollapse={handleToggleCollapse}
                                            handleToggleTodo={handleToggleTodo}
                                            handleStartEdit={handleStartEdit}
                                            handleOpenSubTodoModal={handleOpenSubTodoModal}
                                            handleDeleteTodo={handleDeleteTodo}
                                            getPriorityColor={getPriorityColor}
                                            isDragActive={isDragActive}
                                        />
                                    ))}
                                </ul>
                            </SortableContext>
                        </DndContext>
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

