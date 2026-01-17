import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RetentionNotification } from '@/components/shared/RetentionNotification';
import { DeletionConfirmationDialog } from '@/components/shared/DeletionConfirmationDialog';
import type { RetentionStatus } from '@/lib/retention/manager';

describe('RetentionNotification Component', () => {
  const mockRetentionStatuses: RetentionStatus[] = [
    {
      scanId: 'scan-1',
      scanDate: new Date('2026-01-10'),
      daysRemaining: 5,
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      canExtend: true,
      extensionCount: 0,
    },
  ];

  it('renders notification banner', () => {
    render(
      <RetentionNotification retentionStatuses={mockRetentionStatuses} />
    );

    expect(screen.getByText(/Data Retention Warning/i)).toBeInTheDocument();
  });

  it('displays correct number of days remaining', () => {
    render(
      <RetentionNotification retentionStatuses={mockRetentionStatuses} />
    );

    expect(screen.getByText(/5 days/i)).toBeInTheDocument();
  });

  it('shows extend button when can extend', () => {
    render(
      <RetentionNotification retentionStatuses={mockRetentionStatuses} />
    );

    expect(screen.getByText(/Extend/i)).toBeInTheDocument();
  });

  it('hides extend button when cannot extend', () => {
    const noExtendStatus: RetentionStatus[] = [
      {
        ...mockRetentionStatuses[0],
        canExtend: false,
        extensionCount: 3,
      },
    ];

    render(
      <RetentionNotification retentionStatuses={noExtendStatus} />
    );

    expect(screen.queryByText(/Extend/i)).not.toBeInTheDocument();
  });

  it('calls onExtend when extend button clicked', async () => {
    const mockOnExtend = vi.fn();
    render(
      <RetentionNotification
        retentionStatuses={mockRetentionStatuses}
        onExtend={mockOnExtend}
      />
    );

    const extendButton = screen.getByText(/Extend/i);
    fireEvent.click(extendButton);

    await waitFor(() => {
      expect(mockOnExtend).toHaveBeenCalledWith('scan-1');
    });
  });

  it('calls onDelete when delete button clicked', async () => {
    const mockOnDelete = vi.fn();
    render(
      <RetentionNotification
        retentionStatuses={mockRetentionStatuses}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByText(/Delete Now/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith('scan-1');
    });
  });

  it('dismisses notification when X clicked', async () => {
    const { container } = render(
      <RetentionNotification retentionStatuses={mockRetentionStatuses} />
    );

    const dismissButton = container.querySelector(
      'button[aria-label="Dismiss notification"]'
    );

    if (dismissButton) {
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText(/Data Retention Warning/i)).not.toBeInTheDocument();
      });
    }
  });

  it('stores dismissed state in localStorage', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(
      <RetentionNotification retentionStatuses={mockRetentionStatuses} />
    );

    const dismissButton = screen.getByRole('button', { name: /Dismiss/i });
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith(
        'dismissedRetentionNotifications',
        expect.stringContaining('scan-1')
      );
    });

    setItemSpy.mockRestore();
  });

  it('renders nothing when no statuses', () => {
    const { container } = render(<RetentionNotification retentionStatuses={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders multiple notifications', () => {
    const multipleStatuses: RetentionStatus[] = [
      {
        scanId: 'scan-1',
        scanDate: new Date('2026-01-10'),
        daysRemaining: 5,
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        canExtend: true,
        extensionCount: 0,
      },
      {
        scanId: 'scan-2',
        scanDate: new Date('2026-01-12'),
        daysRemaining: 8,
        expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        canExtend: true,
        extensionCount: 1,
      },
    ];

    render(
      <RetentionNotification retentionStatuses={multipleStatuses} />
    );

    expect(screen.getByText(/5 days/i)).toBeInTheDocument();
    expect(screen.getByText(/8 days/i)).toBeInTheDocument();
  });
});

describe('DeletionConfirmationDialog Component', () => {
  it('renders dialog when open', () => {
    render(
      <DeletionConfirmationDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText(/Delete This Scan/i)).toBeInTheDocument();
  });

  it('hides dialog when not open', () => {
    const { container } = render(
      <DeletionConfirmationDialog
        isOpen={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(container.querySelector('[role="alertdialog"]')).not.toBeInTheDocument();
  });

  it('shows different title for delete all', () => {
    render(
      <DeletionConfirmationDialog
        isOpen={true}
        isDeletingAll={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText(/Delete All Your Data/i)).toBeInTheDocument();
  });

  it('requires typing DELETE to confirm', async () => {
    const mockOnConfirm = vi.fn();
    render(
      <DeletionConfirmationDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByPlaceholderText(/Type DELETE to confirm/i);
    const confirmButton = screen.getByText(/Delete Permanently/i);

    // Initially disabled
    expect(confirmButton).toBeDisabled();

    // Type DELETE
    fireEvent.change(input, { target: { value: 'DELETE' } });

    await waitFor(() => {
      expect(confirmButton).not.toBeDisabled();
    });
  });

  it('converts text to uppercase', async () => {
    render(
      <DeletionConfirmationDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(
      /Type DELETE to confirm/i
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'delete' } });

    await waitFor(() => {
      expect(input.value).toBe('DELETE');
    });
  });

  it('calls onConfirm when confirmed', async () => {
    const mockOnConfirm = vi.fn();
    render(
      <DeletionConfirmationDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByPlaceholderText(/Type DELETE to confirm/i);
    fireEvent.change(input, { target: { value: 'DELETE' } });

    const confirmButton = screen.getByText(/Delete Permanently/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled();
    });
  });

  it('shows warning for delete all', () => {
    render(
      <DeletionConfirmationDialog
        isOpen={true}
        isDeletingAll={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(
      screen.getByText(/all your scans, analyses, and data/i)
    ).toBeInTheDocument();
  });

  it('disables buttons during submission', async () => {
    const mockOnConfirm = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <DeletionConfirmationDialog
        isOpen={true}
        isLoading={true}
        onOpenChange={vi.fn()}
        onConfirm={mockOnConfirm}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('closes dialog after confirmation', async () => {
    const mockOnOpenChange = vi.fn();
    const mockOnConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <DeletionConfirmationDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByPlaceholderText(/Type DELETE to confirm/i);
    fireEvent.change(input, { target: { value: 'DELETE' } });

    const confirmButton = screen.getByText(/Delete Permanently/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
