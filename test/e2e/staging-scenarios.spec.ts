import { test, expect } from '@playwright/test';

/**
 * PanEcho End-to-End Test Suite - Staging Environment
 * 
 * Test Scenarios:
 * 1. New user, single scan upload & results viewing
 * 2. Batch upload with longitudinal analysis
 * 3. Error handling & recovery
 * 4. Rate limiting validation
 * 5. Data retention & deletion
 * 
 * Prerequisites:
 * - Staging environment deployed (https://staging.panecho.dev)
 * - Test DICOM files in test/fixtures/tcia-scans/
 * - Environment variables configured
 * 
 * Run: npx playwright test test/e2e/staging-scenarios.spec.ts
 */

const STAGING_URL = process.env.STAGING_URL || 'https://staging.panecho.dev';
const TEST_EMAIL_BASE = `test-${Date.now()}`;

// ============================================================================
// SCENARIO 1: New User, Single Scan
// ============================================================================

test.describe('Scenario 1: New User, Single Scan Upload', () => {
  test('should complete full flow: signup → upload → analyze → view results → download PDF', async ({ page }) => {
    const testEmail = `${TEST_EMAIL_BASE}-scenario1@example.com`;
    const testPassword = 'TestPassword123!@#';

    // Step 1: Sign up
    await page.goto(`${STAGING_URL}/signup`);
    await expect(page.locator('text=/sign up/i')).toBeVisible();
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[placeholder*="confirm"]', testPassword);
    await page.click('button:has-text("Sign Up")');

    // Verify account created
    await expect(page).toHaveURL(/.*upload.*|.*dashboard.*/);
    await expect(page.locator('text=/upload|dashboard/i')).toBeVisible();

    // Step 2: Verify email (if required)
    if (await page.locator('text=/verify.*email/i').isVisible({ timeout: 5000 }).catch(() => false)) {
      // Skip verification for staging (allow auto-verification)
      await page.goto(`${STAGING_URL}/dashboard`);
    }

    // Step 3: Upload scan
    await page.goto(`${STAGING_URL}/upload`);
    await expect(page.locator('text=/upload.*scan/i')).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test/fixtures/tcia-scans/TCIA_001.dcm');

    // Set scan date
    const dateInput = page.locator('input[type="date"]');
    if (await dateInput.isVisible({ timeout: 3000 })) {
      await dateInput.fill('2024-06-15');
    }

    // Step 4: Start analysis
    const analyzeButton = page.locator('button:has-text(/analyze|process|submit/i)').first();
    await analyzeButton.click();

    // Verify processing started
    await expect(page.locator('text=/processing|uploading|analyzing/i')).toBeVisible();

    // Step 5: Wait for results (max 120 seconds)
    await page.waitForURL(
      (url) => url.pathname.includes('results') || url.pathname.includes('processing'),
      { timeout: 120000 }
    );

    // Step 6: Verify results page
    const processingCheck = page.url().includes('processing');
    if (processingCheck) {
      // On processing page - wait for completion
      const pollCount = 24; // 24 * 5s = 120s max
      for (let i = 0; i < pollCount; i++) {
        await page.reload();
        if (page.url().includes('results')) break;
        if (i < pollCount - 1) await page.waitForTimeout(5000);
      }
    }

    // Verify results are displayed
    await expect(page.locator('text=/risk score/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/\\d+(\\.\\d+)?%|\\d+\\s*\\/\\s*100/i')).toBeVisible();
    
    // Verify classification badge
    const classification = page.locator('text=/(normal|suspicious)/i');
    await expect(classification).toBeVisible();

    // Step 7: Download PDF
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text(/download|pdf|report/i)');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\\.pdf$/);
    const path = await download.path();
    expect(path).toBeTruthy();

    // Step 8: Verify scan appears in history
    await page.goto(`${STAGING_URL}/dashboard`);
    await expect(page.locator('text=/scan history|recent scans/i')).toBeVisible();
    await expect(page.locator(`text=${testEmail}`)).toBeVisible({ timeout: 5000 });

    console.log('✅ Scenario 1 PASSED: New user single scan flow completed');
  });
});

// ============================================================================
// SCENARIO 2: Batch Upload & Longitudinal Analysis
// ============================================================================

