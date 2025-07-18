import { useState, useEffect } from 'react';

/**
 * Hook to handle hydration in Next.js client components.
 * Prevents hydration mismatches by ensuring the component
 * doesn't render content dependent on browser APIs until hydration is complete.
 * 
 * @returns {boolean} true when hydration is complete, false during SSR
 */
export const useHydration = (): boolean => {
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    return isHydrated;
};
