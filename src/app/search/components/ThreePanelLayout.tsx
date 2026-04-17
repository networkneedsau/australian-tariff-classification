'use client';

interface ThreePanelLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  topBar: React.ReactNode;
  leftCollapsed?: boolean;
  rightCollapsed?: boolean;
  onToggleLeft?: () => void;
  onToggleRight?: () => void;
}

export default function ThreePanelLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  topBar,
  leftCollapsed = false,
  rightCollapsed = false,
  onToggleLeft,
  onToggleRight,
}: ThreePanelLayoutProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Top Bar */}
      <div className="shrink-0">{topBar}</div>

      {/* Three-panel body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel */}
        <div
          className="shrink-0 bg-white border-r border-gray-200 overflow-hidden transition-[width] duration-300 ease-in-out"
          style={{ width: leftCollapsed ? 0 : 280 }}
        >
          <div className="w-[280px] h-full overflow-y-auto">{leftPanel}</div>
        </div>

        {/* Left toggle button */}
        {onToggleLeft && (
          <button
            onClick={onToggleLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-r-md shadow-sm px-1 py-3 hover:bg-gray-50 transition-all"
            style={{ left: leftCollapsed ? 0 : 280 }}
            title={leftCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            <svg
              className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
                leftCollapsed ? '' : 'rotate-180'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Center Panel */}
        <div className="flex-1 overflow-y-auto min-w-0">{centerPanel}</div>

        {/* Right toggle button */}
        {onToggleRight && (
          <button
            onClick={onToggleRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-l-md shadow-sm px-1 py-3 hover:bg-gray-50 transition-all"
            style={{ right: rightCollapsed ? 0 : 320 }}
            title={rightCollapsed ? 'Show panel' : 'Hide panel'}
          >
            <svg
              className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
                rightCollapsed ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Right Panel */}
        <div
          className="shrink-0 bg-white border-l border-gray-200 overflow-hidden transition-[width] duration-300 ease-in-out"
          style={{ width: rightCollapsed ? 0 : 320 }}
        >
          <div className="w-[320px] h-full overflow-y-auto">{rightPanel}</div>
        </div>
      </div>
    </div>
  );
}
