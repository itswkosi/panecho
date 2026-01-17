'use client';

/**
 * Footer Component
 * Displays privacy policy link and analytics information
 */
export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} PanEcho. All rights reserved.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a
              href="https://example.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 underline"
            >
              Privacy Policy
            </a>
            <a
              href="https://example.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 underline"
            >
              Terms of Service
            </a>
            <a
              href="https://example.com/contact"
              className="text-gray-600 hover:text-gray-900 underline"
            >
              Contact Us
            </a>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>
              Analytics: We respect your privacy and use privacy-compliant analytics.
              <br />
              <a
                href="https://vercel.com/analytics"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Learn more about our analytics
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
