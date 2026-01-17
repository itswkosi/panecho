# Performance & Cost Monitoring Guide

## Performance Benchmarking

### Metrics to Track

For each TCIA scan processed, record the following metrics:

```csv
Scan_ID,Test_Date,Test_Time,Upload_Start_Time,Upload_Complete_Time,Upload_Duration_Seconds,Analysis_Start_Time,Analysis_Complete_Time,Analysis_Duration_Seconds,PDF_Generation_Time_Seconds,Total_End_To_End_Seconds,Tokens_Used_Input,Tokens_Used_Output,Total_Tokens,Estimated_Cost_USD,Processing_Status,Notes
TCIA_001,2026-01-16,14:05:00,14:05:05,14:05:15,10,14:05:20,14:06:17,57,2,69,1800,700,2500,0.125,SUCCESS,
TCIA_002,2026-01-16,14:10:00,14:10:05,14:10:35,30,14:10:40,14:11:46,66,3,99,1950,850,2800,0.14,SUCCESS,
TCIA_003,2026-01-16,14:15:00,14:15:05,14:15:45,40,14:15:50,14:17:01,71,2,113,2100,750,2850,0.1425,SUCCESS,
TCIA_004,2026-01-16,14:20:00,14:20:05,14:20:55,50,14:21:00,14:22:15,75,3,128,2050,800,2850,0.1425,SUCCESS,
TCIA_005,2026-01-16,14:25:00,14:25:05,14:26:15,70,14:26:20,14:27:45,85,2,157,2200,900,3100,0.155,SUCCESS,Slightly slower
TCIA_006,2026-01-16,14:30:00,14:30:05,14:31:25,80,14:31:30,14:33:01,91,3,174,2300,950,3250,0.1625,SUCCESS,
TCIA_007,2026-01-16,14:35:00,14:35:05,14:35:55,50,14:36:00,14:37:12,72,2,124,2100,800,2900,0.145,SUCCESS,
TCIA_008,2026-01-16,14:40:00,14:40:05,14:41:05,60,14:41:10,14:42:28,78,3,141,2150,850,3000,0.15,SUCCESS,
TCIA_009,2026-01-16,14:45:00,14:45:05,14:46:35,90,14:46:40,14:48:05,85,2,177,2300,900,3200,0.16,SUCCESS,Large file
TCIA_010,2026-01-16,14:50:00,14:50:05,14:51:05,60,14:51:10,14:52:22,72,3,135,2100,750,2850,0.1425,SUCCESS,
```

### How to Collect Performance Data

#### 1. Manual Timing (Simple Method)

Use browser developer tools:

1. Open DevTools (F12)
2. Go to Network tab
3. Upload scan and watch for POST requests
4. Record:
   - Upload duration (time until response)
   - Analysis duration (time until results page loads)

#### 2. Automated with Playwright

Use the E2E test script that records timings:

```bash
npx playwright test test/e2e/staging-scenarios.spec.ts --reporter=html
# Results in playwright-report/index.html
```

#### 3. From Server Logs (Most Accurate)

Query Supabase logs:

```sql
-- Get processing duration by scan
SELECT 
  scan_id,
  created_at,
  EXTRACT(EPOCH FROM (updated_at - created_at)) as duration_seconds,
  status
FROM analyses
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

#### 4. From Vercel Logs

```bash
# Stream logs in real-time
vercel logs https://staging.panecho.dev --follow

# Look for:
# - "Analysis started" timestamps
# - "Analysis complete" timestamps
# - Any errors or timeouts
```

### Analysis & Reporting

#### Calculate Summary Statistics

```python
import csv
import statistics

# Read performance data
with open('TCIA_PERFORMANCE_DATA.csv') as f:
    reader = csv.DictReader(f)
    analysis_times = [float(row['Analysis_Duration_Seconds']) for row in reader]

# Calculate stats
mean = statistics.mean(analysis_times)
median = statistics.median(analysis_times)
stdev = statistics.stdev(analysis_times)
min_time = min(analysis_times)
max_time = max(analysis_times)

print(f"Analysis Duration Statistics")
print(f"  Mean: {mean:.1f}s")
print(f"  Median: {median:.1f}s")
print(f"  Std Dev: {stdev:.1f}s")
print(f"  Min: {min_time:.1f}s")
print(f"  Max: {max_time:.1f}s")
print(f"  Target: <90s")
print(f"  Status: {'✅ PASS' if mean < 90 else '⚠️ REVIEW'}")

# Find outliers (>90s)
outliers = [t for t in analysis_times if t > 90]
if outliers:
    print(f"\n⚠️ {len(outliers)} scans exceeded target")
    for i, t in enumerate(outliers):
        print(f"   Scan {i}: {t:.1f}s")
