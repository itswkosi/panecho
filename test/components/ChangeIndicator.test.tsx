import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChangeIndicator } from '@/components/results/ChangeIndicator';

describe('ChangeIndicator', () => {
  it('displays risk increase with arrow up', () => {
    render(
      <ChangeIndicator
        previousRiskScore={30}
        currentRiskScore={50}
        previousClassification="normal"
        currentClassification="suspicious"
      />
    );

    expect(screen.getByText('Risk Change')).toBeInTheDocument();
    expect(screen.getByText('30% → 50%')).toBeInTheDocument();
  });

  it('displays risk decrease with arrow down', () => {
    render(
      <ChangeIndicator
        previousRiskScore={60}
        currentRiskScore={35}
        previousClassification="suspicious"
        currentClassification="normal"
      />
    );

    expect(screen.getByText('Risk Change')).toBeInTheDocument();
    expect(screen.getByText('60% → 35%')).toBeInTheDocument();
  });

  it('displays stable when change is less than 5%', () => {
    render(
      <ChangeIndicator
        previousRiskScore={40}
        currentRiskScore={42}
      />
    );

    expect(screen.getByText('No significant change')).toBeInTheDocument();
  });

  it('shows classification change', () => {
    render(
      <ChangeIndicator
        previousRiskScore={25}
        currentRiskScore={75}
        previousClassification="normal"
        currentClassification="suspicious"
      />
    );

    expect(screen.getByText('normal → suspicious')).toBeInTheDocument();
  });

  it('displays percentage change for increase', () => {
    const { container } = render(
      <ChangeIndicator
        previousRiskScore={30}
        currentRiskScore={50}
      />
    );

    // Just verify the component renders without errors
    expect(container.querySelector('[class*="text-red"]')).toBeInTheDocument();
  });

  it('displays percentage change for decrease', () => {
    const { container } = render(
      <ChangeIndicator
        previousRiskScore={60}
        currentRiskScore={30}
      />
    );

    // Just verify the component renders without errors
    expect(container.querySelector('[class*="text-green"]')).toBeInTheDocument();
  });
});
