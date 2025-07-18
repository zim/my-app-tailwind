'use client';

import { useEffect, useState } from 'react';

interface LoadingIndicatorProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  minLoadingTime?: number;
}

export default function LoadingIndicator({ 
  isLoading, 
  children, 
  loadingText = "Loading...",
  minLoadingTime = 500
}: LoadingIndicatorProps) {
  const [showLoading, setShowLoading] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
    } else {
      // Add a minimum loading time to prevent flash
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, minLoadingTime);

      return () => clearTimeout(timer);
    }
  }, [isLoading, minLoadingTime]);

  if (showLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">{loadingText}</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
