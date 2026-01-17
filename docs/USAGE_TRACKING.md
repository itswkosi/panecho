# Usage Tracking System

A comprehensive React-based usage tracking and quota management system for PanEcho. This system monitors user scans and storage consumption, enforces limits based on subscription plans, and provides real-time feedback to users.

## Overview

The usage tracking system consists of:

1. **Server-side tracking** (`lib/usage/tracker.ts`) - Core logic for calculating usage and limits
2. **Server actions** (`app/actions/usage.ts`) - Safe server calls from client
3. **Global state** (`lib/hooks/useUsageStore.ts`) - Zustand store for caching
4. **React hooks** - Custom hooks for component integration
5. **UI components** - Pre-built components for displaying usage
6. **Context provider** - Optional context-based access

## Architecture

### Data Flow

```
┌─────────────────────────────────────────┐
│     Client Component                    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   useUsage() Hook    │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  useUsageStore       │
        │  (Zustand)           │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  checkUsageLimit()   │
        │  Server Action       │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   Server-side        │
        │   Tracker Logic      │
        │   (with DB)          │
        └──────────────────────┘
```

## Usage

### Basic Setup

1. **Add the provider to your layout:**

```tsx
// app/layout.tsx
import { UsageProvider } from '@/components/providers/UsageProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <UsageProvider>
          {children}
        </UsageProvider>
      </body>
    </html>
  );
}
```

2. **Display usage in your components:**

```tsx
import { UsageDisplay } from '@/components/usage/UsageDisplay';

export default function Dashboard() {
  return (
    <div>
      <UsageDisplay />
    </div>
  );
}
```

### Using Hooks

#### `useUsage()` - Main hook for accessing usage data

```tsx
import { useUsage } from '@/lib/hooks/useUsage';

export function MyComponent() {
  const {
    usageData,          // Full usage data object
    loading,            // Is fetching data
    error,              // Error message if any
    isLimitExceeded,    // Boolean - limit reached?
    hasWarning,         // Boolean - near limit? (>80%)
    remainingScans,     // Number of scans left
    remainingStorage,   // GB of storage left
    fetchUsageData,     // Refresh data manually
    clearError,         // Clear error state
  } = useUsage({
    autoFetch: true,                    // Fetch on mount (default: true)
    onLimitExceeded: (data) => {        // Callback when limit hit
      console.log('Limit exceeded!');
    }
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <p>Scans: {usageData?.scanCount} / {usageData?.scanLimit}</p>
      <p>Storage: {usageData?.storageUsedGB}GB / {usageData?.storageLimitGB}GB</p>
    </div>
  );
}
```

#### `useCheckUsage()` - Check before operations

```tsx
import { useCheckUsage } from '@/lib/hooks/useCheckUsage';

export function UploadButton() {
  const { canProceed, checkAndExecute } = useCheckUsage({
    onPass: () => console.log('Can upload!'),
    onFail: () => console.log('Limit exceeded, cannot upload'),
  });

  const handleUpload = async () => {
    await checkAndExecute(async () => {
      // This only runs if within limits
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
    });
  };

  return (
    <button onClick={handleUpload} disabled={!canProceed()}>
      Upload Scan
    </button>
  );
}
```

#### `useUsageContext()` - Access from context

```tsx
import { useUsageContext } from '@/components/providers/UsageProvider';

export function MyComponent() {
  const { usageData, fetchUsageData, isLimitExceeded } = useUsageContext();

  // Use like useUsage, but requires UsageProvider wrapper
}
```

### Components

#### `UsageDisplay` - Full usage information card

```tsx
import { UsageDisplay } from '@/components/usage/UsageDisplay';

export default function Settings() {
  return (
    <UsageDisplay
      showWarning={true}                    // Show alerts (default: true)
      onLimitExceeded={() => {              // Callback when limit hit
        redirectToUpgradePage();
      }}
    />
  );
}
```

Features:
- Shows scan count and storage usage
- Visual progress bars with color coding
- Alerts for warnings and limit exceeded
- Plan information display
- Loading and error states

#### `UsageWidget` - Compact usage indicator

```tsx
import { UsageWidget } from '@/components/usage/UsageWidget';

export function Header() {
  return (
    <header>
      <h1>My App</h1>
      {/* Compact mode - icon with tooltip */}
      <UsageWidget compact={true} />
      
      {/* Full mode - card display */}
      <UsageWidget compact={false} />
    </header>
  );
}
```

### Server Actions

```tsx
'use client';

import { checkUsageLimit } from '@/app/actions/usage';

export function MyComponent() {
  const handleClick = async () => {
    const result = await checkUsageLimit();
    
    if (result?.isLimitExceeded) {
      console.log('Cannot proceed');
    } else {
      console.log(`${result?.remainingScanCount} scans remaining`);
    }
  };

  return <button onClick={handleClick}>Check Limit</button>;
}
```

## Data Types

### `UsageLimitResult`

```typescript
interface UsageLimitResult {
  // Current usage
  scanCount: number;              // Total scans uploaded
  storageUsedGB: number;          // Total storage used in GB
  
  // Plan limits
  scanLimit: number;              // Max scans allowed
  storageLimitGB: number;         // Max storage in GB
  
  // Remaining
  remainingScanCount: number;     // Scans left before limit
  remainingStorageGB: number;     // Storage GB left before limit
  
  // Status
  isLimitExceeded: boolean;       // At or over limit?
  percentageUsed: number;         // Scans as % of limit (0-100)
  storagePercentageUsed: number;  // Storage as % of limit (0-100)
  
  // Plan info
  planType: 'free' | 'pro' | 'enterprise';
}
```