```

#### Performance Targets

| Metric | Target | Acceptable | Investigate |
|--------|--------|------------|-------------|
| Upload time | <30s | <60s | >60s |
| Analysis time | <60s | <90s | >90s |
| PDF generation | <5s | <10s | >10s |
| End-to-end | <90s | <120s | >120s |

#### Performance Assessment Framework

```
🟢 EXCELLENT: All scans <60s analysis time
🟡 GOOD:      Average <80s, max <90s
🟠 ACCEPTABLE: Average <85s, max <100s (needs monitoring)
🔴 POOR:      Average >85s or max >100s (needs optimization)
```

### Common Performance Issues & Fixes

| Issue | Cause | Solution |
|-------|-------|----------|
| Slow upload (>60s) | Large file, slow network | Check file size, compress if possible |
| Slow analysis (>90s) | Model loading, complex scan | Optimize prompts, use faster model |
| Slow PDF (>10s) | Many pages, complex rendering | Reduce content, optimize PDF generation |
| Timeout (>120s) | Server overload, API rate limit | Scale up, implement caching |
| Inconsistent timing | Variable API response | Profile API calls, add monitoring |

---

## Cost Monitoring & Analysis

### OpenAI API Cost Tracking

#### 1. Set Up Cost Monitoring

Go to [OpenAI Platform](https://platform.openai.com/account/usage/overview):

1. Click "Usage" in left sidebar
2. Set date range to test period
3. Note starting balance
4. Monitor usage throughout testing
5. Record final balance

#### 2. Track Token Usage by Scan

For each scan, record:

```csv
Scan_ID,Model,Tokens_Input,Tokens_Output,Total_Tokens,Cost_USD,Tokens_Per_Dollar
TCIA_001,gpt-4o,1800,700,2500,0.125,20000
TCIA_002,gpt-4o,1950,850,2800,0.14,20000
TCIA_003,gpt-4o,2100,750,2850,0.1425,20000
```

**Cost Calculation:**
- GPT-4o pricing (as of Jan 2026):
  - Input: $0.000005 per token
  - Output: $0.000015 per token
  - Formula: `(input_tokens * 0.000005) + (output_tokens * 0.000015)`

**Example:**
- TCIA_001: (1800 × 0.000005) + (700 × 0.000015) = 0.009 + 0.0105 = $0.0195
  
*Note: Prices may have changed. Check OpenAI dashboard for current rates.*

#### 3. Analyze Cost Trends

After 10 scans:

```
Average cost per scan: $(total cost / 10)
Total cost for 10 scans: $XX.XX

Cost by type:
- Initial analysis: $XX.XX (avg $X.XX per scan)
- Longitudinal analysis: $XX.XX (avg $X.XX per comparison)
- PDF generation: $X.XX (avg $X.XX per PDF)

Target Assessment:
✅ Under budget if <$20 total
⚠️ On budget if $20-30 total
🔴 Over budget if >$30 total
```

#### 4. Optimize Costs

If costs are too high:

1. **Reduce input tokens:**
   - Use DICOM preview instead of full image
   - Compress scan data
   - Reduce metadata included in prompt

2. **Reduce output tokens:**
   - Use structured output format
   - Remove verbose explanations
   - Use templates for responses

3. **Model selection:**
   - Consider GPT-4o mini for simple cases
   - Reserve GPT-4o for complex analyses
   - Profile which model works best

### Cost Monitoring Spreadsheet

```csv
Date,Scan_Count,Total_Tokens,Total_Cost_USD,Cost_Per_Scan_USD,Status,Notes
2026-01-16,1,2500,0.125,0.125,TRACK,Initial test
2026-01-16,2,5300,0.265,0.1325,TRACK,Second scan
2026-01-16,3,8150,0.4075,0.1358,TRACK,Average holding
2026-01-16,4,11000,0.55,0.1375,TRACK,Costs increasing?
2026-01-16,5,13850,0.6925,0.1385,REVIEW,Trend upward
2026-01-16,6,17100,0.855,0.1425,REVIEW,Input tokens high?
2026-01-16,7,19000,0.95,0.1357,OK,Stabilizing
2026-01-16,8,22000,1.1,0.1375,OK,Within variance
2026-01-16,9,25200,1.26,0.14,OK,Expected
2026-01-16,10,28050,1.4025,0.14025,FINAL,Average: $0.140 per scan
```

### Budgeting & Forecasting

#### Development & Testing Phase

```
Expected usage:
- 10 TCIA scans: $1.50-2.00
- 20 internal test scans: $2.80-4.00
- Longitudinal analysis tests (5): $2.50-5.00
- Error handling tests: $1.00
- Load testing (20 concurrent): $5.00-10.00

