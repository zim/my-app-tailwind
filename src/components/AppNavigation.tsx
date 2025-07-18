'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';

const navigationItems = [
    { href: '/todos', label: 'Todo List', icon: '📝' },
    { href: '/budget', label: 'Budget Tracker', icon: '💰' },
    { href: '/cv', label: 'My CV', icon: '📄' },
    { href: '/gsap-demo', label: 'GSAP Demo', icon: '✨' },
    { href: '/chatbot', label: 'AI Chatbot', icon: '🤖' },
    { href: '/d3-demo', label: 'D3.js Demo', icon: '📊' },
];

export default function AppNavigation() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = useCallback(() => {
        setIsMenuOpen(prev => !prev);
    }, []);

    const closeMenu = useCallback(() => {
        setIsMenuOpen(false);
    }, []);

    const isActiveLink = useCallback((href: string) => {
        return pathname === href || pathname.startsWith(href + '/');
    }, [pathname]);

    const desktopNavItems = useMemo(() => (
        navigationItems.map((item) => (
            <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveLink(item.href)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
                <span className="text-base">{item.icon}</span>
                <span className="hidden lg:inline">{item.label}</span>
            </Link>
        ))
    ), [isActiveLink]);

    const mobileNavItems = useMemo(() => (
        navigationItems.map((item) => (
            <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActiveLink(item.href)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
            >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
            </Link>
        ))
    ), [isActiveLink, closeMenu]);

    return (
        <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Home Link */}
                    <Link
                        href="/"
                        className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors"
                    >
                        <span className="text-xl font-bold">JS</span>
                        <span className="hidden sm:inline text-sm">Jolyon Segal</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-4">
                        {desktopNavItems}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={toggleMenu}
                        className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        aria-expanded={isMenuOpen}
                    >
                        <span className="sr-only">Open main menu</span>
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-700">
                        {mobileNavItems}
                    </div>
                </div>
            )}
        </nav>
    );
}
