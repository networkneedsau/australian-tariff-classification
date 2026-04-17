'use client';

/**
 * Renders full legal text content from legislation EPUBs with proper formatting.
 * Handles [Definition], [Note], [Schedule], paragraph markers, and section references.
 */

interface LegalTextRendererProps {
  content: string;
  className?: string;
}

export default function LegalTextRenderer({ content, className = '' }: LegalTextRendererProps) {
  if (!content) return null;

  // Split content into lines and render each with appropriate styling
  const lines = content.split('\n');

  return (
    <div className={`text-sm leading-relaxed text-gray-700 space-y-1.5 ${className}`}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // [Definition] markers — render as definition term
        if (trimmed.startsWith('[Definition]')) {
          const defText = trimmed.replace('[Definition]', '').trim();
          return (
            <div key={i} className="pl-4 py-1 border-l-2 border-purple-300 bg-purple-50/50 rounded-r">
              <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider">Definition</span>
              <p className="text-sm text-purple-900 mt-0.5">{defText}</p>
            </div>
          );
        }

        // [Note] or [Note:...] markers
        if (trimmed.startsWith('[Note') || trimmed.startsWith('Note:') || trimmed.startsWith('Note ')) {
          return (
            <div key={i} className="pl-4 py-1 border-l-2 border-amber-300 bg-amber-50/50 rounded-r text-xs text-amber-800 italic">
              {trimmed}
            </div>
          );
        }

        // [SubsectionHead] markers — bold subheading
        if (trimmed.startsWith('[SubsectionHead]')) {
          const headText = trimmed.replace('[SubsectionHead]', '').trim();
          return (
            <p key={i} className="font-semibold text-gray-900 mt-3 mb-1 text-sm">{headText}</p>
          );
        }

        // Paragraph markers (a), (b), (i), (ii) etc — indented
        if (/^\([a-z]\)/.test(trimmed) || /^\([ivxlc]+\)/.test(trimmed)) {
          return (
            <p key={i} className="pl-6 text-sm text-gray-700 leading-relaxed">{trimmed}</p>
          );
        }

        // Sub-paragraphs (A), (B) etc
        if (/^\([A-Z]\)/.test(trimmed)) {
          return (
            <p key={i} className="pl-10 text-sm text-gray-600 leading-relaxed">{trimmed}</p>
          );
        }

        // Indented items starting with dash or bullet
        if (trimmed.startsWith('—') || trimmed.startsWith('–') || trimmed.startsWith('-  ')) {
          return (
            <p key={i} className="pl-8 text-sm text-gray-700 leading-relaxed">{trimmed}</p>
          );
        }

        // Subsection numbers like (1), (2), (2A) — slightly bold
        if (/^\(\d+[A-Z]?\)/.test(trimmed)) {
          return (
            <p key={i} className="text-sm text-gray-800 leading-relaxed mt-2">
              <span className="font-medium text-gray-900">{trimmed.match(/^\(\d+[A-Z]?\)/)?.[0]}</span>
              {trimmed.replace(/^\(\d+[A-Z]?\)/, '')}
            </p>
          );
        }

        // Schedule references
        if (trimmed.startsWith('Schedule ') && trimmed.length < 100) {
          return (
            <p key={i} className="font-semibold text-blue-800 mt-3 mb-1">{trimmed}</p>
          );
        }

        // Regular paragraph
        return (
          <p key={i} className="text-sm text-gray-700 leading-relaxed">{trimmed}</p>
        );
      })}
    </div>
  );
}
