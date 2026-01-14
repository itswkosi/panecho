'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateForInput } from '@/lib/utils/date';

export interface FileWithoutDate {
  name: string;
  index: number;
}

interface DateAssignmentModalProps {
  isOpen: boolean;
  files: FileWithoutDate[];
  onAssignDates: (dates: Record<number, string>) => void; // index -> YYYY-MM-DD
  onCancel: () => void;
}

/**
 * Modal for assigning scan dates to files without DICOM metadata
 */
export function DateAssignmentModal({
  isOpen,
  files,
  onAssignDates,
  onCancel,
}: DateAssignmentModalProps) {
  const today = new Date();
  const defaultDate = formatDateForInput(today);

  // Initialize dates object with default dates
  const [dates, setDates] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    files.forEach((file) => {
      initial[file.index] = defaultDate;
    });
    return initial;
  });

  const handleDateChange = (index: number, value: string) => {
    setDates((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const handleSubmit = () => {
    // Validate all dates are assigned
    const hasAllDates = files.every((file) => dates[file.index] && dates[file.index].trim());

    if (!hasAllDates) {
      alert('Please assign a date to all files');
      return;
    }

    onAssignDates(dates);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Scan Dates</DialogTitle>
          <DialogDescription>
            These files don't have DICOM metadata. Please assign a scan date to each file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto py-4">
          {files.map((file) => (
            <div key={file.index} className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {file.name}
              </label>
              <Input
                type="date"
                value={dates[file.index] || ''}
                onChange={(e) => handleDateChange(file.index, e.target.value)}
                max={formatDateForInput(new Date())} // Don't allow future dates
                className="w-full"
              />
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
          >
            Assign Dates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
