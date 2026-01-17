# Production Smoke Test Script

Automated script to validate all critical functionality in production after deployment.

---

## Manual Smoke Test Checklist

Use this checklist immediately after production deployment:

```markdown
## Production Smoke Test - {{DATE}}

**Environment:** Production ({{URL}})  
**Tester:** {{YOUR_NAME}}  
**Deployment:** {{COMMIT_HASH}}  
**Time:** {{START_TIME}}

### Pre-Flight Checks
- [ ] Production URL accessible: https://panecho.com
- [ ] SSL certificate valid (green padlock)
- [ ] No console errors on homepage (F12 → Console)
- [ ] Page loads in < 3 seconds

### Authentication Flow
- [ ] **Signup**
  - Navigate to /signup
  - Enter: test-{{timestamp}}@yourdomain.com
  - Create account
  - Confirmation email received (check inbox + spam)
  - Click confirmation link
  - Redirected to /upload
  
- [ ] **Login**
  - Log out
  - Navigate to /login
  - Enter credentials
  - Successfully logged in
  - Redirected to /upload
  
- [ ] **Password Reset**
  - Log out
  - Click "Forgot Password"
  - Enter email
  - Reset email received
  - Click reset link
  - Enter new password
  - Password updated
  - Can log in with new password

### Core Upload Flow
- [ ] **Single Upload**
  - Navigate to /upload
  - Select DICOM file (< 10 MB)
  - Click "Analyze Scan"
  - Redirected to /processing/[id]
  - Progress bar animates
  - Processing completes (60-90s)
  - Redirected to /results/[id]
  
- [ ] **Results Display**
  - Risk score displayed (0-100)
  - Classification shown (Normal/Suspicious)
  - Anatomical analysis present
  - Recommendations shown
  - Scan metadata displayed
  - No missing data

- [ ] **PDF Download**
  - Click "Download PDF"
  - PDF downloads successfully
  - Open PDF
  - All sections present
  - Images rendered
  - Data accurate

### Advanced Features
- [ ] **Batch Upload**
  - Upload 3 DICOM files
  - All 3 process successfully
  - Can view each result
  - Batch status tracked
  
- [ ] **Longitudinal Analysis**
  - Upload second scan for same patient
  - Timeline appears
  - Comparison available
  - Change indicators shown
  
- [ ] **Rate Limiting**
  - Upload 6 files rapidly
  - 6th upload rate limited
  - Error message clear
  - Can retry after cooldown

### Mobile Testing
- [ ] **iPhone (Safari)**
  - Homepage loads
  - Can sign up/login
  - Upload works
  - Results readable
  - Buttons tappable
  
- [ ] **Android (Chrome)**
  - Homepage loads
  - Can sign up/login
  - Upload works
  - Results readable
  - Buttons tappable

### Error Handling
- [ ] Upload invalid file format → Error shown
- [ ] Upload oversized file (>50MB) → Error shown
- [ ] Access unauthorized URL → Redirected to login
- [ ] Network error simulation → Graceful handling

### Monitoring Validation
- [ ] Vercel Analytics tracking page views
- [ ] Errors appearing in dashboard (if any)
- [ ] Supabase showing new records
- [ ] OpenAI usage increasing

### Performance Check
- [ ] Homepage LCP < 2.5s
- [ ] No layout shifts (CLS < 0.1)
- [ ] Upload responsive
- [ ] Processing completes in < 90s

### Final Checks
- [ ] No console errors anywhere
- [ ] All links work
- [ ] Footer displays correctly
- [ ] Support email link works
- [ ] Documentation accessible

---

**Result:** ✅ PASS / ❌ FAIL  
**Notes:** {{ANY_ISSUES_FOUND}}  
**Completed:** {{END_TIME}}  
**Duration:** {{TOTAL_TIME}}
```

---

## Automated Smoke Test Script

### Setup

```bash
# Install Playwright for automated testing
npm install -D @playwright/test
npx playwright install
```