## Plan Limits

Default limits by subscription plan:

| Plan | Scans | Storage |
|------|-------|---------|
| Free | 10 | 1 GB |
| Pro | 500 | 100 GB |
| Enterprise | 10,000 | 1000 GB |

Customizable in `lib/usage/tracker.ts`:

```typescript
export function getUsageLimitByPlan(plan: string) {
  const limits = {
    free: { scanLimit: 10, storageLimitGB: 1 },
    pro: { scanLimit: 500, storageLimitGB: 100 },
    enterprise: { scanLimit: 10000, storageLimitGB: 1000 },
  };
  return limits[plan as keyof typeof limits] || limits.free;
}
```

## Implementation Details

### Storage Calculation

Storage is calculated from scans:
- Sum of `file_size_bytes` from all user scans
- Converted to GB (divide by 1024³)
- Updated when scans are added or deleted

### Warning Threshold

A warning is shown when:
- Usage > 80% of limit
- But limit is NOT exceeded

### Refresh Strategy

Usage data is:
- Fetched on component mount (if `autoFetch: true`)
- Cached in Zustand store globally
- Manually refreshable via `fetchUsageData()`
- Refreshed before critical operations

### Error Handling

- Failed requests return `null` and set error message
- Components gracefully degrade (show nothing or loading state)
- Allow operations to proceed if data fails to load (fail-open)

## Testing

### Test Files

- `test/lib/hooks/useUsageStore.test.ts` - Store tests
- `test/lib/hooks/useUsage.test.ts` - Hook tests
- `test/lib/hooks/useCheckUsage.test.ts` - Check hook tests
- `test/components/usage/UsageDisplay.test.tsx` - Component tests
- `test/components/usage/UsageWidget.test.tsx` - Widget tests
- `test/components/providers/UsageProvider.test.tsx` - Provider tests
- `test/lib/usage/integration.test.ts` - Integration tests

### Running Tests

```bash
# Run all usage-related tests
npm test -- test/lib/usage
npm test -- test/components/usage
npm test -- test/lib/hooks

# Run specific test file
npm test -- test/lib/hooks/useUsage.test.ts

# Watch mode
npm test -- --watch
```

## Best Practices

1. **Check before resource-heavy operations:**
   ```tsx
   const { checkAndExecute } = useCheckUsage();
   
   await checkAndExecute(async () => {
     // Expensive operation
   });
   ```

2. **Display warnings to users:**
   ```tsx
   const { hasWarning } = useUsage();
   
   if (hasWarning) {
     // Show upgrade suggestion
   }
   ```

3. **Disable upload when limit exceeded:**
   ```tsx
   const { isLimitExceeded } = useUsage();
   
   <button disabled={isLimitExceeded}>
     Upload Scan
   </button>
   ```

4. **Use context for app-wide access:**
   ```tsx
   // In layout.tsx
   export default function Layout({ children }) {
     return (
       <UsageProvider>
         {children}
       </UsageProvider>
     );
   }
   
   // In any child component
   const { usageData } = useUsageContext();
   ```

5. **Handle errors gracefully:**
   ```tsx
   const { error, clearError } = useUsage();
   
   if (error) {
     return (
       <button onClick={clearError}>
         Retry
       </button>
     );
   }
   ```

## Customization

### Change Plan Limits

Edit `lib/usage/tracker.ts`:

```typescript
export function getUsageLimitByPlan(plan: string) {
  const limits = {
    free: { scanLimit: 20, storageLimitGB: 2 },  // Changed
    pro: { scanLimit: 1000, storageLimitGB: 200 }, // Changed
    enterprise: { scanLimit: 50000, storageLimitGB: 5000 }, // Changed
  };
  return limits[plan as keyof typeof limits] || limits.free;
}
```

### Change Warning Threshold

Edit `lib/hooks/useUsage.ts`:

```typescript
const hasWarning =
  usageData && usageData.percentageUsed > 90 && !usageData.isLimitExceeded  // Changed from 80
    ? true
    : false;
```

### Custom UI

Create your own component using the hook:

```tsx
import { useUsage } from '@/lib/hooks/useUsage';

export function CustomUsageWidget() {
  const { usageData, isLimitExceeded } = useUsage();

  if (!usageData) return null;

  return (
    <div className="my-custom-styles">
      <h2>Your Plan Usage</h2>
      {/* Your custom UI */}
    </div>
  );
}
```

## Troubleshooting

### Usage data not updating

- Check that `UsageProvider` is in layout
- Try manual refresh: `await fetchUsageData()`
- Check browser console for errors
- Verify database connection in server action

### Callbacks not firing

- Check that hook is inside a component (not in async context)
- Verify callback function is defined
- Make sure data is changing (not null → same object)

### Limit exceeded not showing

- Ensure `showWarning={true}` on component
- Check that `isLimitExceeded` is actually true
- Verify database has correct scan data

## Performance

- Usage data is globally cached (Zustand)
- Only fetches on mount (if enabled)
- Manual refresh available for critical operations
- Percentage calculations done client-side
- No automatic polling

## Security

- All user-specific queries use authenticated user ID
- Server actions verify user session
- Database queries filtered by user_id
- No sensitive data exposed to client

## Future Enhancements

- [ ] Real-time usage updates via WebSocket
- [ ] Usage analytics dashboard
- [ ] Quota notifications (email, push)
- [ ] Usage-based pricing calculations
- [ ] Bulk operations with warning
- [ ] Usage export/reports
- [ ] Custom alert thresholds per user
