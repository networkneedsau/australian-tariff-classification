'use client';

import { useState } from 'react';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  userName?: string;
}

export default function TopBar({
  searchQuery,
  onSearchChange,
  onSearch,
  activeTab,
  onTabChange,
  userName,
}: TopBarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  const navItems = [
    { id: 'calculator', label: 'Calculator', href: '/calculator' },
    { id: 'bulk', label: 'Bulk', href: '/bulk' },
    { id: 'origin', label: 'Origin', href: '/origin' },
    { id: 'admin', label: 'Admin', href: '/admin' },
  ];

  return (
    <div className="bg-[#001a33] text-white px-4 py-2 flex items-center gap-4 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <svg className="w-7 h-7 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold tracking-tight">
            <span className="text-blue-400">Tariff</span>
            <span className="text-white">AU</span>
          </span>
          <span className="text-[9px] text-slate-400 -mt-1">Powered by Logistica</span>
        </div>
      </div>

      {/* Search input */}
      <div className="flex-1 max-w-2xl mx-auto">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search words or commodity code"
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#003366] text-white placeholder-gray-400 border border-[#004080] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex items-center gap-1 shrink-0">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={item.href}
            onClick={(e) => {
              if (onTabChange) {
                e.preventDefault();
                onTabChange(item.id);
              }
            }}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === item.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-[#003366]'
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* User menu */}
      <div className="relative shrink-0">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#003366] transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{userName || 'User'}</p>
            </div>
            <a href="/settings" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Settings
            </a>
            <a href="/logout" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Sign Out
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
