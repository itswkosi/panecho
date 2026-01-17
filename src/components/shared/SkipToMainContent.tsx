'use client';

import { Button } from '@/components/ui/button';

/**
 * Skip to Main Content Link
 * Accessibility feature for keyboard navigation
 * Allows users to skip repeated navigation elements
 * Visible on focus only
 */
export function SkipToMainContent() {
  const handleSkip = () => {
    const main = document.getElementById('main-content');
    if (main) {
      main.focus();
      main.scrollIntoView();
    }
  };

  return (
    <Button
      onClick={handleSkip}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleSkip();
        }
      }}
      className="absolute top-0 left-0 -translate-y-full focus:translate-y-0 z-50 bg-blue-600 hover:bg-blue-700 text-white"
      aria-label="Skip to main content"
    >
      Skip to main content
    </Button>
  );
}
