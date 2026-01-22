'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  AlertTriangle,
  Droplets,
  Map,
  BarChart3,
  BookOpen,
  Satellite,
  Shield,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
  Search,
  MoreHorizontal,
  Settings,
} from 'lucide-react';
import AuthModal from './AuthModal';

// Primary nav items (always visible)
const primaryNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/report', label: 'Report', icon: AlertTriangle },
  { href: '/map', label: 'Map', icon: Map },
];

// Secondary nav items (in "More" dropdown)
const secondaryNavItems = [
  { href: '/water', label: 'Water Quality', icon: Droplets },
  { href: '/statistics', label: 'Statistics', icon: BarChart3 },
  { href: '/satellite', label: 'Satellite', icon: Satellite },
  { href: '/awareness', label: 'Learn More', icon: BookOpen },
];

export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'register'>('signin');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = session?.user?.role && ['admin', 'moderator', 'authority'].includes(session.user.role);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const openAuthModal = (tab: 'signin' | 'register') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  return (
    <>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-9 h-9 bg-gradient-to-br from-ghana-green to-ghana-green/80 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-semibold text-gray-900">Galamsey</span>
                <span className="text-ghana-gold font-medium ml-1">Monitor</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {primaryNavItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-ghana-green/10 text-ghana-green'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </Link>
                );
              })}

              {/* More Dropdown */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    secondaryNavItems.some(item => pathname === item.href)
                      ? 'bg-ghana-green/10 text-ghana-green'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span>More</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden">
                    {secondaryNavItems.map(({ href, label, icon: Icon }) => {
                      const isActive = pathname === href;
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setIsMoreMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            isActive
                              ? 'bg-ghana-green/10 text-ghana-green'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Admin Link */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname.startsWith('/admin')
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin</span>
                </Link>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <form onSubmit={handleSearch} className="flex items-center">
                  <div
                    className={`flex items-center transition-all duration-200 ${
                      isSearchExpanded ? 'w-48 sm:w-64' : 'w-10'
                    }`}
                  >
                    {isSearchExpanded ? (
                      <div className="relative w-full">
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onBlur={() => !searchQuery && setIsSearchExpanded(false)}
                          placeholder="Search..."
                          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-ghana-green focus:ring-2 focus:ring-ghana-green/20 transition-all outline-none"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsSearchExpanded(true)}
                        className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <Search className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Auth / User Area */}
              {status === 'authenticated' ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-ghana-green to-ghana-green/80 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                      {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 hidden sm:block transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                      {/* User info */}
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="font-medium text-gray-900 truncate">{session?.user?.name}</p>
                        <p className="text-sm text-gray-500 truncate">{session?.user?.email}</p>
                        <span className="inline-flex items-center mt-1.5 px-2 py-0.5 bg-ghana-green/10 text-ghana-green text-xs font-medium rounded-md capitalize">
                          {session?.user?.role}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition-colors"
                          >
                            <Shield className="w-4 h-4" />
                            Admin Dashboard
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={async () => {
                            setIsUserMenuOpen(false);
                            await signOut();
                            window.location.href = '/';
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : status === 'loading' ? (
                <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAuthModal('signin')}
                    className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="px-4 py-2 bg-gradient-to-r from-ghana-green to-ghana-green/90 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-ghana-green/25 transition-all"
                  >
                    <span className="hidden sm:inline">Get Started</span>
                    <span className="sm:hidden">Sign In</span>
                  </button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              {allNavItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-ghana-green/10 text-ghana-green'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </Link>
                );
              })}

              {isAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    pathname.startsWith('/admin')
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
            </div>

            {/* Mobile Search */}
            <div className="px-4 py-3 border-t border-gray-100">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search incidents, locations..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-ghana-green focus:ring-2 focus:ring-ghana-green/20 transition-all outline-none"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </form>
            </div>

            {/* Mobile Auth Buttons */}
            {status === 'unauthenticated' && (
              <div className="px-4 py-3 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => openAuthModal('signin')}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="flex-1 py-2.5 bg-gradient-to-r from-ghana-green to-ghana-green/90 text-white text-sm font-medium rounded-xl"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
      />
    </>
  );
}
