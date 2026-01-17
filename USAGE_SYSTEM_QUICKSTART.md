# Usage Tracking System - Quick Start

Get the usage tracking system up and running in 5 minutes.

## 1️⃣ Setup (1 minute)

Add the provider to your root layout:

```tsx
// app/layout.tsx
import { UsageProvider } from '@/components/providers/UsageProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
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

## 2️⃣ Display Usage (2 minutes)

Show usage information on any page:

```tsx
// Any page
import { UsageDisplay } from '@/components/usage/UsageDisplay';

export default function Dashboard() {
  return (
    <div>
      <h1>My Dashboard</h1>
      <UsageDisplay />
    </div>
  );
}
```

## 3️⃣ Check Before Upload (2 minutes)

Prevent uploads when limit is reached:

```tsx
'use client';

import { useCheckUsage } from '@/lib/hooks/useCheckUsage';

export function UploadButton() {
  const { checkAndExecute } = useCheckUsage({
    onFail: () => alert('Upload limit reached!'),
  });

  const handleUpload = async () => {
    await checkAndExecute(async () => {
      // Your upload code here
      await uploadFile();
    });
  };

  return <button onClick={handleUpload}>Upload</button>;
}
```

## 4️⃣ Access Usage Data (Optional)

Use the hook to access data anywhere:

```tsx
'use client';

import { useUsage } from '@/lib/hooks/useUsage';

export function UsageWidget() {
  const {
    usageData,
    isLimitExceeded,
    remainingScans,
  } = useUsage();

  if (!usageData) return null;

  return (
    <div>
      <p>Scans: {usageData.scanCount} / {usageData.scanLimit}</p>
      <p>Remaining: {remainingScans}</p>
      {isLimitExceeded && <p>⚠️ Limit reached!</p>}
    </div>
  );
}
```

## That's It! 🎉

Your usage tracking is now live. Here's what you get:

✅ Real-time usage monitoring
✅ Automatic quota enforcement
✅ Visual progress bars
✅ Warning alerts at 80% usage
✅ Error handling
✅ Works on mobile and desktop

## Common Scenarios

### Show in Header
```tsx
import { UsageWidget } from '@/components/usage/UsageWidget';

export function Header() {
  return (
    <header>
      <h1>App</h1>
      <UsageWidget compact={true} />
    </header>
  );
}
```

### Disable Upload Button When Limit Reached
```tsx
const { isLimitExceeded } = useUsage();

<button disabled={isLimitExceeded}>
  Upload
</button>
```

### Show Upgrade Message
```tsx
const { hasWarning } = useUsage();

{hasWarning && (
  <div>
    You're using a lot of your quota.
    <a href="/pricing">Upgrade now</a>
  </div>
)}
```

### Check in API Route
```typescript
// app/api/upload/route.ts
import { checkUsageLimit } from '@/lib/usage/tracker';

const usage = await checkUsageLimit(userId);
if (usage.isLimitExceeded) {
  return NextResponse.json({ error: 'Limit exceeded' }, { status: 429 });
}
```

## Customization

### Change Plan Limits
Edit `src/lib/usage/tracker.ts`:
```typescript
export function getUsageLimitByPlan(plan: string) {
  const limits = {
    free: { scanLimit: 10, storageLimitGB: 1 },
    pro: { scanLimit: 500, storageLimitGB: 100 },
    // Add your custom limits here
  };
  return limits[plan as keyof typeof limits] || limits.free;
}
```

### Change Warning Threshold
Edit `src/lib/hooks/useUsage.ts`:
```typescript
// Change 80 to any percentage
const hasWarning = usageData && usageData.percentageUsed > 80 ...
```

### Custom Styling
Both `UsageDisplay` and `UsageWidget` use Tailwind CSS. Edit component files to customize colors, sizes, and layout.

## Troubleshooting

**Usage data not showing?**
- Check `UsageProvider` is in your layout
- Check browser console for errors
- Verify user is authenticated

**Callbacks not firing?**
- Make sure component is inside `<UsageProvider>`
- Check hook is in a client component (add `'use client'`)

**Limit not enforcing?**
- Check database has correct scan counts
- Verify `checkAndExecute()` is being called

## Next Steps

📖 Read [USAGE_TRACKING.md](./docs/USAGE_TRACKING.md) for complete documentation
📚 See [USAGE_INTEGRATION_EXAMPLES.md](./docs/USAGE_INTEGRATION_EXAMPLES.md) for more examples
🧪 Run tests: `npm test -- test/lib/usage`

## Files Created

- `src/app/actions/usage.ts` - Server action
- `src/lib/hooks/useUsageStore.ts` - Zustand store
- `src/lib/hooks/useUsage.ts` - Main hook
- `src/lib/hooks/useCheckUsage.ts` - Check before operation hook
- `src/components/providers/UsageProvider.tsx` - Context provider
- `src/components/usage/UsageDisplay.tsx` - Full display component
- `src/components/usage/UsageWidget.tsx` - Compact widget component
- `test/` - 7 test files with 73+ test cases
- `docs/` - Complete documentation

## Questions?

See the full documentation in `docs/USAGE_TRACKING.md` or check out the integration examples in `docs/USAGE_INTEGRATION_EXAMPLES.md`.
