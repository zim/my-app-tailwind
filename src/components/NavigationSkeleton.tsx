export default function NavigationSkeleton() {
  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo skeleton */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-6 bg-gray-700 rounded animate-pulse"></div>
            <div className="hidden sm:block w-24 h-4 bg-gray-700 rounded animate-pulse"></div>
          </div>

          {/* Desktop Navigation skeleton */}
          <div className="hidden md:flex items-center space-x-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center space-x-1 px-3 py-2 rounded-md"
              >
                <div className="w-4 h-4 bg-gray-700 rounded animate-pulse"></div>
                <div className="hidden lg:block w-16 h-4 bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Mobile menu button skeleton */}
          <div className="md:hidden">
            <div className="w-8 h-8 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </nav>
  );
}
