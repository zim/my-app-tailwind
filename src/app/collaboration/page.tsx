'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function CollaborationDemoPage() {
  const [roomId, setRoomId] = useState(1); // Demo room
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ id: number, text: string, user: string, timestamp: Date }>>([]);

  const {
    isConnected,
    currentUser,
    activeUsers,
    typingUsers,
    sendTodoUpdate,
    sendTypingIndicator
  } = useWebSocket(roomId);

  const handleSendMessage = () => {
    if (message.trim() && currentUser) {
      const newMessage = {
        id: Date.now(),
        text: message.trim(),
        user: currentUser.name,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newMessage]);
      setMessage('');

      // Send as a todo update for demo purposes
      sendTodoUpdate({
        listId: roomId,
        action: 'add',
        todo: { text: `${currentUser.name}: ${newMessage.text}` }
      });
    }
  };

  const handleTyping = () => {
    sendTypingIndicator(message.length > 0);
  };

  useEffect(() => {
    handleTyping();
  }, [message]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Real-Time Collaboration Demo
          </h1>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">How to Test Real-Time Collaboration</h2>
          <div className="text-blue-700 space-y-2">
            <p>• Open this page in multiple browser tabs or windows</p>
            <p>• Try the todo collaboration features by opening the same todo list in multiple tabs</p>
            <p>• Watch for typing indicators and real-time updates</p>
            <p>• Use the demo chat below to see instant messaging</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Connection Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">WebSocket Status</h3>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">Your Info</h3>
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentUser.color }}
                  ></div>
                  <span className="text-sm text-gray-700">{currentUser.name}</span>
                </div>
              ) : (
                <span className="text-sm text-gray-500">Not connected</span>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">Room ID</h3>
              <span className="text-sm text-gray-700">Demo Room #{roomId}</span>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Users</h2>
          <div className="flex flex-wrap gap-3">
            {currentUser && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: currentUser.color }}
                ></div>
                {currentUser.name} (You)
              </div>
            )}
            {activeUsers.map(user => (
              <div key={user.id} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: user.color }}
                ></div>
                {user.name}
                {typingUsers.has(user.id) && (
                  <span className="text-xs text-gray-500 italic ml-1">typing...</span>
                )}
              </div>
            ))}
            {activeUsers.length === 0 && !currentUser && (
              <p className="text-gray-500 text-sm">No active users. Open this page in another tab to see collaboration!</p>
            )}
          </div>
        </div>

        {/* Demo Chat */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Demo Chat</h2>

          {/* Messages */}
          <div className="border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto mb-4 bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center">No messages yet. Start a conversation!</p>
            ) : (
              <div className="space-y-2">
                {messages.map(msg => (
                  <div key={msg.id} className="flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <span>{msg.user}</span>
                      <span>{msg.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <div className="bg-white rounded p-2 text-sm">{msg.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!isConnected}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || !isConnected}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>

        {/* Feature Links */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Try Real-Time Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/todos"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div>
                <h3 className="font-medium text-gray-800">Todo Lists</h3>
                <p className="text-sm text-gray-600">Collaborative todo management</p>
              </div>
              <span className="text-blue-500">→</span>
            </Link>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div>
                <h3 className="font-medium text-gray-600">More Features</h3>
                <p className="text-sm text-gray-500">Coming soon...</p>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