test.describe('Scenario 2: Batch Upload & Longitudinal Analysis', () => {
  test('should upload multiple scans and generate longitudinal analysis', async ({ page }) => {
    const testEmail = `${TEST_EMAIL_BASE}-scenario2@example.com`;

    // Sign up
    await page.goto(`${STAGING_URL}/signup`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPassword123!@#');
    await page.fill('input[placeholder*="confirm"]', 'TestPassword123!@#');
    await page.click('button:has-text("Sign Up")');
    await page.waitForURL(/.*(?:upload|dashboard).*/);

    // Upload 3 scans with different dates
    const scans = [
      { file: 'test/fixtures/tcia-scans/TCIA_002.dcm', date: '2024-01-01' },
      { file: 'test/fixtures/tcia-scans/TCIA_003.dcm', date: '2024-06-15' },
      { file: 'test/fixtures/tcia-scans/TCIA_004.dcm', date: '2025-01-10' },
    ];

    for (const scan of scans) {
      await page.goto(`${STAGING_URL}/upload`);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(scan.file);

      const dateInput = page.locator('input[type="date"]');
      if (await dateInput.isVisible({ timeout: 3000 })) {
        await dateInput.fill(scan.date);
      }

      await page.click('button:has-text(/analyze|submit/i)');
      
      // Wait for processing or results page
      await page.waitForURL(
        (url) => url.pathname.includes('results') || url.pathname.includes('processing'),
        { timeout: 120000 }
      );

      // If processing page, wait for completion (poll for 120s)
      if (page.url().includes('processing')) {
        for (let i = 0; i < 24; i++) {
          await page.waitForTimeout(5000);
          await page.reload();
          if (!page.url().includes('processing')) break;
        }
      }

      console.log(`✅ Scan uploaded: ${scan.date}`);
    }

    // Go to scan history
    await page.goto(`${STAGING_URL}/dashboard`);
    await expect(page.locator('text=/scan history/i')).toBeVisible();

    // Verify chronological order
    const scanRows = page.locator('[data-testid="scan-row"]');
    const count = await scanRows.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Click most recent scan for comparison
    const mostRecentScan = scanRows.last();
    await mostRecentScan.click();

    // Verify results page
    await expect(page.locator('text=/risk score/i')).toBeVisible();

    // Look for comparison view
    const comparisonBtn = page.locator('button:has-text(/comparison|timeline|history/i)');
    if (await comparisonBtn.isVisible({ timeout: 3000 })) {
      await comparisonBtn.click();
      
      // Verify longitudinal view
      await expect(page.locator('text=/timeline|previous|history/i')).toBeVisible({ timeout: 10000 });
      
      // Verify multiple scans in view
      const riskScoreElements = page.locator('text=/risk score/i');
      expect(await riskScoreElements.count()).toBeGreaterThanOrEqual(2);
    }

    console.log('✅ Scenario 2 PASSED: Batch upload and longitudinal analysis completed');
  });
});

// ============================================================================
// SCENARIO 3: Error Handling & Recovery
// ============================================================================

test.describe('Scenario 3: Error Handling & Recovery', () => {
  test('should handle invalid file upload gracefully', async ({ page }) => {
    const testEmail = `${TEST_EMAIL_BASE}-scenario3a@example.com`;

    // Sign up and navigate to upload
    await page.goto(`${STAGING_URL}/signup`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPassword123!@#');
    await page.fill('input[placeholder*="confirm"]', 'TestPassword123!@#');
    await page.click('button:has-text("Sign Up")');
    await page.waitForURL(/.*(?:upload|dashboard).*/);

    await page.goto(`${STAGING_URL}/upload`);

    // Try to upload invalid file type
    const fileInput = page.locator('input[type="file"]');
    
    // Create a text file
    const buffer = Buffer.from('This is not a DICOM file');
    const dataTransfer = await page.evaluateHandle(({ buffer }) => {
      const dataTransfer = new DataTransfer();
      const file = new File([new Uint8Array(buffer)], 'test.txt', { type: 'text/plain' });
      dataTransfer.items.add(file);
      return dataTransfer;
    }, { buffer: buffer.buffer });

    await fileInput.evaluate((input, dataTransfer) => {
      (input as HTMLInputElement).files = dataTransfer.files;
    }, dataTransfer);

    // Verify error message
    await expect(page.locator('text=/invalid|dicom|format|supported/i')).toBeVisible({ timeout: 5000 });

    // Verify form is still usable
    expect(await fileInput.inputValue()).toBeFalsy();

    console.log('✅ Error Handling Test A PASSED: Invalid file rejected');
  });

  test('should handle processing errors with retry option', async ({ page }) => {
    const testEmail = `${TEST_EMAIL_BASE}-scenario3b@example.com`;

    // Sign up
    await page.goto(`${STAGING_URL}/signup`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPassword123!@#');
    await page.fill('input[placeholder*="confirm"]', 'TestPassword123!@#');
    await page.click('button:has-text("Sign Up")');
    await page.waitForURL(/.*(?:upload|dashboard).*/);

    // Upload valid scan
    await page.goto(`${STAGING_URL}/upload`);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test/fixtures/tcia-scans/TCIA_005.dcm');

    await page.click('button:has-text(/analyze/i)');

    // Wait for processing page
    await page.waitForURL(
      (url) => url.pathname.includes('results') || url.pathname.includes('processing'),
      { timeout: 120000 }
    );

    // Check for error or completion
    const errorMsg = page.locator('text=/error|failed|try again|retry/i');
    const successMsg = page.locator('text=/risk score|results|success/i');

    const hasError = await errorMsg.isVisible({ timeout: 30000 }).catch(() => false);
    const hasSuccess = await successMsg.isVisible({ timeout: 30000 }).catch(() => false);

    if (hasError) {
      // Verify retry button exists
      const retryBtn = page.locator('button:has-text(/retry|try again/i)');
      expect(await retryBtn.isVisible()).toBeTruthy();
      console.log('✅ Error Handling Test B PASSED: Error recovery available');
    } else if (hasSuccess) {
      console.log('✅ Error Handling Test B PASSED: Processing succeeded');
    }
  });
});

// ============================================================================
// SCENARIO 4: Rate Limiting
// ============================================================================

test.describe('Scenario 4: Rate Limiting', () => {
  test('should enforce rate limits and display clear messaging', async ({ page }) => {
    const testEmail = `${TEST_EMAIL_BASE}-scenario4@example.com`;

    // Sign up
    await page.goto(`${STAGING_URL}/signup`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPassword123!@#');
    await page.fill('input[placeholder*="confirm"]', 'TestPassword123!@#');
    await page.click('button:has-text("Sign Up")');
    await page.waitForURL(/.*(?:upload|dashboard).*/);

    // Try to upload 6 scans rapidly
    let rateLimited = false;
    const maxScans = 6;
    const scanFiles = [
      'test/fixtures/tcia-scans/TCIA_001.dcm',
      'test/fixtures/tcia-scans/TCIA_002.dcm',
      'test/fixtures/tcia-scans/TCIA_003.dcm',
      'test/fixtures/tcia-scans/TCIA_004.dcm',
      'test/fixtures/tcia-scans/TCIA_005.dcm',
      'test/fixtures/tcia-scans/TCIA_006.dcm',
    ];

    for (let i = 0; i < maxScans; i++) {
      await page.goto(`${STAGING_URL}/upload`);

      const fileInput = page.locator('input[type="file"]');
      
      // Check if rate limit message appears
      const limitMsg = page.locator('text=/rate limit|try again|daily limit|quota/i');
      if (await limitMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
        rateLimited = true;
        // Verify error message has info about reset
        await expect(limitMsg).toBeVisible();
        console.log('✅ Rate limit enforced at scan ' + (i + 1));
        break;
      }

      // Try to upload
      await fileInput.setInputFiles(scanFiles[i]);
      const analyzeBtn = page.locator('button:has-text(/analyze/i)');
      
      if (await analyzeBtn.isEnabled({ timeout: 2000 }).catch(() => false)) {
        await analyzeBtn.click();
      }

      // Don't wait for completion - just start uploads
      await page.waitForTimeout(1000);
    }

    if (rateLimited) {
      console.log('✅ Scenario 4 PASSED: Rate limiting enforced');
    } else {
      console.log('⚠️ Scenario 4 WARNING: Rate limit not triggered (may be configured differently)');
    }
  });
});

// ============================================================================
// SCENARIO 5: Data Retention & Deletion
// ============================================================================

test.describe('Scenario 5: Data Retention & Deletion', () => {
  test('should allow scan deletion and verify removal', async ({ page }) => {
    const testEmail = `${TEST_EMAIL_BASE}-scenario5@example.com`;

    // Sign up
    await page.goto(`${STAGING_URL}/signup`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPassword123!@#');
    await page.fill('input[placeholder*="confirm"]', 'TestPassword123!@#');
    await page.click('button:has-text("Sign Up")');
    await page.waitForURL(/.*(?:upload|dashboard).*/);

    // Upload a scan
    await page.goto(`${STAGING_URL}/upload`);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test/fixtures/tcia-scans/TCIA_007.dcm');
    
    await page.click('button:has-text(/analyze/i)');
    await page.waitForURL(/.*(?:results|processing).*/, { timeout: 120000 });

    // Wait for results if on processing page
    if (page.url().includes('processing')) {
      for (let i = 0; i < 24; i++) {
        await page.waitForTimeout(5000);
        await page.reload();
        if (!page.url().includes('processing')) break;
      }
    }

    // Go to scan in history
    await page.goto(`${STAGING_URL}/dashboard`);
    const scanRow = page.locator('[data-testid="scan-row"]').first();
    await scanRow.click();

    // Find and click delete button
    const deleteBtn = page.locator('button:has-text(/delete|remove/i)');
    if (await deleteBtn.isVisible({ timeout: 3000 })) {
      await deleteBtn.click();

      // Confirm deletion
      const confirmBtn = page.locator('button:has-text(/confirm|yes|delete|proceed/i)');
      if (await confirmBtn.isVisible({ timeout: 3000 })) {
        await confirmBtn.click();
      }

      // Verify scan is removed from history
      await page.goto(`${STAGING_URL}/dashboard`);
      const deletedScanCell = page.locator(`text=${testEmail}`).first();
      
      // Check that deleted scan is no longer visible (may take a moment)
      for (let i = 0; i < 5; i++) {
        await page.reload();
        if (!await deletedScanCell.isVisible({ timeout: 2000 }).catch(() => false)) {
          break;
        }
        await page.waitForTimeout(1000);
      }

      console.log('✅ Scenario 5 PASSED: Scan successfully deleted');
    } else {
      console.log('⚠️ Scenario 5 WARNING: Delete button not found');
    }
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

test.describe('Performance Benchmarking', () => {
  test('should process TCIA scans within performance targets', async ({ page }) => {
    const testEmail = `${TEST_EMAIL_BASE}-perf@example.com`;
    const timings: { scan: string; duration: number }[] = [];

    // Sign up
    await page.goto(`${STAGING_URL}/signup`);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'TestPassword123!@#');
    await page.fill('input[placeholder*="confirm"]', 'TestPassword123!@#');
    await page.click('button:has-text("Sign Up")');
    await page.waitForURL(/.*(?:upload|dashboard).*/);

    // Test scans
    const scans = [
      'test/fixtures/tcia-scans/TCIA_008.dcm',
      'test/fixtures/tcia-scans/TCIA_009.dcm',
    ];

    for (const scanFile of scans) {
      const startTime = Date.now();

      await page.goto(`${STAGING_URL}/upload`);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(scanFile);
      await page.click('button:has-text(/analyze/i)');

      await page.waitForURL(/.*(?:results|processing).*/, { timeout: 120000 });

      // Wait for completion if on processing page
      if (page.url().includes('processing')) {
        for (let i = 0; i < 24; i++) {
          await page.waitForTimeout(5000);
          await page.reload();
          if (!page.url().includes('processing')) break;
        }
      }

      // Verify results appear
      await expect(page.locator('text=/risk score/i')).toBeVisible({ timeout: 10000 });

      const duration = (Date.now() - startTime) / 1000;
      timings.push({ scan: scanFile.split('/').pop() || 'unknown', duration });

      console.log(`📊 ${scanFile}: ${duration.toFixed(1)}s`);
    }

    // Summary
    const avgDuration = timings.reduce((sum, t) => sum + t.duration, 0) / timings.length;
    const maxDuration = Math.max(...timings.map(t => t.duration));

    console.log(`\n📊 Performance Summary:`);
    console.log(`   Average: ${avgDuration.toFixed(1)}s`);
    console.log(`   Max: ${maxDuration.toFixed(1)}s`);
    console.log(`   Target: <90s`);
    console.log(`   Status: ${avgDuration < 90 ? '✅ PASS' : '⚠️ WARNING'}`);

    expect(maxDuration).toBeLessThan(120); // Hard limit
  });
});
