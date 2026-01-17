# Implementation Checklist

Use this checklist to integrate the usage tracking system into PanEcho.

## Phase 1: Core Setup (Essential)

- [ ] **Add UsageProvider to layout**
  - Edit `src/app/(protected)/layout.tsx`
  - Wrap children with `<UsageProvider>`
  - Import: `import { UsageProvider } from '@/components/providers/UsageProvider';`

- [ ] **Verify Zustand is installed**
  - Check `package.json` for `zustand` dependency
  - If missing: `npm install zustand`

- [ ] **Run tests**
  - `npm test -- test/lib/usage`
  - `npm test -- test/components/usage`
  - All tests should pass

## Phase 2: Display Components (Recommended)

- [ ] **Add UsageDisplay to Dashboard**
  - Edit `src/app/(protected)/dashboard/page.tsx`
  - Add: `<UsageDisplay />`
  - Import: `import { UsageDisplay } from '@/components/usage/UsageDisplay';`

- [ ] **Add UsageWidget to Header**
  - Edit `src/components/Header.tsx` (or main navigation)
  - Add compact widget: `<UsageWidget compact={true} />`
  - Import: `import { UsageWidget } from '@/components/usage/UsageWidget';`

- [ ] **Add Usage to Settings Page**
  - Edit `src/app/(protected)/settings/page.tsx` (if exists)
  - Add: `<UsageDisplay />`
  - Include "Upgrade" button

## Phase 3: Upload Protection (Important)

- [ ] **Add check to upload action**
  - Edit `src/app/actions/upload.ts`
  - Check if limit exceeded before processing
  - Return error: `{ error: 'Usage limit exceeded' }`

- [ ] **Update upload UI**
  - Edit upload page component
  - Use `useCheckUsage()` hook
  - Disable upload button when limit reached
  - Show warning message
  - Example:
    ```tsx
    const { checkAndExecute } = useCheckUsage({
      onFail: () => toast.error('Limit reached'),
    });
    ```

- [ ] **Test upload when limit exceeded**
  - Create test user with limit reached
  - Verify upload is blocked
  - Verify error message shows

## Phase 4: Processing Protection (Important)

- [ ] **Add check to processing action**
  - Edit `src/app/actions/process.ts` or similar
  - Check usage before processing
  - Return error if limit exceeded

- [ ] **Update processing UI**
  - Show remaining scans on processing page
  - Disable processing when limit reached
  - Display quota information

- [ ] **Test processing when limit exceeded**
  - Verify operations are blocked
  - Verify error handling works

## Phase 5: Batch Operations (If Applicable)

- [ ] **Protect batch upload**
  - Check total files vs remaining quota
  - Prevent uploading more than quota allows
  - Show warning for partial success

- [ ] **Protect batch processing**
  - Similar protection for batch processes
  - Clear feedback on how many can proceed

## Phase 6: User Feedback (Nice to Have)

- [ ] **Add quota warning modal**
  - Create `QuotaWarningModal` component
  - Show when usage > 80%
  - Include link to pricing page
  - Example in `USAGE_INTEGRATION_EXAMPLES.md`

- [ ] **Add upgrade prompts**
  - Show "Upgrade" CTA in relevant places
  - Dashboard when near limit
  - Processing page when cannot process
  - Results page suggestions

- [ ] **Email notifications (Future)**
  - Send email when hitting 80%
  - Send email when hitting limit
  - Include upgrade link

## Phase 7: API Routes (Backend Protection)

- [ ] **Protect upload endpoint**
  - Edit `app/api/upload/route.ts`
  - Check usage before accepting file
  - Return 429 if limit exceeded

- [ ] **Protect process endpoint**
  - Edit `app/api/process/route.ts` or similar
  - Check usage before processing
  - Return 429 if limit exceeded

- [ ] **Test API protection**
  - Call endpoints directly
  - Verify rate limiting works

## Phase 8: Database Sync (Already Done)

- [ ] **Verify database schema**
  - Users table has `plan_type` column
  - Scans table has `file_size_bytes` and `user_id`
  - Create triggers if needed for deleted scans

- [ ] **Test database queries**
  - Run: `npm test -- test/lib/usage/tracker.test.ts`
  - Verify calculations are accurate

## Phase 9: Customization

