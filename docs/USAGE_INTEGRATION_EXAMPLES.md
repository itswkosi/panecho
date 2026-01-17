# Usage Tracking Integration Guide

Quick integration examples for common PanEcho scenarios.

## Dashboard Page

```tsx
// app/(protected)/dashboard/page.tsx
'use client';

import { UsageDisplay } from '@/components/usage/UsageDisplay';
import { UsageWidget } from '@/components/usage/UsageWidget';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>

      {/* Main usage display */}
      <UsageDisplay
        onLimitExceeded={() => {
          // Redirect to upgrade or show modal
        }}
      />

      {/* Your dashboard content */}
      <div className="grid gap-4">
        {/* Other dashboard items */}
      </div>
    </div>
  );
}
```

## Upload Page

```tsx
// app/(protected)/upload/page.tsx
'use client';

import { useState } from 'react';
import { useCheckUsage } from '@/lib/hooks/useCheckUsage';
import { useUsage } from '@/lib/hooks/useUsage';

export default function UploadPage() {
  const { checkAndExecute, canProceed } = useCheckUsage({
    onFail: () => {
      // Show toast or modal
      toast.error('Upload limit exceeded. Please upgrade your plan.');
    },
  });
  const { remainingScans, isLimitExceeded } = useUsage();

  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (file: File) => {
    if (isLimitExceeded) {
      toast.error('Cannot upload: Usage limit exceeded');
      return;
    }

    setIsUploading(true);
    await checkAndExecute(async () => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        toast.success('File uploaded successfully!');
      } catch (error) {
        toast.error('Upload failed');
      } finally {
        setIsUploading(false);
      }
    });
  };

  return (
    <div>
      <h1>Upload Scan</h1>

      {remainingScans === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have reached your scan limit. Upgrade your plan to upload more scans.
          </AlertDescription>
        </Alert>
      )}

      <FileUpload
        disabled={isLimitExceeded || isUploading}
        onFileSelect={handleFileChange}
        isLoading={isUploading}
      />

      {!isLimitExceeded && remainingScans && (
        <p className="text-sm text-slate-600">
          You have {remainingScans} scans remaining in your plan.
        </p>
      )}
    </div>
  );
}
```

## Processing Page

```tsx
// app/(protected)/processing/page.tsx
'use client';

import { useUsage } from '@/lib/hooks/useUsage';
import { Card } from '@/components/ui/card';

export default function ProcessingPage() {
  const { usageData, isLimitExceeded, remainingStorage } = useUsage();

  if (!usageData) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1>Process Scans</h1>

      {/* Quick usage summary */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600">Scans Used</p>
            <p className="text-2xl font-bold">
              {usageData.scanCount}/{usageData.scanLimit}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Storage Used</p>
            <p className="text-2xl font-bold">
              {usageData.storageUsedGB.toFixed(2)}/{usageData.storageLimitGB} GB
            </p>
          </div>
        </div>
      </Card>

      {isLimitExceeded && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-900 font-medium">
            Your usage limit has been exceeded. Please upgrade your plan to continue processing.
          </p>
        </Card>
      )}

      {/* Processing content */}
      <div>
        {/* Your processing UI */}
      </div>
    </div>
  );
}
```

## Header Component

```tsx
// components/Header.tsx
'use client';

import { UsageWidget } from '@/components/usage/UsageWidget';

export function Header() {
  return (
    <header className="flex justify-between items-center p-4">
      <div>
        <h1 className="text-2xl font-bold">PanEcho</h1>
      </div>

      <nav className="flex items-center gap-6">
        <a href="/dashboard">Dashboard</a>
        <a href="/upload">Upload</a>
        
        {/* Compact usage widget in header */}
        <UsageWidget compact={true} />
      </nav>
    </header>
  );
}
```

## Settings Page

```tsx
// app/(protected)/settings/page.tsx
'use client';

import { UsageDisplay } from '@/components/usage/UsageDisplay';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const handleUpgrade = () => {
    // Redirect to upgrade/pricing page
    window.location.href = '/pricing';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-slate-600">Manage your account and subscription</p>
      </div>

      {/* Usage section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Usage & Billing</h2>
        <UsageDisplay />
        
        <div className="mt-4">
          <Button onClick={handleUpgrade}>
            Upgrade Plan
          </Button>
        </div>
      </div>

      {/* Other settings sections */}
      <div>
        <h2 className="text-xl font-semibold">Account</h2>
        {/* Account settings */}
      </div>
    </div>
  );
}
```

