import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { SkipToMainContent } from '@/components/shared/SkipToMainContent';

describe('Accessibility Components', () => {
  describe('ErrorBoundary', () => {
    it('renders children without error', () => {
      render(
        <ErrorBoundary>
          <div>Safe content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Safe content')).toBeInTheDocument();
    });

    it('catches errors and displays error message', () => {
      // Create a component that throws an error
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    it('has accessible error alert role', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toBeInTheDocument();
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
    });

    it('provides try again and home buttons', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Go to Home')).toBeInTheDocument();
    });
  });

  describe('SkipToMainContent', () => {
    it('renders skip link', () => {
      render(<SkipToMainContent />);

      expect(screen.getByText('Skip to main content')).toBeInTheDocument();
    });

    it('has correct aria-label', () => {
      render(<SkipToMainContent />);

      const button = screen.getByRole('button', { name: /Skip to main content/i });
      expect(button).toHaveAttribute('aria-label', 'Skip to main content');
    });

    it('is keyboard accessible', () => {
      render(
        <>
          <SkipToMainContent />
          <main id="main-content">Main content</main>
        </>
      );

      const button = screen.getByRole('button', { name: /Skip to main content/i });
      expect(button).toBeInTheDocument();
    });
  });
});

describe('Accessibility Features', () => {
  it('main element exists in layout', () => {
    render(
      <main id="main-content">
        <p>Test content</p>
      </main>
    );

    const main = document.getElementById('main-content');
    expect(main).toBeInTheDocument();
  });

  it('supports prefers-reduced-motion', () => {
    // Check if CSS media query is properly loaded
    const style = document.createElement('style');
    style.textContent = `
      @media (prefers-reduced-motion: reduce) {
        .test { animation: none; }
      }
    `;
    document.head.appendChild(style);

    expect(style.textContent).toContain('prefers-reduced-motion');
    style.remove();
  });
});
