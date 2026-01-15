import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EducationalContent } from '@/components/processing/EducationalContent';

describe('EducationalContent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render first content slide by default', () => {
    render(<EducationalContent />);
    expect(screen.getByText('What is Pancreatic Imaging?')).toBeInTheDocument();
  });

  it('should show slide counter', () => {
    render(<EducationalContent />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('should render navigation dots', () => {
    render(<EducationalContent />);
    const dots = screen.getAllByRole('button', { name: /Go to slide/ });
    expect(dots).toHaveLength(6);
  });

  it('should highlight current slide dot', () => {
    render(<EducationalContent />);
    const dots = screen.getAllByRole('button', { name: /Go to slide/ });
    expect(dots[0]).toHaveClass('bg-blue-500');
    expect(dots[1]).not.toHaveClass('bg-blue-500');
  });

  it('should not auto-rotate when autoPlay is false', () => {
    render(<EducationalContent autoPlay={false} />);

    const firstTitle = screen.getByText('What is Pancreatic Imaging?');
    expect(firstTitle).toBeInTheDocument();

    vi.advanceTimersByTime(10000);

    // Should still show first slide
    expect(screen.getByText('What is Pancreatic Imaging?')).toBeInTheDocument();
  });

  it('should render hint text about navigation', () => {
    render(<EducationalContent />);
    expect(screen.getByText(/Content rotates every 10 seconds/)).toBeInTheDocument();
    expect(screen.getByText(/Click any dot to navigate/)).toBeInTheDocument();
  });

  it('should have accessible navigation dots', () => {
    render(<EducationalContent />);
    const dots = screen.getAllByRole('button', { name: /Go to slide/ });
    expect(dots[0]).toHaveAttribute('aria-current', 'page');
    expect(dots[1]).not.toHaveAttribute('aria-current');
  });

  it('should render content in a card', () => {
    const { container } = render(<EducationalContent />);
    const card = container.querySelector('.rounded-lg.border.border-gray-200.bg-white');
    expect(card).toBeInTheDocument();
  });

  it('should have proper contrast for readability', () => {
    const { container } = render(<EducationalContent />);
    const titleElement = container.querySelector('h3');
    expect(titleElement).toHaveClass('text-gray-900');
  });
});
