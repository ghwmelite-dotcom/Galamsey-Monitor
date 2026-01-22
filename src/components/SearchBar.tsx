'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, MapPin, Droplets, Mountain, Loader2 } from 'lucide-react';
import type { SearchResult } from '@/types';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

const typeIcons = {
  incident: MapPin,
  water: Droplets,
  site: Mountain,
};

const typeLabels = {
  incident: 'Incident',
  water: 'Water Body',
  site: 'Mining Site',
};

const typeColors = {
  incident: 'text-red-600 bg-red-100',
  water: 'text-blue-600 bg-blue-100',
  site: 'text-orange-600 bg-orange-100',
};

export default function SearchBar({ className = '', placeholder = 'Search incidents, water bodies, sites...' }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.data || []);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');

    switch (result.type) {
      case 'incident':
        router.push(`/incident/${result.id}`);
        break;
      case 'water':
        router.push(`/water?highlight=${result.id}`);
        break;
      case 'site':
        router.push(`/map?site=${result.id}`);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ghana-green focus:border-transparent transition-all bg-white"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-ghana-green" />
              <p className="text-sm text-gray-500 mt-2">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <ul className="py-2">
              {results.map((result) => {
                const Icon = typeIcons[result.type];
                return (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      onClick={() => handleResultClick(result)}
                      className="w-full px-4 py-3 hover:bg-gray-50 text-left flex items-start gap-3"
                    >
                      <div className={`p-2 rounded-lg ${typeColors[result.type]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{result.title}</p>
                        <p className="text-sm text-gray-500 truncate">{result.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">{typeLabels[result.type]}</span>
                          <span className="text-xs text-gray-300">|</span>
                          <span className="text-xs text-gray-400">{result.region}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center">
              <p className="text-gray-500">No results found for &quot;{query}&quot;</p>
              <p className="text-sm text-gray-400 mt-1">Try different keywords</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
