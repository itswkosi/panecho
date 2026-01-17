# PanEcho - AI-Powered Echocardiogram Analysis

PanEcho is an advanced web application that uses artificial intelligence to analyze echocardiogram (ultrasound) images and provide detailed cardiac assessments.

## 🚀 Quick Start

### For Users

1. **Sign up** at [https://panecho.com](https://panecho.com)
2. **Upload** your echocardiogram files (DICOM format)
3. **Wait** 60-90 seconds for AI analysis
4. **View** detailed results and recommendations
5. **Download** professional PDF report

### For Developers

See [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md) for deployment instructions.

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase and OpenAI credentials

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## 📋 Features

### Core Features
- ✅ **DICOM Upload** - Support for medical imaging format
- ✅ **AI Analysis** - GPT-4o-mini powered cardiac assessment
- ✅ **Risk Scoring** - Quantitative risk score (0-100)
- ✅ **Anatomical Analysis** - Detailed chamber and valve assessment
- ✅ **Clinical Recommendations** - Actionable next steps
- ✅ **PDF Reports** - Professional, shareable documentation

### Advanced Features
- ✅ **Batch Upload** - Process multiple scans at once
- ✅ **Longitudinal Analysis** - Track changes over time
- ✅ **Timeline View** - Visual progression of cardiac health
- ✅ **Comparison Tools** - Side-by-side scan comparison
- ✅ **Change Detection** - Automatic identification of significant changes

### Enterprise Features
- ✅ **Usage Tracking** - Cost and usage monitoring
- ✅ **Rate Limiting** - Prevent abuse (5 scans/minute)
- ✅ **Admin Dashboard** - System monitoring and management
- ✅ **Automatic Cleanup** - Data retention policies (30 days)
- ✅ **Accessibility** - WCAG 2.1 AA compliant

---

## 🔒 Security & Privacy

- **Authentication:** Secure user accounts via Supabase Auth
- **Data Storage:** Encrypted at rest and in transit
- **Access Control:** Row Level Security (RLS) policies
- **Data Retention:** Automatic deletion after 30 days
- **HIPAA Consideration:** Not currently HIPAA compliant (use for research only)

**Important:** PanEcho is designed for educational and research purposes. Always consult with qualified healthcare professionals for medical decisions.

---

## 📖 Frequently Asked Questions

### What file formats are supported?

**DICOM (.dcm)** - The standard medical imaging format. We also support DICOM archives (.zip containing .dcm files).

### How accurate is the AI analysis?

PanEcho uses GPT-4o-mini for image analysis and has been tested with TCIA (The Cancer Imaging Archive) datasets. However:
- ⚠️ **Not FDA approved**
- ⚠️ **Not a medical device**
- ⚠️ **Results should be verified by qualified cardiologists**

**Accuracy depends on:**
- Image quality
- Scan completeness
- Proper patient positioning
- Adequate labeling

### What should I do with my results?

1. **Download the PDF report**
2. **Share with your cardiologist**
3. **Do NOT make medical decisions based solely on PanEcho**
4. **Follow up as recommended**

### How long is my data stored?

- **Scans:** Automatically deleted after **30 days**
- **Reports:** You can download PDFs before deletion
- **Account data:** Retained until you delete your account

You can manually delete scans at any time from your dashboard.

### Is this HIPAA compliant?

**No.** PanEcho is currently not HIPAA compliant. Do not upload:
- Patient identifiable information (PII)
- Real patient data from clinical practice
- Any data subject to HIPAA regulations

**Acceptable use:**
- De-identified research data
- TCIA public datasets
- Educational purposes
- Personal scans (self-consent)

### Can I use this for clinical practice?

**No.** PanEcho is intended for:
- ✅ Educational purposes
- ✅ Research studies
- ✅ Technology demonstration
- ✅ Algorithm development

**Not for:**
- ❌ Clinical diagnosis
- ❌ Treatment decisions
- ❌ Patient care
- ❌ Regulatory submissions

### What if I find an error?

Contact us immediately at **support@panecho.com**

We monitor:
- Error rates
- Processing failures
- User reports
- System performance

### How much does it cost?

**Free tier includes:**
- 50 scans per month
- All features
- PDF downloads
- 30-day data retention

**Usage limits:**
- 5 scans per minute (rate limit)
- 50 MB per file
- 10 files per batch

### Can I integrate PanEcho into my application?

Currently, PanEcho does not offer a public API. Contact us at **support@panecho.com** for enterprise inquiries.

---

## 📞 Support

### Need Help?

- **Email:** support@panecho.com
- **Response Time:** Within 24 hours
- **Status Page:** [status.panecho.com](https://status.panecho.com) *(coming soon)*

### Report a Bug

Email support@panecho.com with:
1. Description of the issue
2. Steps to reproduce
3. Browser and device info
4. Screenshots (if applicable)

We prioritize:
- 🔴 **Critical:** Data loss, security issues (immediate)
- 🟡 **High:** Processing failures, broken features (24h)
- 🟢 **Normal:** UI bugs, enhancement requests (1 week)

---

## 📄 Legal

### Privacy Policy

We collect minimal data:
- Email address (for authentication)
- Uploaded medical images (deleted after 30 days)
- Usage statistics (anonymized)

We do NOT:
- Sell your data
- Share with third parties (except required services: Supabase, OpenAI)
- Use your images for training AI models (without explicit consent)

Full privacy policy: [panecho.com/privacy](https://panecho.com/privacy) *(coming soon)*

### Terms of Service

By using PanEcho, you agree:
- Not to upload HIPAA-protected data
- Not to use for clinical decision-making
- Not to misrepresent AI results as medical diagnoses
- To use responsibly and ethically

Full terms: [panecho.com/terms](https://panecho.com/terms) *(coming soon)*

### Medical Disclaimer

**PanEcho is not a medical device. It is not intended for diagnosis, treatment, cure, or prevention of any disease. Always consult with qualified healthcare professionals.**

---

## 🛠 Technology Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes (serverless)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **Authentication:** Supabase Auth
- **AI:** OpenAI GPT-4o-mini
- **Deployment:** Vercel
- **Monitoring:** Vercel Analytics

---

## 🚀 Deployment

See detailed guides:
- [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md) - Step-by-step deployment
- [PRODUCTION_LAUNCH_CHECKLIST.md](./PRODUCTION_LAUNCH_CHECKLIST.md) - Comprehensive checklist
- [STAGING_DEPLOYMENT_GUIDE.md](./STAGING_DEPLOYMENT_GUIDE.md) - Staging environment

---

## 🤝 Contributing

We welcome contributions! (Guidelines coming soon)

For major changes:
1. Open an issue first
2. Discuss proposed changes
3. Submit pull request

---

## 📜 License

MIT License - See [LICENSE](./LICENSE) for details

---

## 🙏 Acknowledgments

- **TCIA** - The Cancer Imaging Archive (test datasets)
- **OpenAI** - GPT-4o-mini API
- **Supabase** - Backend infrastructure
- **Vercel** - Hosting and deployment

---

**Built with ❤️ for advancing cardiac imaging accessibility**

*Last updated: January 17, 2026*