Total estimated: $12.80-22.00
Budget: $50 (high confidence)
Confidence: HIGH
```

#### Production Estimation (First Month)

```
Conservative estimate (50 scans/month):
- 50 initial analyses @ $0.14: $7.00
- 10 longitudinal analyses @ $0.50: $5.00
- API overhead & retries (10%): $1.20
Total: ~$13.20

Aggressive estimate (200 scans/month):
- 200 initial @ $0.14: $28.00
- 50 longitudinal @ $0.50: $25.00
- Overhead: $5.30
Total: ~$58.30

Monthly budget recommendation: $75-100
```

### Cost Alerts & Limits

#### Set Up Cost Limits (OpenAI Dashboard)

1. Account → Billing → Usage limits
2. Set hard limit: $100/month
3. Set soft limit notification: $50
4. Receive email when limits approached

#### Monitor Vercel Costs

Vercel serverless functions cost:
- Free tier: 100GB-hours/month
- Pro tier: Pay per execution

Expected:
- 1,000 scans/month = ~100-200 GB-hours
- Cost: $0-5/month (unless exceed free tier)

#### Monitor Supabase Costs

Supabase database (Pro plan):
- Fixed: ~$25/month
- Overage: ~$2.50 per 100K requests

Expected:
- 1,000 scans = ~3,000 database requests
- Cost: ~$25/month (no overage)

### Cost Report Template

```markdown
## Cost Analysis Report

### Period
- Start Date: 2026-01-16
- End Date: 2026-01-20
- Duration: 5 days
- Scans Processed: 10

### OpenAI API Costs
- Total cost: $1.40
- Average per scan: $0.14
- Range: $0.125 - $0.16
- **Status: ✅ UNDER BUDGET**

### Token Usage
- Input tokens: 20,500
- Output tokens: 8,300
- Total tokens: 28,800
- Efficiency: 20,571 tokens per dollar

### Infrastructure Costs
- Vercel: $0 (within free tier)
- Supabase: $25 (monthly, pro-rated)
- **Subtotal: $25**

### Total Cost
- OpenAI: $1.40
- Infrastructure: $25.00
- **Total: $26.40**
- **Cost per scan: $2.64**

### Budget vs Actual
- Budget: $50
- Actual: $26.40
- Remaining: $23.60
- **Status: 47% under budget**

### Recommendations
1. ✅ Costs are well-controlled
2. ✅ Per-scan cost is reasonable
3. ✅ No optimization needed
4. Ready for production deployment

### Forecast (Production)
- Estimated 100 scans/month: $265
- Recommended budget: $500/month
- Headroom: 88% (very safe)
```

---

## Monitoring Commands

### Real-Time Performance Monitoring

```bash
# Stream server logs with performance data
vercel logs https://staging.panecho.dev --follow

# Filter for analysis timing
vercel logs https://staging.panecho.dev --follow | grep -i "analysis\|duration\|time"
```

### Query Performance Data from Database

```sql
-- Average analysis duration
SELECT 
  DATE(created_at) as date,
  COUNT(*) as scan_count,
  ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)))) as avg_duration_seconds,
  MAX(EXTRACT(EPOCH FROM (updated_at - created_at))) as max_duration_seconds,
  MIN(EXTRACT(EPOCH FROM (updated_at - created_at))) as min_duration_seconds
FROM analyses
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Scans that exceeded target
SELECT 
  scan_id,
  created_at,
  EXTRACT(EPOCH FROM (updated_at - created_at)) as duration_seconds,
  status,
  error_message
FROM analyses
WHERE EXTRACT(EPOCH FROM (updated_at - created_at)) > 90
ORDER BY duration_seconds DESC;
```

### Check OpenAI Usage API

```bash
curl https://api.openai.com/v1/usage/requests/tokens/2026-01-16/2026-01-20 \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Returns JSON with token usage over date range
```

---

## Documentation & Reporting

### Performance Report Template

Use this template to summarize findings:

```markdown
# Staging Performance Report

## Executive Summary
- Tested 10 TCIA scans over 5 days
- Average processing time: 71.5 seconds (target: <90s) ✅
- Average cost per scan: $0.14 (target: <$0.50) ✅
- Success rate: 100% (10/10) ✅
- **Status: PASS - Ready for Production**

## Detailed Results
[Include performance table and charts]

## Cost Summary
[Include cost breakdown and forecast]

## Issues & Resolutions
[Document any issues found and how they were resolved]

## Recommendations
[List recommendations for production deployment]
```

---

**Last Updated:** January 2026  
**Status:** Ready for Testing  
**Next Phase:** Execute TCIA testing and generate report
