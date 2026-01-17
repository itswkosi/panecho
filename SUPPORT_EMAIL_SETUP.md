# Support Email Templates & Setup

Email templates and auto-responder setup for production support.

---

## Part 1: Support Email Setup

### Option A: Custom Domain Email

**Using Google Workspace (Recommended):**
1. Purchase `support@panecho.com` ($6/user/month)
2. Set up auto-responder in Gmail settings
3. Create email filters for categorization

**Using Cloudflare Email Routing (Free):**
1. Go to Cloudflare Dashboard
2. Email → Email Routing → Enable
3. Create route: `support@panecho.com` → `your-personal@email.com`
4. Set up auto-responder via email client

### Option B: Use Personal Email (Temporary)

For initial launch, you can use:
- Gmail: `your-email+panecho-support@gmail.com`
- Outlook: Similar alias support
- Forward to main email for now

---

## Part 2: Auto-Responder Template

### Gmail Auto-Responder Setup

1. Gmail → Settings → General
2. Scroll to "Vacation responder"
3. Enable and configure:

**Subject:**
```
Your PanEcho Support Request [#{{ticket_id}}]
```

**Message:**
```html
<p>Hello,</p>

<p>Thank you for contacting PanEcho support! We've received your message and will respond within 24 hours.</p>

<p><strong>What happens next?</strong></p>
<ul>
  <li>Our team will review your request</li>
  <li>You'll receive a detailed response within 24 hours</li>
  <li>For urgent issues, we prioritize based on severity</li>
</ul>

<p><strong>While you wait:</strong></p>
<ul>
  <li>Check our <a href="https://panecho.com/faq">FAQ page</a> for quick answers</li>
  <li>Review our <a href="https://panecho.com/docs">documentation</a></li>
  <li>Visit our <a href="https://status.panecho.com">status page</a> for system updates</li>
</ul>

<p><strong>Emergency or critical issue?</strong><br>
If your issue involves data loss, security concerns, or complete service outage, please mark your email as URGENT and we'll prioritize accordingly.</p>

<p>Thank you for using PanEcho!</p>

<p>Best regards,<br>
PanEcho Support Team<br>
support@panecho.com</p>

<hr>
<p style="font-size: 11px; color: #666;">
This is an automated response. Please do not reply to this message. Your original inquiry has been received and will be addressed by our support team.
</p>
```

---

## Part 3: Support Email Templates

### Template 1: First Response

