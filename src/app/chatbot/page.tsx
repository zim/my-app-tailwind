'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isTyping?: boolean;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Simulate AI response with various responses
  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Budget-related responses
    if (lowerMessage.includes('budget') || lowerMessage.includes('money') || lowerMessage.includes('finance')) {
      return "I can help you with budget planning! Consider tracking your income, expenses, and setting savings goals. Would you like some specific budgeting tips?";
    }

    // Todo-related responses
    if (lowerMessage.includes('todo') || lowerMessage.includes('task') || lowerMessage.includes('productivity')) {
      return "Great question about productivity! Breaking tasks into smaller, manageable pieces and using tools like todo lists can really help. What specific task management challenge are you facing?";
    }

    // Data visualization responses
    if (lowerMessage.includes('data') || lowerMessage.includes('chart') || lowerMessage.includes('visualization')) {
      return "Data visualization is powerful for understanding patterns and insights! D3.js is great for interactive charts. What kind of data are you looking to visualize?";
    }

    // Technology responses
    if (lowerMessage.includes('react') || lowerMessage.includes('next') || lowerMessage.includes('javascript') || lowerMessage.includes('typescript')) {
      return "React and Next.js are excellent choices for modern web development! They offer great performance, developer experience, and a strong ecosystem. Are you working on a specific project?";
    }

    // Greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello there! I'm here to help you with questions about web development, budgeting, productivity, or anything else you'd like to discuss. What's on your mind?";
    }

    // Help responses
    if (lowerMessage.includes('help')) {
      return "I'm here to help! I can assist with:\n• Budget and financial planning\n• Task management and productivity\n• Web development questions\n• Data visualization\n• General advice and conversation\n\nWhat would you like to explore?";
    }

    // Thanks responses
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return "You're very welcome! I'm happy to help. Feel free to ask me anything else!";
    }

    // Default responses
    const defaultResponses = [
      "That's an interesting point! Could you tell me more about what you're thinking?",
      "I see what you mean. What specific aspect would you like to explore further?",
      "That's a great question! Let me think about that from a few different angles...",
      "Interesting! I'd love to help you dive deeper into that topic.",
      "That makes sense! What other information would be helpful for your situation?",
      "Good thinking! Have you considered approaching it from this perspective...",
      "I understand your question. What's the main goal you're trying to achieve?",
      "That's worth exploring! What factors are most important to you in this situation?"
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: Date.now() + 1,
      text: 'Typing...',
      sender: 'bot',
      timestamp: new Date(),
      isTyping: true,
    };

    setMessages(prev => [...prev, typingMessage]);

    // Simulate thinking time
    setTimeout(() => {
      const botResponse = generateBotResponse(userMessage.text);
      const botMessage: Message = {
        id: Date.now() + 2,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };

      // Remove typing indicator and add bot response
      setMessages(prev => prev.filter(msg => !msg.isTyping).concat(botMessage));
      setIsLoading(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your AI assistant. How can I help you today?",
        sender: 'bot',
        timestamp: new Date(),
      }
    ]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800">
                🤖 AI Chatbot
              </h1>
              <p className="text-sm text-gray-500">
                Your intelligent assistant
              </p>
            </div>
            <button
              onClick={clearChat}
              className="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              title="Clear chat history"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-6">
        {/* Messages Area */}
        <div className="flex-1 bg-white rounded-lg shadow-md mb-6 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: '70vh' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.isTyping
                        ? 'bg-gray-200 text-gray-600 animate-pulse'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                >
                  <div className="flex items-start space-x-2">
                    <span className="text-xl">
                      {message.sender === 'user' ? '👤' : '🤖'}
                    </span>
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                      <p className={`text-xs mt-1 opacity-70 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-4">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '⏳' : '📤'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              "Help me with budgeting tips",
              "How to be more productive?",
              "Explain React best practices",
              "Data visualization ideas",
              "Task management strategies",
              "Next.js performance tips"
            ].map((question, index) => (
              <button
                key={index}
                onClick={() => {
                  setInputMessage(question);
                  inputRef.current?.focus();
                }}
                disabled={isLoading}
                className="text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💡 {question}
              </button>
            ))}
          </div>
        </div>

        {/* Features Info */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Chatbot Features:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Ask questions about budgeting, productivity, and web development</li>
            <li>• Get helpful tips and advice on various topics</li>
            <li>• Conversation history during your session</li>
            <li>• Quick question buttons for common inquiries</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