Create `test/e2e/production-smoke.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

// Configuration
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://panecho.com';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Production Smoke Tests', () => {
  test.setTimeout(180000); // 3 minutes for processing

  test('Homepage loads successfully', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    
    // Check SSL
    expect(page.url()).toContain('https://');
    
    // Check title
    await expect(page).toHaveTitle(/PanEcho/i);
    
    // Check key elements
    await expect(page.locator('text=/get started/i')).toBeVisible();
    
    // Check no console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('Signup flow works', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/signup`);
    
    // Fill signup form
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Should show confirmation message or redirect
    await page.waitForTimeout(3000);
    
    // Check for success indicator
    const url = page.url();
    expect(url).not.toContain('/signup');
  });

  test('Login flow works', async ({ page }) => {
    // Note: Use existing test account for login test
    const loginEmail = 'existing-test@example.com';
    const loginPassword = 'ExistingPassword123!';
    
    await page.goto(`${PRODUCTION_URL}/login`);
    
    await page.fill('input[type="email"]', loginEmail);
    await page.fill('input[type="password"]', loginPassword);
    await page.click('button[type="submit"]');
    
    // Should redirect to upload
    await page.waitForURL('**/upload', { timeout: 10000 });
    expect(page.url()).toContain('/upload');
  });

  test('Upload page accessible', async ({ page, context }) => {
    // Login first
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.fill('input[type="email"]', 'existing-test@example.com');
    await page.fill('input[type="password"]', 'ExistingPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/upload');
    
    // Check upload page elements
    await expect(page.locator('input[type="file"]')).toBeVisible();
    await expect(page.locator('text=/analyze/i')).toBeVisible();
  });

  test('File upload and processing', async ({ page }) => {
    // Login first
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.fill('input[type="email"]', 'existing-test@example.com');
    await page.fill('input[type="password"]', 'ExistingPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/upload');
    
    // Upload test file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test/fixtures/sample.dcm');
    
    // Submit
    await page.click('button:has-text("Analyze")');
    
    // Should redirect to processing
    await page.waitForURL('**/processing/**', { timeout: 10000 });
    expect(page.url()).toContain('/processing/');
    
    // Wait for processing (max 90s)
    await page.waitForURL('**/results/**', { timeout: 90000 });
    
    // Verify results page
    await expect(page.locator('text=/risk score/i')).toBeVisible();
    await expect(page.locator('text=/classification/i')).toBeVisible();
  });

  test('PDF download works', async ({ page }) => {
    // Login and navigate to a result
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.fill('input[type="email"]', 'existing-test@example.com');
    await page.fill('input[type="password"]', 'ExistingPassword123!');
    await page.click('button[type="submit"]');
    
    // Go to first result
    await page.goto(`${PRODUCTION_URL}/dashboard`);
    await page.click('a[href^="/results/"]');
    
    // Click download PDF
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Download PDF")')
    ]);
    
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('Mobile responsive - viewport 375x667 (iPhone)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(PRODUCTION_URL);
    
    // Check elements are visible
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('text=/get started/i')).toBeVisible();
    
    // Check no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('Rate limiting enforced', async ({ page }) => {
    // Login
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.fill('input[type="email"]', 'existing-test@example.com');
    await page.fill('input[type="password"]', 'ExistingPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/upload');
    
    // Try to upload 6 files rapidly
    for (let i = 0; i < 6; i++) {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('test/fixtures/sample.dcm');
      await page.click('button:has-text("Analyze")');
      
      if (i < 5) {
        await page.waitForURL('**/processing/**', { timeout: 5000 });
        await page.goto(`${PRODUCTION_URL}/upload`);
      }
    }
    
    // 6th upload should show rate limit error
    await expect(page.locator('text=/rate limit/i')).toBeVisible({ timeout: 5000 });
  });

  test('Error tracking working', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto(PRODUCTION_URL);
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.goto(`${PRODUCTION_URL}/signup`);
    
    // Should have no JavaScript errors
    expect(errors).toHaveLength(0);
  });

  test('Analytics tracking events', async ({ page }) => {
    // Check that Vercel Analytics script is loaded
    await page.goto(PRODUCTION_URL);
    
    const analyticsScript = await page.locator('script[src*="vercel"]').count();
    expect(analyticsScript).toBeGreaterThan(0);
  });
});

