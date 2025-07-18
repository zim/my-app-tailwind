import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface User {
  id: string;
  name: string;
  color: string;
  lastSeen: Date;
}

interface TodoUpdate {
  listId: number;
  action: 'add' | 'update' | 'delete' | 'toggle' | 'reorder';
  todo?: any;
  todoId?: number;
  todos?: any[];
  userId: string;
  userName: string;
  timestamp?: number;
}

interface TypingIndicator {
  listId: number;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export const useWebSocket = (listId?: number) => {
  const socket = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Connect to WebSocket server
  useEffect(() => {
    console.log('Attempting to connect to WebSocket server...');
    socket.current = io('http://localhost:3002', {
      transports: ['websocket'],
    });

    socket.current.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Connected to WebSocket server');
    });

    socket.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ Disconnected from WebSocket server');
    });

    socket.current.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
    });

    socket.current.on('user-info', (user: User) => {
      console.log('👤 Received user info:', user);
      setCurrentUser(user);
    });

    socket.current.on('active-users', (users: User[]) => {
      console.log('👥 Active users:', users);
      setActiveUsers(users);
    });

    socket.current.on('user-joined', ({ user }: { user: User; listId: number }) => {
      console.log('✅ User joined:', user);
      setActiveUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
    });

    socket.current.on('user-left', ({ userId }: { userId: string; listId: number }) => {
      console.log('❌ User left:', userId);
      setActiveUsers(prev => prev.filter(u => u.id !== userId));
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    socket.current.on('user-disconnected', ({ userId }: { userId: string }) => {
      console.log('❌ User disconnected:', userId);
      setActiveUsers(prev => prev.filter(u => u.id !== userId));
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    socket.current.on('user-typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      console.log('⌨️ User typing:', { userId, isTyping });
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      if (socket.current?.connected) {
        socket.current.emit('heartbeat');
      }
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
      socket.current?.disconnect();
    };
  }, []);

  // Join/leave list rooms
  useEffect(() => {
    if (socket.current?.connected && listId !== undefined) {
      console.log('🚪 Joining list room:', listId);
      socket.current.emit('join-list', listId);
      
      return () => {
        console.log('🚪 Leaving list room:', listId);
        socket.current?.emit('leave-list', listId);
      };
    }
  }, [listId, isConnected]);

  // Send todo update
  const sendTodoUpdate = useCallback((update: Omit<TodoUpdate, 'userId' | 'userName' | 'timestamp'>) => {
    console.log('📤 Sending todo update:', update);
    if (socket.current?.connected && currentUser) {
      const fullUpdate = {
        ...update,
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: Date.now(),
      };
      console.log('📤 Full update being sent:', fullUpdate);
      socket.current.emit('todo-update', fullUpdate);
    } else {
      console.log('⚠️ Cannot send update - not connected or no current user');
    }
  }, [currentUser]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (socket.current?.connected && currentUser && listId !== undefined) {
      socket.current.emit('typing', {
        listId,
        userId: currentUser.id,
        userName: currentUser.name,
        isTyping,
      });
    }
  }, [currentUser, listId]);

  // Listen for todo updates
  const onTodoUpdate = useCallback((callback: (update: TodoUpdate) => void) => {
    if (socket.current) {
      const handleUpdate = (update: TodoUpdate) => {
        console.log('📥 Received todo update:', update);
        callback(update);
      };
      
      socket.current.on('todo-updated', handleUpdate);
      return () => {
        socket.current?.off('todo-updated', handleUpdate);
      };
    }
  }, []);

  return {
    isConnected,
    currentUser,
    activeUsers,
    typingUsers,
    sendTodoUpdate,
    sendTypingIndicator,
    onTodoUpdate,
  };
};
