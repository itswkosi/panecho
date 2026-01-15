import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ComparisonView } from '@/components/results/ComparisonView';

describe('ComparisonView', () => {
  it('renders with current and previous slices', () => {
    const currentDate = new Date('2024-05-15');
    const previousDate = new Date('2024-01-15');

    render(
      <ComparisonView
        currentSlices={[{ url: '/current.jpg', sliceNumber: 1 }]}
        previousSlices={[{ url: '/previous.jpg', sliceNumber: 1 }]}
        currentDate={currentDate}
        previousDate={previousDate}
      />
    );

    expect(screen.getByText('1 / 1')).toBeInTheDocument();
  });

  it('renders empty state when no current slices', () => {
    const currentDate = new Date('2024-05-15');
    const previousDate = new Date('2024-01-15');

    render(
      <ComparisonView
        currentSlices={[]}
        previousSlices={[]}
        currentDate={currentDate}
        previousDate={previousDate}
      />
    );

    expect(screen.getByText('No comparison slices available')).toBeInTheDocument();
  });

  it('displays slice navigation controls', () => {
    const currentDate = new Date('2024-05-15');
    const previousDate = new Date('2024-01-15');

    render(
      <ComparisonView
        currentSlices={[
          { url: '/slice1.jpg', sliceNumber: 1 },
          { url: '/slice2.jpg', sliceNumber: 2 },
        ]}
        previousSlices={[{ url: '/previous1.jpg', sliceNumber: 1 }]}
        currentDate={currentDate}
        previousDate={previousDate}
      />
    );

    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('displays zoom percentage', () => {
    const currentDate = new Date('2024-05-15');
    const previousDate = new Date('2024-01-15');

    render(
      <ComparisonView
        currentSlices={[{ url: '/current.jpg', sliceNumber: 1 }]}
        previousSlices={[{ url: '/previous.jpg', sliceNumber: 1 }]}
        currentDate={currentDate}
        previousDate={previousDate}
      />
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays date labels for both scans', () => {
    const currentDate = new Date('2024-05-15');
    const previousDate = new Date('2024-01-15');

    render(
      <ComparisonView
        currentSlices={[{ url: '/current.jpg', sliceNumber: 1 }]}
        previousSlices={[{ url: '/previous.jpg', sliceNumber: 1 }]}
        currentDate={currentDate}
        previousDate={previousDate}
      />
    );

    expect(screen.getByText('Current Scan')).toBeInTheDocument();
    expect(screen.getByText('Previous Scan')).toBeInTheDocument();
  });
});
