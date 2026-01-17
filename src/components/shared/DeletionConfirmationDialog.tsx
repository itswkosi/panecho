'use client';

import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DeletionConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  isDeletingAll?: boolean;
  itemDate?: string; // For single item deletion
}

/**
 * Confirmation dialog for data deletion
 * Requires typing "DELETE" to confirm
 * Shows special warning for "Delete All" operations
 * Accessible with focus trapping and ARIA labels
 */
export function DeletionConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  isLoading = false,
  isDeletingAll = false,
  itemDate,
}: DeletionConfirmationDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isConfirmed = confirmText === 'DELETE';

  const handleConfirm = async () => {
    if (!isConfirmed) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm();
      setConfirmText('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Focus input when dialog opens
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={!(isLoading || isSubmitting)}
        role="alertdialog"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="delete-dialog-title" className="text-red-600">
            {isDeletingAll ? 'Delete All Your Data?' : 'Delete This Scan?'}
          </DialogTitle>
          <DialogDescription id="delete-dialog-description" className="space-y-3">
            <div className="font-medium text-red-900">
              This action is permanent and cannot be undone.
            </div>

            {isDeletingAll ? (
              <div className="bg-red-50 border border-red-200 rounded p-3 space-y-2">
                <div className="text-sm text-red-900 font-medium">
                  ⚠️ All your scans, analyses, and data will be permanently deleted.
                </div>
                <div className="text-sm text-red-800">
                  This includes all uploaded files, AI analyses, and longitudinal comparisons.
                  You cannot recover this data.
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-700">
                The scan from <strong>{itemDate}</strong> and all its analyses will be deleted.
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="delete-confirm-input" className="text-sm font-medium text-slate-900 block">
                Type <code className="font-mono bg-slate-100 px-2 py-1 rounded">DELETE</code> to confirm:
              </label>
              <Input
                ref={inputRef}
                id="delete-confirm-input"
                placeholder="Type DELETE to confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                aria-required="true"
                aria-invalid={confirmText && !isConfirmed ? 'true' : 'false'}
                aria-describedby={confirmText && !isConfirmed ? 'delete-error' : undefined}
                className={`font-mono ${
                  confirmText && !isConfirmed ? 'border-red-300 bg-red-50' : ''
                }`}
                disabled={isLoading || isSubmitting}
              />
              {confirmText && !isConfirmed && (
                <p id="delete-error" className="text-sm text-red-600" role="alert">
                  Please type DELETE exactly to confirm deletion
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading || isSubmitting}
            aria-label="Cancel deletion"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmed || isLoading || isSubmitting}
            className="bg-red-600 hover:bg-red-700"
            aria-label={isDeletingAll ? 'Delete all your data permanently' : 'Delete this scan permanently'}
          >
            {isSubmitting || isLoading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
