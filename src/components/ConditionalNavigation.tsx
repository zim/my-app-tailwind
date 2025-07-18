'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import AppNavigation from './AppNavigation';

export default function ConditionalNavigation() {
    const pathname = usePathname();

    // Show navigation only on inner pages (not on home page)
    const shouldShowNavigation = pathname !== '/';

    if (!shouldShowNavigation) {
        return null;
    }

    return (
        <Suspense fallback={<div className="h-16 bg-gray-800 border-b border-gray-700"></div>}>
            <AppNavigation />
        </Suspense>
    );
}
