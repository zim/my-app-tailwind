'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useTodoStore } from '@/store/todoStore';

export default function RealTimeTestPage() {
  const [testInput, setTestInput] = useState('');
  const [receivedUpdates, setReceivedUpdates] = useState<any[]>([]);

  const {
    isConnected,
    currentUser,
    activeUsers,
    sendTodoUpdate,
    onTodoUpdate
  } = useWebSocket(1); // Test with list ID 1

  const { addTodo, getCurrentList } = useTodoStore();

  // Listen for updates and log them
  useEffect(() => {
    const cleanup = onTodoUpdate?.((update) => {
      console.log('🔥 RECEIVED UPDATE:', update);
      setReceivedUpdates(prev => [...prev, { ...update, receivedAt: new Date() }]);

      // Apply the update to the store
      if (update.action === 'add' && update.todo) {
        console.log('🔥 APPLYING ADD:', update.todo);
        addTodo(1, update.todo.text);
      }
    });

    return cleanup;
  }, [onTodoUpdate, addTodo]);

  const currentList = getCurrentList();

  const sendTestTodo = () => {
    if (testInput.trim()) {
      const todoText = testInput.trim();
      console.log('🚀 SENDING TODO:', todoText);

      // Send via WebSocket
      sendTodoUpdate({
        listId: 1,
        action: 'add',
        todo: { text: todoText, id: Date.now() }
      });

      // Also add locally
      addTodo(1, todoText);

      setTestInput('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Real-Time Todo Test</h1>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {currentUser && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">You: {currentUser.name}</h3>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: currentUser.color }}
                ></div>
                <span className="text-gray-600">{currentUser.id}</span>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-medium text-gray-700 mb-2">Active Users ({activeUsers.length})</h3>
            {activeUsers.map(user => (
              <div key={user.id} className="flex items-center gap-2 mb-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: user.color }}
                ></div>
                <span className="text-gray-600">{user.name} ({user.id})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Test Todo Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Send Test Todo</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendTestTodo()}
              placeholder="Enter a test todo..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendTestTodo}
              disabled={!testInput.trim() || !isConnected}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>

        {/* Current Todos */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Todos ({currentList?.todos.length || 0})</h2>
          {currentList?.todos.length === 0 ? (
            <p className="text-gray-500">No todos yet</p>
          ) : (
            <ul className="space-y-2">
              {currentList?.todos.map(todo => (
                <li key={todo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-800">{todo.text}</span>
                  <span className="text-sm text-gray-500">{todo.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Received Updates Log */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Received Updates ({receivedUpdates.length})</h2>
          {receivedUpdates.length === 0 ? (
            <p className="text-gray-500">No updates received yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {receivedUpdates.map((update, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">
                      {update.action.toUpperCase()} from {update.userName}
                    </span>
                    <span className="text-sm text-gray-500">
                      {update.receivedAt.toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(update, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
