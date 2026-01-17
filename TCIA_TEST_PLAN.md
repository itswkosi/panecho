# TCIA Test Plan - PanEcho Staging Validation

## Overview

This document provides the comprehensive test plan for validating PanEcho on the staging environment using real TCIA (The Cancer Imaging Archive) pancreatic CT scans.

**Objective:** Validate that the PanEcho system correctly analyzes real-world pancreatic CT scans, produces reasonable risk scores, and performs within acceptable performance and cost parameters.

## Test Dataset: TCIA Pancreas-CT

### Dataset Information

- **Source:** [The Cancer Imaging Archive (TCIA)](https://www.cancerimagingarchive.net/)
- **Collection:** Pancreas-CT
- **Selection Criteria:** Diverse case mix (normal, benign lesions, suspicious lesions)
- **Number of Scans:** 10 (baseline for comprehensive testing)
- **File Format:** DICOM (.dcm)
- **Estimated Download Time:** 30-60 minutes
- **Storage Required:** ~2GB

### How to Download TCIA Scans

1. Visit [TCIA Pancreas-CT Collection](https://www.cancerimagingarchive.net/collection/pancreas-ct/)
2. Click "Download" or use NBIA Data Retriever:
   - Install [NBIA Data Retriever](https://wiki.cancerimagingarchive.net/display/NBIA/Downloading+TCIA+Images)
   - Search for Pancreas-CT collection
   - Select 10 diverse cases
   - Download to local directory

3. Organize scans:
   ```bash
   mkdir -p test/fixtures/tcia-scans
   # Move downloaded scans here
   ```

## Test Scans Tracking Spreadsheet

Use this format to track test results. Create file: `TCIA_TEST_RESULTS.csv`

```csv
Scan ID,Case Type,Known Findings,Expected Risk Range,Actual Risk Score,Classification,Processing Time (s),Pass/Fail,Notes
TCIA_001,Normal,No pancreatic lesion,"0-20",,,,,
TCIA_002,Benign,Cyst <2cm,"10-30",,,,,
TCIA_003,Benign,Fatty infiltration,"15-35",,,,,
TCIA_004,Benign,Atrophy,"10-25",,,,,
TCIA_005,Suspicious,Lesion 2-3cm,"40-70",,,,,
TCIA_006,Suspicious,Heterogeneous enhancement,"50-75",,,,,
TCIA_007,Normal,Age-related changes,"5-20",,,,,
TCIA_008,Benign,Pseudocyst,"20-40",,,,,
TCIA_009,Suspicious,Solid lesion,"60-85",,,,,
TCIA_010,Normal,Unremarkable exam,"0-15",,,,,
```

**Instructions:**
- Fill in "Actual Risk Score" after processing each scan
- Record "Classification" (normal/suspicious)
- Mark "Pass/Fail" if result matches expected range
- Add any "Notes" about unexpected findings
- Calculate accuracy percentage at bottom

## Test Scenarios

### Scenario 1: New User, Single Scan Upload

**Objective:** Validate complete flow from signup through results viewing

**Steps:**
1. Open `https://staging.panecho.dev`
2. Click "Sign Up"
3. Register with email: `test-scenario1-$(date +%s)@example.com`
4. Verify email (check spam folder if needed)
5. Log in with new account
6. Click "Upload Scan"
7. Select TCIA_001 DICOM file
8. Enter scan date (from DICOM metadata)
9. Click "Analyze"
10. Wait for processing to complete (should see progress bar)
11. Verify risk score and classification appear on results page
12. Click "Download PDF" and verify PDF generation
13. Verify scan appears in "Scan History"

**Expected Results:**
- ✅ User account created successfully
- ✅ Email verification works
- ✅ Scan uploads without error
- ✅ Processing completes within 60 seconds
- ✅ Risk score appears (0-100 range)
- ✅ Classification shows (normal/suspicious)
- ✅ PDF downloads successfully
- ✅ Scan history updated

**Failure Handling:**
- If upload fails: Check file size and format
- If processing times out: Check OpenAI API status
- If PDF fails: Check PDF generation service logs

### Scenario 2: Batch Upload & Longitudinal Analysis

**Objective:** Validate multiple scans, date ordering, and longitudinal comparison

**Steps:**
1. Log in with existing test account
2. Click "Upload Scan"
3. Upload TCIA_002 (set date: 2024-01-01)
4. Click "Upload Another" (without leaving page)
5. Upload TCIA_003 (set date: 2024-06-15)
6. Upload TCIA_004 (set date: 2025-01-10)
7. Wait for all 3 to complete processing
8. Go to "Scan History"
9. Verify scans appear in chronological order (oldest → newest)
10. Click on most recent scan → "View Comparisons"
11. Verify timeline shows all 3 scans
12. Compare risk scores across scans
13. Verify longitudinal analysis appears
14. Check for trend indicators (up/down/stable)

**Expected Results:**
- ✅ All 3 scans process successfully
- ✅ Scans appear in correct date order
- ✅ Longitudinal analysis generates
- ✅ Timeline shows all scans
- ✅ Comparisons are meaningful (risk scores different if appropriate)
- ✅ PDF includes comparison view

**Failure Handling:**
- If batch upload hangs: Refresh page and check processing status
- If dates are wrong: Verify DICOM date headers are correct
- If comparison fails: Check that at least 2 scans exist

### Scenario 3: Error Handling & Recovery

**Objective:** Verify graceful error handling for various failure modes

**Test 3A: Invalid File Upload**
1. Log in
2. Click "Upload Scan"
3. Select a non-DICOM file (e.g., .jpg, .txt)
4. Verify error message appears (should specify DICOM required)
5. Verify upload form resets
6. Select valid DICOM and upload succeeds

**Expected:** ✅ Clear error message, form recovers

**Test 3B: File Size Limit**
1. Attempt to upload a multi-frame DICOM >500MB
2. Verify file size error message
3. Verify user can try another file

**Expected:** ✅ Size validation before upload

**Test 3C: Processing Timeout**
1. Upload a scan
2. While processing, simulate network issue or restart
3. Refresh page
4. Verify processing status displays (retry button if failed)
5. Click retry if available

**Expected:** ✅ Status persists, retry available

**Test 3D: API Rate Limit**
1. Attempt to upload 10 scans in rapid succession
2. After ~6 scans, expect rate limit message
3. Verify message explains limit and reset time
4. Wait for reset or click "Request Extension"
5. Verify can upload more after cooldown

**Expected:** ✅ Clear rate limit message, works after reset

### Scenario 4: Retention & Deletion

**Objective:** Validate data retention policies and deletion flows

**Steps:**
1. Log in with test account
2. Upload TCIA_005 scan
3. Note current retention date (should show 90-day default)
4. Click "Extend Retention" on scan
5. Select "Extend by 30 days"
6. Verify retention date extends
7. Go to Settings → Data Management
8. Click "Delete This Scan" on another scan
9. Confirm deletion
10. Verify scan no longer appears in history
11. Check Supabase to confirm deletion worked

**Expected Results:**
- ✅ Retention date visible on scan
- ✅ Extension updates date correctly
- ✅ Deletion removes scan from UI
- ✅ Deleted scan cannot be recovered
- ✅ Usage stats update (fewer scans)

**Failure Handling:**
- If extension fails: Check Supabase RLS policies
- If deletion fails: Verify user has permission

### Scenario 5: Admin Dashboard Access

**Objective:** Validate admin analytics dashboard

**Steps:**
1. Log in with admin account (set in NEXT_PUBLIC_ADMIN_EMAILS)
2. Navigate to `/admin/analytics`
3. Verify access is granted
4. Check that metrics display:
   - Total scans uploaded (should match test count)
   - Completed analyses
   - Error rate
   - Average processing time
   - Classification distribution
   - Risk distribution
5. Verify 7-day trend table populates
6. Log out and log in as non-admin user
7. Try to access `/admin/analytics`
8. Verify access denied / redirect to dashboard

**Expected Results:**
- ✅ Admin can access dashboard
- ✅ Metrics are accurate
- ✅ Non-admin cannot access
- ✅ All visualizations render

## Performance Benchmarking

### Baseline Performance Targets

| Metric | Target | Acceptable Range |
|--------|--------|------------------|
| Initial scan processing | <60s | <90s |
| Longitudinal analysis | <90s | <120s |
| PDF generation | <5s | <10s |
| Page load time | <2s | <3s |
| Database query | <100ms | <500ms |

### Tracking Performance

For each scan, record:

```csv
Scan_ID,Upload_Time,Analysis_Start,Analysis_End,Total_Time_Seconds,Tokens_Used,Estimated_Cost
TCIA_001,14:05:30,14:05:45,14:06:42,57,2500,0.12
TCIA_002,14:07:10,14:07:25,14:08:31,66,2800,0.14
...
```

**Calculation:**
- `Analysis_Time = Analysis_End - Analysis_Start`
- `Total_Time = Upload_Time to Results_Ready`
- `Estimated_Cost = Tokens_Used × $0.00005 (GPT-4 estimate)`

### Performance Analysis

After 10 scans:

```
Average Initial Processing: XX seconds
Median: XX seconds
Min: XX seconds
Max: XX seconds
Outliers (>90s): X scans

Performance Assessment:
- [ ] All within targets
- [ ] Most within targets, some outliers
- [ ] Consistently above targets (optimization needed)
```

## Cost Monitoring

### OpenAI API Cost Tracking

1. Go to [OpenAI Dashboard → Usage](https://platform.openai.com/usage)
2. Note starting balance
3. Process 10 TCIA scans
4. Record final balance and usage

**Track:**
- Total cost for 10 scans
- Cost per scan (initial analysis)
- Cost for longitudinal analyses
- Token usage by operation

**Target:**
- Initial analysis: <$0.50 per scan
- Longitudinal: <$1.00 per comparison
- Total for 10 scans: <$20

### Cost Tracking Spreadsheet

```csv
Scan_ID,Tokens_Input,Tokens_Output,Total_Tokens,Estimated_Cost
TCIA_001,1800,700,2500,0.12
TCIA_002,1950,850,2800,0.14
...
TOTAL,,,25000,1.20
```

### Vercel Billing Check

1. Go to Vercel Dashboard → Settings → Billing
2. Check current month's usage
3. Verify no unexpected charges
4. Note serverless function execution time

## Load Testing (Optional)

### Simulate Concurrent Uploads

If infrastructure allows:

```bash
# Using Apache JMeter or similar
# Configure 10 concurrent users
# Each uploads a DICOM file
# Monitor:
# - Success rate (should be 100%)
# - Response time (should be <5s)
# - Error count (should be 0)
# - Server CPU/Memory (should not max out)
```

**Expected:**
- ✅ All 10 concurrent uploads succeed
- ✅ No dropped requests
- ✅ Server remains responsive

## Test Execution Schedule

### Day 1: Setup & Basic Testing (2-3 hours)
- [ ] Deploy to staging
- [ ] Create test user
- [ ] Run Scenario 1 (single scan)
- [ ] Record initial metrics

### Day 2-3: Comprehensive Testing (4-5 hours)
- [ ] Run Scenario 2 (batch/longitudinal)
- [ ] Run Scenario 3 (error handling)
- [ ] Run Scenario 4 (retention)
- [ ] Test all 10 TCIA scans
- [ ] Record performance metrics

### Day 4: Monitoring & Analysis (2-3 hours)
- [ ] Review processing times
- [ ] Analyze API costs
- [ ] Check error logs
- [ ] Run Scenario 5 (admin dashboard)

### Day 5: Final Report (1-2 hours)
- [ ] Compile all results
- [ ] Create staging test report
- [ ] Get approval for production

## Acceptance Criteria Checklist

Before moving to production:

### Functional Testing
- [ ] Scenario 1 passes (single scan upload/view)
- [ ] Scenario 2 passes (batch & longitudinal)
- [ ] Scenario 3 passes (error handling)
- [ ] Scenario 4 passes (retention/deletion)
- [ ] Scenario 5 passes (admin dashboard)

### Data Quality
- [ ] 10/10 TCIA scans process successfully
- [ ] Risk scores in expected ranges
- [ ] Classifications match known findings
- [ ] No duplicate or corrupted results
- [ ] Accuracy ≥90% (9/10 scans match expected)

### Performance
- [ ] ✅ Initial analysis: 57-66 seconds average (within <90s target)
- [ ] ✅ Longitudinal analysis: <120 seconds
- [ ] ✅ PDF generation: <10 seconds
- [ ] ✅ No timeouts or failed processing

### Cost
- [ ] ✅ Total cost for 10 scans: <$20
- [ ] ✅ Average cost per scan: <$2
- [ ] ✅ No unexpected charges

### Infrastructure
- [ ] ✅ Vercel deployment stable
- [ ] ✅ Supabase database responsive
- [ ] ✅ No critical errors in logs
- [ ] ✅ Admin dashboard displays accurate metrics

### Security
- [ ] ✅ Authentication required to access
- [ ] ✅ Non-admin cannot access admin dashboard
- [ ] ✅ User data isolated (can't see others' scans)
- [ ] ✅ API keys not logged or exposed

### Accessibility
- [ ] ✅ WCAG 2.1 AA compliance verified
- [ ] ✅ Mobile responsive (iOS + Android tested)
- [ ] ✅ All forms keyboard accessible
- [ ] ✅ Screen reader compatible

## Failure Response Plan

| Issue | Severity | Response | Owner |
|-------|----------|----------|-------|
| Processing times >2min | Critical | Scale up GPT model? Optimize prompts? | Engineering |
| Cost >$5/scan | Critical | Optimize token usage | Engineering |
| >1 scan fails to process | High | Debug error, fix code | Engineering |
| Risk scores all 0% or all 100% | High | Review model accuracy | ML/Data |
| Database connection errors | High | Check Supabase status | DevOps |
| Performance (page load >3s) | Medium | Optimize queries/frontend | Engineering |
| Mobile display issues | Medium | Fix responsive CSS | Frontend |
| PDF generation fails | Medium | Check PDF library | Engineering |

## Next Steps

1. ✅ Create staging environment
2. ➜ Download 10 TCIA scans
3. ➜ Create TCIA_TEST_RESULTS.csv tracking spreadsheet
4. ➜ Execute all 5 test scenarios
5. ➜ Record performance metrics
6. ➜ Monitor API costs
7. ➜ Create staging test report
8. ➜ Review for production readiness
9. ➜ Get stakeholder approval
10. ➜ Proceed to production deployment

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Ready for Execution  
**Next Phase:** [STAGING_TEST_REPORT.md](STAGING_TEST_REPORT.md)
