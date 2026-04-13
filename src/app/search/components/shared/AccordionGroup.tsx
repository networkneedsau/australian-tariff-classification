'use client';

import { useRef, useEffect, useState } from 'react';

interface AccordionGroupProps {
  title: string;
  subtitle?: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  colorScheme?: 'blue' | 'green' | 'red' | 'purple' | 'indigo' | 'amber';
}

const COLOR_MAP = {
  blue: {
    bg: 'bg-blue-50 hover:bg-blue-100',
    border: 'border-blue-200',
    text: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-700',
    chevron: 'text-blue-500',
  },
  green: {
    bg: 'bg-green-50 hover:bg-green-100',
    border: 'border-green-200',
    text: 'text-green-800',
    badge: 'bg-green-100 text-green-700',
    chevron: 'text-green-500',
  },
  red: {
    bg: 'bg-red-50 hover:bg-red-100',
    border: 'border-red-200',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-700',
    chevron: 'text-red-500',
  },
  purple: {
    bg: 'bg-purple-50 hover:bg-purple-100',
    border: 'border-purple-200',
    text: 'text-purple-800',
    badge: 'bg-purple-100 text-purple-700',
    chevron: 'text-purple-500',
  },
  indigo: {
    bg: 'bg-indigo-50 hover:bg-indigo-100',
    border: 'border-indigo-200',
    text: 'text-indigo-800',
    badge: 'bg-indigo-100 text-indigo-700',
    chevron: 'text-indigo-500',
  },
  amber: {
    bg: 'bg-amber-50 hover:bg-amber-100',
    border: 'border-amber-200',
    text: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
    chevron: 'text-amber-500',
  },
} as const;

export default function AccordionGroup({
  title,
  subtitle,
  count,
  expanded,
  onToggle,
  children,
  colorScheme = 'blue',
}: AccordionGroupProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const colors = COLOR_MAP[colorScheme];

  useEffect(() => {
    if (contentRef.current) {
      setHeight(expanded ? contentRef.current.scrollHeight : 0);
    }
  }, [expanded]);

  return (
    <div className={`border rounded-lg overflow-hidden ${colors.border}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${colors.bg}`}
      >
        {/* Chevron */}
        <svg
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${colors.chevron} ${
            expanded ? 'rotate-90' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        {/* Title & subtitle */}
        <div className="flex-1 min-w-0">
          <span className={`font-semibold text-sm ${colors.text}`}>{title}</span>
          {subtitle && (
            <span className="text-xs text-gray-500 ml-2 truncate">{subtitle}</span>
          )}
        </div>

        {/* Count badge */}
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${colors.badge}`}
        >
          {count}
        </span>
      </button>

      {/* Expandable content */}
      <div
        ref={contentRef}
        style={{ maxHeight: expanded ? height ?? 'none' : 0 }}
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
      >
        <div className="border-t border-gray-100">{children}</div>
      </div>
    </div>
  );
}
