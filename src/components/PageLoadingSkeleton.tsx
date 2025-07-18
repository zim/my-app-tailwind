export default function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="w-64 h-10 bg-gray-300 rounded animate-pulse"></div>
          <div className="w-32 h-6 bg-gray-300 rounded animate-pulse"></div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-6">
          {/* Card skeleton */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-48 h-6 bg-gray-300 rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              <div className="w-full h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-3/4 h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-1/2 h-4 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Another card skeleton */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-56 h-6 bg-gray-300 rounded animate-pulse mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-lg">
                  <div className="w-full h-4 bg-gray-300 rounded animate-pulse mb-2"></div>
                  <div className="w-2/3 h-3 bg-gray-300 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* List skeleton */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-40 h-6 bg-gray-300 rounded animate-pulse mb-4"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
                  <div className="flex-1">
                    <div className="w-full h-4 bg-gray-300 rounded animate-pulse mb-2"></div>
                    <div className="w-1/2 h-3 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-300 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