## Batch Processing

```tsx
// Example: Batch process with usage check
'use client';

import { useCheckUsage } from '@/lib/hooks/useCheckUsage';
import { useUsage } from '@/lib/hooks/useUsage';

export function BatchProcessor() {
  const { checkAndExecute } = useCheckUsage();
  const { remainingScans } = useUsage();

  const handleBatchProcess = async (files: File[]) => {
    // Check if we have enough quota
    if (files.length > remainingScans) {
      toast.error(
        `You only have ${remainingScans} scans remaining. Please upgrade to process ${files.length} files.`
      );
      return;
    }

    await checkAndExecute(async () => {
      // Process all files
      for (const file of files) {
        await uploadFile(file);
      }
    });
  };

  return (
    <div>
      {/* UI for batch upload */}
    </div>
  );
}
```

## Quota Warning Modal

```tsx
// components/QuotaWarningModal.tsx
'use client';

import { useUsage } from '@/lib/hooks/useUsage';
import { useCallback, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function QuotaWarningModal() {
  const { hasWarning, isLimitExceeded, usageData } = useUsage();
  const [open, setOpen] = useState(false);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  if (!hasWarning && !isLimitExceeded) {
    return null;
  }

  const title = isLimitExceeded ? 'Usage Limit Reached' : 'Usage Warning';
  const description = isLimitExceeded
    ? 'You have reached your usage limit. Upgrade your plan to continue.'
    : `You are using ${usageData?.percentageUsed}% of your quota. Consider upgrading soon.`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm">
            Scans: {usageData?.scanCount} / {usageData?.scanLimit}
          </p>
          <p className="text-sm">
            Storage: {usageData?.storageUsedGB.toFixed(2)} / {usageData?.storageLimitGB} GB
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {isLimitExceeded ? 'Dismiss' : 'Later'}
          </Button>
          <Button onClick={() => (window.location.href = '/pricing')}>
            {isLimitExceeded ? 'Upgrade Now' : 'View Plans'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Layout Integration

```tsx
// app/(protected)/layout.tsx
import { UsageProvider } from '@/components/providers/UsageProvider';
import { QuotaWarningModal } from '@/components/QuotaWarningModal';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UsageProvider>
      <div className="min-h-screen">
        <Header />
        
        <main className="p-4">
          {children}
        </main>
        
        {/* Show quota warning modal */}
        <QuotaWarningModal />
      </div>
    </UsageProvider>
  );
}
```

## API Route Example

If you need to check usage in API routes:

```typescript
// app/api/upload/route.ts
import { checkUsageLimit } from '@/lib/usage/tracker';
import { getUser } from '@/app/actions/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check usage limit
  const usage = await checkUsageLimit(user.id);
  if (usage.isLimitExceeded) {
    return NextResponse.json(
      { error: 'Usage limit exceeded' },
      { status: 429 }
    );
  }

  // Process upload
  const formData = await request.formData();
  // ... rest of upload logic

  return NextResponse.json({ success: true });
}
```

## Error Handling

```tsx
'use client';

import { useUsage } from '@/lib/hooks/useUsage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function SafeComponent() {
  const { usageData, error, clearError } = useUsage();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex justify-between">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-sm underline"
          >
            Retry
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!usageData) {
    return <div className="animate-pulse">Loading usage...</div>;
  }

  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

## Testing Integration

When testing components that use usage tracking:

```typescript
// test/components/MyComponent.test.tsx
import { useUsage } from '@/lib/hooks/useUsage';

vi.mock('@/lib/hooks/useUsage');

describe('MyComponent', () => {
  beforeEach(() => {
    vi.mocked(useUsage).mockReturnValue({
      usageData: {
        isLimitExceeded: false,
        scanCount: 5,
        scanLimit: 10,
        remainingScanCount: 5,
        storageUsedGB: 1,
        storageLimitGB: 5,
        remainingStorageGB: 4,
        percentageUsed: 50,
        storagePercentageUsed: 20,
        planType: 'pro',
      },
      loading: false,
      error: null,
      isLimitExceeded: false,
      hasWarning: false,
      remainingScans: 5,
      remainingStorage: 4,
      fetchUsageData: vi.fn(),
      clearError: vi.fn(),
    });
  });

  it('should render with usage data', () => {
    render(<MyComponent />);
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
  });
});
```
