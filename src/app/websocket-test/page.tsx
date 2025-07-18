'use client';

import { useWebSocket } from '@/hooks/useWebSocket';
import { useState } from 'react';

export default function WebSocketTestPage() {
  const {
    isConnected,
    currentUser,
    activeUsers,
    typingUsers,
    sendTodoUpdate,
    sendTypingIndicator,
    onTodoUpdate
  } = useWebSocket(1); // Test with list ID 1

  const [testMessage, setTestMessage] = useState('');

  const sendTestUpdate = () => {
    sendTodoUpdate({
      listId: 1,
      action: 'add',
      todo: { text: `Test todo: ${new Date().toLocaleTimeString()}` }
    });
  };

  const sendTestTyping = () => {
    sendTypingIndicator(true);
    setTimeout(() => sendTypingIndicator(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">WebSocket Test Page</h1>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
              {isConnected ? 'Connected to WebSocket' : 'Disconnected from WebSocket'}
            </span>
          </div>

          {currentUser && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">Current User:</h3>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: currentUser.color }}
                ></div>
                <span className="text-gray-800">{currentUser.name}</span>
                <span className="text-gray-500 text-sm">({currentUser.id})</span>
              </div>
            </div>
          )}
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Active Users ({activeUsers.length})</h2>
          {activeUsers.length === 0 ? (
            <p className="text-gray-500">No other users connected</p>
          ) : (
            <div className="space-y-2">
              {activeUsers.map(user => (
                <div key={user.id} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: user.color }}
                  ></div>
                  <span className="text-gray-800">{user.name}</span>
                  <span className="text-gray-500 text-sm">({user.id})</span>
                  {typingUsers.has(user.id) && (
                    <span className="text-blue-600 text-sm italic">typing...</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="space-y-4">
            <button
              onClick={sendTestUpdate}
              disabled={!isConnected}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Send Test Todo Update
            </button>

            <button
              onClick={sendTestTyping}
              disabled={!isConnected}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Send Test Typing Indicator
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Testing Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Open this page in multiple browser tabs or windows</li>
            <li>Check that you can see other users in the "Active Users" section</li>
            <li>Click the test buttons to send messages between tabs</li>
            <li>Open the browser console to see detailed WebSocket logs</li>
            <li>If you don't see real-time updates, check the console for errors</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