**Subject:** Re: {{original_subject}} [#{{ticket_id}}]

```
Hi {{user_name}},

Thank you for reaching out to PanEcho support!

I'm {{your_name}}, and I'll be helping you with {{issue_summary}}.

{{custom_response_here}}

Could you please provide the following information to help us investigate:
- Your account email address
- Date and time when the issue occurred (with timezone)
- Browser and device you're using
- Screenshots of any error messages (if applicable)
- Steps to reproduce the issue

I'll be monitoring this ticket and will update you as soon as I have more information.

Best regards,
{{your_name}}
PanEcho Support Team
support@panecho.com
```

### Template 2: Upload Issue Response

**Subject:** Re: Upload Issue [#{{ticket_id}}]

```
Hi {{user_name}},

Thank you for reporting the upload issue. I understand this is frustrating, and I'm here to help.

Common upload issues and solutions:

1. **File Format**
   - Ensure your file is in DICOM format (.dcm)
   - We support DICOM archives (.zip with .dcm files)
   - Other formats (JPEG, PNG) are not currently supported

2. **File Size**
   - Maximum file size: 50 MB
   - If your file is larger, try compressing it
   - Contact us for bulk upload options

3. **Browser Compatibility**
   - Works best on Chrome, Firefox, Safari, Edge
   - Clear browser cache and try again
   - Try incognito/private browsing mode

4. **Network Issues**
   - Check your internet connection
   - Try uploading from a different network
   - Large files may take 1-2 minutes to upload

Could you please let me know:
- What file format are you trying to upload?
- What is the file size?
- What error message do you see (if any)?
- What browser and device are you using?

I'm here to help resolve this quickly!

Best regards,
{{your_name}}
PanEcho Support
```

### Template 3: Processing Error Response

**Subject:** Re: Processing Error [#{{ticket_id}}]

```
Hi {{user_name}},

Thank you for reporting the processing error. I've investigated your scan and here's what I found:

{{investigation_results}}

Possible causes and solutions:

1. **Invalid DICOM File**
   - The file may be corrupted
   - Try re-exporting from your imaging system
   - Ensure proper DICOM headers are present

2. **Unsupported Scan Type**
   - PanEcho is optimized for echocardiogram images
   - CT, MRI, and X-ray may not process correctly
   - Contact us if you need support for other modalities

3. **API Service Issue**
   - Our AI service may have experienced temporary downtime
   - Your scan has been queued for retry
   - You should see results within 30 minutes

4. **File Content Issue**
   - Ensure the file contains actual imaging data
   - Some DICOM files are waveforms or reports (not images)
   - Try a different scan if available

I've {{action_taken}} and will monitor the situation. You should receive an update within {{timeframe}}.

Is there anything else I can help you with?

Best regards,
{{your_name}}
PanEcho Support
```

### Template 4: Account Issue Response

**Subject:** Re: Account Issue [#{{ticket_id}}]

```
Hi {{user_name}},

I can help you with your account issue.

{{custom_response}}

For security reasons, please verify your identity by:
1. Replying from the email address associated with your account
2. OR providing your account email if different from this one

Common account issues and solutions:

**Can't log in?**
- Use the "Forgot Password" link to reset
- Check that your email is verified (check spam folder)
- Try clearing browser cookies

**Didn't receive confirmation email?**
- Check spam/junk folder
- Add support@panecho.com to your contacts
- Request a new confirmation email

**Want to delete your account?**
- Go to Account Settings → Delete Account
- Or reply to confirm and I'll process it for you
- Note: This permanently deletes all your data

**Other account questions?**
- Let me know specifically what you need help with

I'm here to help resolve this!

Best regards,
{{your_name}}
PanEcho Support
```

### Template 5: Feature Request Response

**Subject:** Re: Feature Request [#{{ticket_id}}]

```
Hi {{user_name}},

Thank you for your feature suggestion! We love hearing from our users.

Your suggestion: {{feature_description}}

This is {{great/interesting/valuable}} feedback! I've added it to our feature request tracker and shared it with our product team.

Here's what happens next:
1. Product team reviews all feature requests
2. We prioritize based on user demand and feasibility
3. Selected features are added to our roadmap
4. We'll notify you if your request is implemented

In the meantime, you might find these existing features helpful:
{{alternative_features}}

We're constantly improving PanEcho based on user feedback. Keep the suggestions coming!

Would you like me to notify you when we implement this feature?

Best regards,
{{your_name}}
PanEcho Support
```

### Template 6: Billing Question Response

**Subject:** Re: Billing Question [#{{ticket_id}}]

```
Hi {{user_name}},

Thank you for contacting us about billing.

{{custom_response}}

PanEcho Pricing Overview:

**Free Tier** (Current)
- 50 scans per month
- All features included
- 30-day data retention
- Community support

**Pro Tier** (Coming Soon)
- Unlimited scans
- Priority processing
- 1-year data retention
- Email support
- Advanced analytics

**Enterprise** (Custom)
- Custom volume
- Dedicated support
- HIPAA compliance
- SLA guarantees
- Contact us for pricing

Currently, PanEcho is free while in beta. We'll notify all users at least 30 days before any pricing changes.

Is there anything else I can help clarify?

Best regards,
{{your_name}}
PanEcho Support
```

### Template 7: Bug Report Response

**Subject:** Re: Bug Report [#{{ticket_id}}]

```
Hi {{user_name}},

Thank you for reporting this bug! Detailed reports like yours help us improve PanEcho.

Bug details:
- Issue: {{issue_description}}
- Affected area: {{feature/page}}
- Severity: {{low/medium/high/critical}}
- Status: {{investigating/confirmed/fix_in_progress}}

{{investigation_details}}

**What we're doing:**
{{action_plan}}

**Expected timeline:**
- Critical bugs: Fixed within 24 hours
- High priority: Fixed within 1 week
- Medium priority: Fixed in next release
- Low priority: Scheduled for future update

I'll keep you updated on our progress. You'll receive a notification when the fix is deployed.

Thank you for helping us make PanEcho better!

Best regards,
{{your_name}}
PanEcho Support
```

### Template 8: Closing/Resolution Template

**Subject:** [RESOLVED] {{original_subject}} [#{{ticket_id}}]

```
Hi {{user_name}},

Great news! Your issue has been resolved.

**Summary:**
{{issue_summary}}

**Resolution:**
{{resolution_details}}

**What was fixed:**
{{fix_description}}

The fix is now live in production. Please try again and let me know if you experience any further issues.

**Feedback Request:**
How was your support experience? Your feedback helps us improve.
- Reply with: Excellent / Good / Fair / Poor

Is there anything else I can help you with?

Best regards,
{{your_name}}
PanEcho Support

---
This ticket is now closed. Reply to this email to reopen if needed.
```

---

## Part 4: Email Filters & Organization

### Gmail Filter Setup

**Priority Labels:**
1. **URGENT** - Keywords: "urgent", "emergency", "critical", "data loss", "security"
2. **BUG** - Keywords: "bug", "error", "broken", "not working"
3. **FEATURE** - Keywords: "feature", "suggestion", "request", "would be nice"
4. **QUESTION** - Keywords: "how to", "question", "help", "?"

**Auto-Tagging:**
- Subject contains [BUG] → Label: Bug
- Subject contains [FEATURE] → Label: Feature Request
- Subject contains [URGENT] → Star + Notify

---

## Part 5: Support Knowledge Base (Internal)

### Common Issues Quick Reference

| Issue | Solution | Response Time |
|-------|----------|---------------|
| Can't upload | Check format, size, browser | < 2h |
| Processing stuck | Check AI service status | < 4h |
| Can't log in | Password reset link | < 1h |
| No confirmation email | Resend, check spam | < 1h |
| Results inaccurate | Review DICOM file quality | < 24h |
| Slow performance | Known issue if many users | < 4h |

---

## Part 6: Support Metrics to Track

### Response Metrics
- **First Response Time:** Target < 4 hours
- **Resolution Time:** Target < 24 hours
- **Customer Satisfaction:** Target > 90%

### Volume Metrics
- Tickets per day
- Tickets by category
- Recurring issues
- User feedback sentiment

### Weekly Review Questions
1. What are the top 3 issues this week?
2. Any patterns in user complaints?
3. What can be improved in documentation?
4. Any bugs that need immediate attention?

---

## Part 7: Escalation Procedure

### When to Escalate

**Immediate Escalation (P0):**
- Data loss
- Security breach
- System-wide outage
- HIPAA violation reported

**24-Hour Escalation (P1):**
- Repeated technical failures
- Angry customer requiring supervisor
- Potential PR issue
- Legal inquiry

**Normal Escalation (P2):**
- Feature requests requiring decision
- Refund requests
- Enterprise inquiries
- Partnership proposals

---

## Implementation Checklist

- [ ] Create support@panecho.com email
- [ ] Set up auto-responder
- [ ] Create email templates document
- [ ] Set up email filters/labels
- [ ] Test auto-responder delivery
- [ ] Send test support request
- [ ] Verify response received
- [ ] Add support email to all error messages
- [ ] Add support link to website footer
- [ ] Update README with support contact
- [ ] Create internal support playbook
- [ ] Train team on support procedures (if applicable)

---

**Support email is your direct line to users - respond quickly and helpfully! 📧**
