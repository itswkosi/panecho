import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EducationalContent } from '@/components/processing/EducationalContent';

describe('EducationalContent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render the first content slide by default', () => {
    render(<EducationalContent />);

    expect(screen.getByText('What is Pancreatic Imaging?')).toBeInTheDocument();
    expect(
      screen.getByText(/Modern imaging techniques like CT and MRI allow doctors/),
    ).toBeInTheDocument();
  });

  it('should show slide counter', () => {
    render(<EducationalContent />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('of')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('should render all navigation dots', () => {
    render(<EducationalContent />);

    const dots = screen.getAllByRole('button', { name: /Go to slide/ });
    expect(dots).toHaveLength(6);
  });

  it('should highlight the current slide dot', () => {
    render(<EducationalContent />);

    const dots = screen.getAllByRole('button', { name: /Go to slide/ });
    expect(dots[0]).toHaveClass('bg-blue-500');
    expect(dots[1]).not.toHaveClass('bg-blue-500');
  });

  it('should navigate to a slide when dot is clicked', async () => {
    render(<EducationalContent />);

    const secondDot = screen.getByRole('button', { name: /Go to slide 2/ });
    fireEvent.click(secondDot);

    // Wait for fade transition
    await waitFor(
      () => {
        expect(screen.getByText('The Role of AI in Medical Analysis')).toBeInTheDocument();
      },
      { timeout: 500 },
    );
  });

  it('should update slide counter when navigating', async () => {
    render(<EducationalContent />);

    const thirdDot = screen.getByRole('button', { name: /Go to slide 3/ });
    fireEvent.click(thirdDot);

    await waitFor(
      () => {
        const counts = screen.getAllByText('3');
        expect(counts.some((el) => el.textContent?.includes('3'))).toBeTruthy();
      },
      { timeout: 500 },
    );
  });

  it('should auto-rotate slides when autoPlay is true', async () => {
    render(<EducationalContent autoPlay={true} rotationInterval={1000} />);

    expect(screen.getByText('What is Pancreatic Imaging?')).toBeInTheDocument();

    // Advance timer
    vi.advanceTimersByTime(1000 + 300); // interval + transition

    await waitFor(() => {
      expect(screen.getByText('The Role of AI in Medical Analysis')).toBeInTheDocument();
    });
  });

  it('should not auto-rotate when autoPlay is false', () => {
    render(<EducationalContent autoPlay={false} />);

    const firstTitle = screen.getByText('What is Pancreatic Imaging?');
    expect(firstTitle).toBeInTheDocument();

    vi.advanceTimersByTime(10000);

    // Should still show first slide
    expect(screen.getByText('What is Pancreatic Imaging?')).toBeInTheDocument();
  });

  it('should apply fade transition class on rotate', async () => {
    const { container } = render(<EducationalContent autoPlay={true} rotationInterval={1000} />);

    vi.advanceTimersByTime(1000);

    // Check for opacity transition
    const contentDiv = container.querySelector('.transition-opacity');
    expect(contentDiv).toBeInTheDocument();

    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('The Role of AI in Medical Analysis')).toBeInTheDocument();
    });
  });

  it('should cycle through all 6 slides', async () => {
    render(<EducationalContent autoPlay={true} rotationInterval={100} />);

    const slides = [
      'What is Pancreatic Imaging?',
      'The Role of AI in Medical Analysis',
      'Understanding Radiomics',
      'Longitudinal Analysis Benefits',
      'Clinical Decision Support',
      'Patient Privacy & Security',
    ];

    for (const slide of slides) {
      expect(screen.getByText(slide)).toBeInTheDocument();
      vi.advanceTimersByTime(100 + 300);

      await waitFor(() => {
        // Just check that component is still mounted
        expect(screen.getByRole('button', { name: /Go to slide 1/ })).toBeInTheDocument();
      });
    }
  });

  it('should render hint text about navigation', () => {
    render(<EducationalContent />);

    expect(screen.getByText(/Content rotates every 10 seconds/)).toBeInTheDocument();
    expect(screen.getByText(/Click any dot to navigate/)).toBeInTheDocument();
  });

  it('should have accessible navigation dots with aria-current', () => {
    render(<EducationalContent />);

    const dots = screen.getAllByRole('button', { name: /Go to slide/ });
    expect(dots[0]).toHaveAttribute('aria-current', 'page');
    expect(dots[1]).not.toHaveAttribute('aria-current');
  });

  it('should handle rapid navigation clicks', async () => {
    render(<EducationalContent />);

    const secondDot = screen.getByRole('button', { name: /Go to slide 2/ });
    const fourthDot = screen.getByRole('button', { name: /Go to slide 4/ });

    fireEvent.click(secondDot);
    fireEvent.click(fourthDot);

    vi.advanceTimersByTime(600); // Two transition times

    await waitFor(() => {
      expect(screen.getByText('Longitudinal Analysis Benefits')).toBeInTheDocument();
    });
  });

  it('should render all content titles', () => {
    const { rerender } = render(<EducationalContent autoPlay={false} />);

    const titles = [
      'What is Pancreatic Imaging?',
      'The Role of AI in Medical Analysis',
      'Understanding Radiomics',
      'Longitudinal Analysis Benefits',
      'Clinical Decision Support',
      'Patient Privacy & Security',
    ];

    titles.forEach((title, index) => {
      if (index > 0) {
        const dot = screen.getByRole('button', { name: `Go to slide ${index + 1}` });
        fireEvent.click(dot);
        vi.advanceTimersByTime(300);
      }

      rerender(<EducationalContent autoPlay={false} />);
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it('should update dot styling on navigation', async () => {
    render(<EducationalContent autoPlay={false} />);

    const secondDot = screen.getByRole('button', { name: /Go to slide 2/ });
    fireEvent.click(secondDot);

    vi.advanceTimersByTime(300);

    await waitFor(() => {
      const dots = screen.getAllByRole('button', { name: /Go to slide/ });
      expect(dots[1]).toHaveClass('bg-blue-500');
      expect(dots[0]).not.toHaveClass('bg-blue-500');
    });
  });

  it('should use custom rotation interval', async () => {
    render(<EducationalContent autoPlay={true} rotationInterval={500} />);

    expect(screen.getByText('What is Pancreatic Imaging?')).toBeInTheDocument();

    vi.advanceTimersByTime(500 + 300);

    await waitFor(() => {
      expect(screen.getByText('The Role of AI in Medical Analysis')).toBeInTheDocument();
    });
  });

  it('should cleanup interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = render(<EducationalContent autoPlay={true} rotationInterval={1000} />);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should have proper contrast for readability', () => {
    const { container } = render(<EducationalContent />);

    const titleElement = container.querySelector('h3');
    expect(titleElement).toHaveClass('text-gray-900');

    const descriptionElement = container.querySelector('p');
    expect(descriptionElement).toHaveClass('text-gray-700');
  });
});
