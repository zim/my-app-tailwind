'use client';

import { useEffect, useState } from 'react';

export default function GlobalLoadingProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reduced loading time to prevent interference with hydration
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Loading application...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
