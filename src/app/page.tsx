import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { getUser } from "@/app/actions/auth";

export default async function HomePage() {
  const user = await getUser();

  return (
    <>
      <Header user={user} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-20 text-center">
            <h1 className="text-5xl font-bold text-slate-900 mb-6">
              PanEcho
            </h1>
            <p className="text-xl text-slate-600 mb-4">
              AI-Powered Pancreatic Cancer Screening
            </p>
            <p className="text-slate-500 max-w-2xl mx-auto mb-8">
              Utilizing advanced CT scan analysis and artificial intelligence to identify pancreatic anomalies
              early, enabling timely intervention and improved patient outcomes.
            </p>

            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex gap-4 justify-center">
                <Link href="/login">
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Advanced Scanning
              </h3>
              <p className="text-slate-600">
                High-resolution CT scan analysis with AI-powered image recognition
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Risk Stratification
              </h3>
              <p className="text-slate-600">
                Personalized risk scores based on imaging findings and clinical data
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-xl">📈</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Longitudinal Tracking
              </h3>
              <p className="text-slate-600">
                Monitor changes over time with comprehensive historical comparison
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