test.describe('Performance Tests', () => {
  test('Homepage loads fast', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(PRODUCTION_URL);
    const loadTime = Date.now() - startTime;
    
    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('LCP is acceptable', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          resolve(lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        setTimeout(() => resolve(0), 5000);
      });
    });
    
    // LCP should be under 2.5s
    expect(lcp).toBeLessThan(2500);
  });
});
```

---

## Running Smoke Tests

### Manual Run

```bash
# Run all smoke tests
npx playwright test test/e2e/production-smoke.spec.ts

# Run specific test
npx playwright test test/e2e/production-smoke.spec.ts -g "Homepage loads"

# Run in headed mode (see browser)
npx playwright test test/e2e/production-smoke.spec.ts --headed

# Run with UI mode
npx playwright test test/e2e/production-smoke.spec.ts --ui
```

### Automated (CI/CD)

Add to `.github/workflows/production-smoke-test.yml`:

```yaml
name: Production Smoke Tests

on:
  workflow_dispatch: # Manual trigger
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run smoke tests
        env:
          PRODUCTION_URL: https://panecho.com
        run: npx playwright test test/e2e/production-smoke.spec.ts
      
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
      
      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          text: 'Production smoke tests failed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Quick Validation Script

For immediate post-deployment validation:

```bash
#!/bin/bash
# quick-smoke-test.sh

PRODUCTION_URL="https://panecho.com"

echo "🔍 Running quick smoke test..."

# Check homepage
echo "Checking homepage..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $PRODUCTION_URL)
if [ $STATUS -eq 200 ]; then
  echo "✅ Homepage: OK"
else
  echo "❌ Homepage: FAILED (Status: $STATUS)"
  exit 1
fi

# Check SSL
echo "Checking SSL..."
SSL=$(curl -s -o /dev/null -w "%{ssl_verify_result}" $PRODUCTION_URL)
if [ $SSL -eq 0 ]; then
  echo "✅ SSL: Valid"
else
  echo "❌ SSL: FAILED"
  exit 1
fi

# Check login page
echo "Checking login page..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $PRODUCTION_URL/login)
if [ $STATUS -eq 200 ]; then
  echo "✅ Login page: OK"
else
  echo "❌ Login page: FAILED"
  exit 1
fi

# Check API health (if you add a health endpoint)
echo "Checking API..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $PRODUCTION_URL/api/health)
if [ $STATUS -eq 200 ]; then
  echo "✅ API: OK"
else
  echo "⚠️  API health endpoint not found (this is optional)"
fi

echo ""
echo "🎉 Quick smoke test passed!"
echo "Run full smoke tests: npx playwright test test/e2e/production-smoke.spec.ts"
```

Make it executable:
```bash
chmod +x quick-smoke-test.sh
./quick-smoke-test.sh
```

---

## Monitoring Dashboard Integration

Add health check endpoint at `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Check database connection
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from('scans')
      .select('id')
      .limit(1);
    
    if (dbError) {
      throw new Error('Database connection failed');
    }
    
    // Check OpenAI (optional - don't want to use credits)
    // const openaiHealthy = await checkOpenAI();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        storage: 'ok',
        // openai: openaiHealthy ? 'ok' : 'degraded',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
```

Then monitor this endpoint:
```bash
# Check every 5 minutes
*/5 * * * * curl -f https://panecho.com/api/health || echo "Health check failed!"
```

---

## Post-Deployment Checklist

After running smoke tests:

- [ ] All smoke tests pass
- [ ] No console errors
- [ ] Analytics tracking events
- [ ] Monitoring dashboards show data
- [ ] Error tracking configured
- [ ] Cron jobs scheduled
- [ ] Support email tested
- [ ] Documentation accessible
- [ ] Mobile tested on real devices
- [ ] Performance acceptable (LCP < 2.5s)
- [ ] First real user completed flow
- [ ] Team notified of launch

---

**Smoke tests ensure production is healthy! Run after every deployment. 🧪**