- [ ] **Update plan limits if needed**
  - Edit `src/lib/usage/tracker.ts`
  - Modify `getUsageLimitByPlan()`
  - Test with new limits

- [ ] **Customize warning threshold**
  - Edit `src/lib/hooks/useUsage.ts`
  - Change percentage from 80 to desired value
  - Update tests if changed

- [ ] **Customize colors/styling**
  - Edit component files in `src/components/usage/`
  - Match your design system
  - Update Tailwind colors

- [ ] **Customize messages**
  - Edit text in components
  - Match your tone/voice
  - Translate if multilingual

## Phase 10: Testing & QA

- [ ] **Unit test all scenarios**
  - Run: `npm test` (all tests)
  - Coverage should be >95%

- [ ] **Manual testing checklist**
  - [ ] Free plan user hits scan limit
  - [ ] Free plan user hits storage limit
  - [ ] Pro plan user has plenty of quota
  - [ ] Upload blocked when limit reached
  - [ ] Processing blocked when limit reached
  - [ ] Warning shows at 80% usage
  - [ ] Error handling works properly
  - [ ] UI responsive on mobile
  - [ ] Dark mode works (if applicable)

- [ ] **Edge cases**
  - [ ] No usage data (network error)
  - [ ] User with no scans yet
  - [ ] User with exactly limit reached
  - [ ] Enterprise plan with very high limits
  - [ ] Rapid quota consumption
  - [ ] Concurrent requests

## Phase 11: Documentation

- [ ] **Update README**
  - Add link to USAGE_TRACKING.md
  - Document supported plans
  - Add configuration section

- [ ] **Document for other developers**
  - Link to USAGE_TRACKING.md in project docs
  - Share quick start guide
  - Share integration examples

- [ ] **Create runbook for support**
  - How to check user's usage
  - How to reset quotas for support cases
  - How to upgrade plans

## Phase 12: Monitoring & Analytics

- [ ] **Add usage metrics**
  - Track how often limit is hit
  - Track upgrade conversions from limit
  - Track false positives (if any)

- [ ] **Set up alerts**
  - Alert when many users hit limit
  - Alert if system issues preventing checks
  - Alert for edge cases

- [ ] **Create dashboard**
  - Global usage stats
  - Plan distribution
  - Upgrade trends

## Phase 13: Rollout

- [ ] **Staging deployment**
  - Deploy to staging environment
  - Run full QA suite
  - Gather team feedback

- [ ] **Production deployment**
  - Deploy during low-traffic window
  - Monitor error logs
  - Monitor user reports
  - Have rollback plan ready

- [ ] **Post-deployment**
  - Monitor key metrics
  - Respond to user feedback
  - Iterate on copy/UX
  - Track upgrade conversions

## Phase 14: Future Enhancements (Backlog)

- [ ] Real-time usage updates via WebSocket
- [ ] Usage analytics dashboard
- [ ] Email/push notifications
- [ ] Usage-based dynamic pricing
- [ ] Soft limits with warnings before hard limit
- [ ] Usage export/reports
- [ ] Custom quota per user
- [ ] Trial periods with extended quotas
- [ ] Rollover unused quota to next period
- [ ] Family/team shared quotas

## Success Criteria

✅ All tests passing
✅ Usage limits enforced on upload
✅ Usage limits enforced on processing
✅ Users see clear warnings at 80%
✅ Users cannot proceed when limit hit
✅ API routes protected
✅ Error handling works
✅ Performance impact minimal (<50ms extra latency)
✅ Mobile UI responsive
✅ Documentation complete
✅ Team trained on system
✅ No critical issues in production

## Quick Links

- 📖 [Complete Documentation](./docs/USAGE_TRACKING.md)
- 💡 [Integration Examples](./docs/USAGE_INTEGRATION_EXAMPLES.md)
- ⚡ [Quick Start](./USAGE_SYSTEM_QUICKSTART.md)
- 📋 [Implementation Summary](./USAGE_SYSTEM_IMPLEMENTATION.md)

## Notes

- All code is production-ready and tested
- TypeScript types are fully defined
- Follows Next.js 14 best practices
- Works with existing auth system
- Compatible with Supabase

---

**Questions?** See documentation files or check test examples for how to use.
