// src/components/SortableTodoItem.tsx
'use client';

import { useDroppable } from '@dnd-kit/core';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Todo } from '@/store/todoStore';

interface SortableTodoItemProps {
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
}

export function SortableTodoItem({
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

    // Get background color based on priority
    const getPriorityBackgroundColor = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-50 border-l-red-400';
            case 'high':
                return 'bg-orange-50 border-l-orange-400';
            case 'medium':
                return 'bg-yellow-50 border-l-yellow-400';
            case 'low':
                return 'bg-green-50 border-l-green-400';
            default:
                return 'bg-white border-l-gray-300';
        }
    };

    // Get hover background color based on priority (darker version)
    const getPriorityHoverColor = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
        switch (priority) {
            case 'urgent':
                return 'hover:bg-red-100';
            case 'high':
                return 'hover:bg-orange-100';
            case 'medium':
                return 'hover:bg-yellow-100';
            case 'low':
                return 'hover:bg-green-100';
            default:
                return 'hover:bg-gray-50';
        }
    };

    return (
        <li
            ref={setNodeRef}
            // style={{ ...style, marginLeft: `${indentLevel * 2}rem` }}
            style={{ ...style }}
            className={`transition-all duration-300 ${isDragging ? 'shadow-lg z-10 opacity-50' : ''
                } ${isOver ? 'bg-blue-50' : ''
                }`}
        >
            <div className={`p-1 border-b border-gray-100 border-l-4 ${getPriorityBackgroundColor(todo.priority || 'medium')} ${getPriorityHoverColor(todo.priority || 'medium')}`}>
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
                                {/* {indentLevel > 0 && (
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                        Level {indentLevel + 1}
                                    </span>
                                )} */}

                                {/* Priority indicator */}
                                {/* <span
                                    className="px-2 py-1 text-xs font-medium rounded-full text-white"
                                    style={{ backgroundColor: getPriorityColor(todo.priority || 'medium') }}
                                >
                                    {(todo.priority || 'medium').toUpperCase()}
                                </span> */}

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

                                {/* Cost indicator */}
                                {todo.cost && todo.cost > 0 && (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                        £{todo.cost.toFixed(2)}
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
                    {/* <div className="text-xs text-gray-400" style={{ marginLeft: '2rem' }}>
                        Created: {todo.createdAt.toLocaleDateString()} ·
                        Updated: {todo.updatedAt.toLocaleDateString()}
                    </div> */}
                </div>
            </div>

            {/* Drop Zone for making this a parent of dragged items */}
            {showDropZone && (
                <div
                    ref={setDroppableRef}
                    className={`transition-all duration-200 mx-2 my-1 ${isOver
                        ? 'p-4 bg-blue-100 border-2 border-blue-500 border-dashed rounded-lg shadow-md'
                        : 'p-3 bg-gray-50 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 hover:bg-blue-50'
                        }`}
                    style={{ marginLeft: `${(indentLevel + 1) * 2 + 0.5}rem` }}
                >
                    <div className={`text-sm text-center font-medium ${isOver ? 'text-blue-800' : 'text-gray-600'
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