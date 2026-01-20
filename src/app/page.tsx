import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { getUser } from "@/app/actions/auth";
import { ArrowRight, Upload, Settings, Activity, Database, Sparkles } from "lucide-react";

export default async function HomePage() {
  const user = await getUser();

  return (
    <>
      <Header user={user} />
      <div className="min-h-screen bg-[#F5F1EA]">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-6xl font-serif text-[#2C2C2C] mb-6 leading-tight">
                Welcome to Panecho
              </h1>
              <p className="text-xl text-[#2C2C2C] mb-6 font-light">
                Longitudinal CT radiomics for early pancreatic cancer detection.
              </p>
              <p className="text-base text-[#5C5C5C] mb-8 leading-relaxed">
                Turning subtle CT patterns into early signals of pancreatic disease.
              </p>
              <Link href={user ? "/upload" : "/signup"}>
                <Button 
                  className="bg-[#D4B5A0] hover:bg-[#C4A590] text-[#2C2C2C] rounded-none px-6 py-5 text-base"
                >
                  Explore the pipeline <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="bg-[#E5DDD5] rounded-lg p-8 shadow-lg">
                <div className="aspect-square bg-gradient-to-br from-[#D4B5A0]/30 to-[#E5DDD5] rounded-lg flex items-center justify-center">
                  <div className="text-center text-[#8C8C8C]">
                    <Activity className="h-24 w-24 mx-auto mb-4 stroke-[#D4B5A0]" />
                    <p className="text-sm">CT Scan Analysis Visualization</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Research Section */}
        <div className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-8">
            <p className="text-center text-lg text-[#2C2C2C] leading-relaxed max-w-4xl mx-auto">
              <span className="font-medium">Researching radiomics-based methods to detect patterns</span>{" "}
              in routine CT scans that may signal early pancreatic cancer progression.
            </p>
          </div>
        </div>

        {/* About Section */}
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl font-serif text-[#2C2C2C] mb-8">
                About Panecho
              </h2>
              <p className="text-base text-[#2C2C2C] mb-6 leading-relaxed">
                Pancreatic ductal adenocarcinoma (PDAC) is one of the deadliest cancers due to late detection.
              </p>
              <p className="text-base text-[#2C2C2C] leading-relaxed">
                Panecho uses advanced <span className="font-medium">radiomic</span> analysis of routine CT scans 
                to explore subtle, longitudinal patterns that may signal{" "}
                <span className="font-medium">pancreatic cancer progression</span>, potentially before conventional diagnosis.
              </p>
            </div>
            <div className="relative">
              <div className="bg-[#E5DDD5] rounded-lg p-8 shadow-lg">
                <div className="aspect-square bg-gradient-to-br from-[#D4B5A0]/30 to-[#E5DDD5] rounded-lg flex items-center justify-center">
                  <div className="text-center text-[#8C8C8C]">
                    <Database className="h-24 w-24 mx-auto mb-4 stroke-[#D4B5A0]" />
                    <p className="text-sm">Radiomics Analysis</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-serif text-[#2C2C2C] mb-4">
                How Panecho Works
              </h2>
              <p className="text-lg text-[#5C5C5C]">
                From CT scan to longitudinal analysis
              </p>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-6 mb-12">
              {[
                { num: 1, icon: Upload, label: "Upload\nCT scans" },
                { num: 2, icon: Settings, label: "Preprocess" },
                { num: 3, icon: Activity, label: "Segment" },
                { num: 4, icon: Database, label: "Extract\nfeatures" },
                { num: 5, icon: Sparkles, label: "Classify" }
              ].map((step, idx) => (
                <div key={step.num} className="flex items-center">
                  <div className="text-center">
                    <div className="bg-[#D4B5A0] text-white rounded-full w-12 h-12 flex items-center justify-center mb-3 mx-auto text-lg font-semibold">
                      {step.num}
                    </div>
                    <step.icon className="h-12 w-12 mx-auto mb-3 stroke-[#8C8C8C]" />
                    <p className="text-sm text-[#2C2C2C] whitespace-pre-line">
                      {step.label}
                    </p>
                  </div>
                  {idx < 4 && (
                    <ArrowRight className="h-6 w-6 mx-4 stroke-[#C4C4C4]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Try It Section */}
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="bg-[#E5DDD5] rounded-lg p-12 flex flex-col items-center justify-center">
              <h2 className="text-4xl font-serif text-[#2C2C2C] mb-8 text-center">
                Upload & Analyze
              </h2>
              <Link href={user ? "/upload" : "/signup"}>
                <Button 
                  className="bg-[#D4B5A0] hover:bg-[#C4A590] text-[#2C2C2C] rounded-none px-8 py-6 text-lg"
                >
                  Upload & Analyze
                </Button>
              </Link>
            </div>
            <div>
              <h2 className="text-4xl font-serif text-[#2C2C2C] mb-8">
                Try Panecho for Yourself
              </h2>
              <div className="bg-white rounded-lg p-8 shadow-lg border border-[#D4B5A0]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-serif text-[#2C2C2C]">Results</h3>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#D4B5A0]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#E5DDD5]"></div>
                  </div>
                </div>
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-[#5C5C5C] mb-3">
                    Risk Probability Over Time
                  </h4>
                  <div className="h-32 bg-gradient-to-r from-[#FFE5D9] to-[#FFA07A] rounded-lg relative">
                    <div className="absolute inset-0 flex items-center px-4">
                      <div className="w-full h-0.5 bg-[#D4B5A0]"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#7B8FA1] flex items-center justify-center">
                      <Sparkles className="h-4 w-4 stroke-white" />
                    </div>
                    <span className="text-sm text-[#5C5C5C]">AI Assessment</span>
                  </div>
                  <div className="bg-[#F5F1EA] rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#FFB380] flex-shrink-0"></div>
                      <div>
                        <h5 className="font-semibold text-[#2C2C2C] mb-2">
                          PDAC Signal Detected
                        </h5>
                        <p className="text-xs text-[#5C5C5C] mb-2">
                          High-signal densities near centerlines
                        </p>
                        <ul className="text-xs text-[#5C5C5C] space-y-1">
                          <li>• NGTDM Contrast: 45.1</li>
                          <li>• GURLM Run Entropy: 5.7</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-[#E5DDD5] py-8">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-8 mb-4 md:mb-0">
                <h3 className="text-2xl font-serif text-[#2C2C2C]">Panecho</h3>
                <nav className="flex gap-6 text-sm text-[#5C5C5C]">
                  <Link href="/" className="hover:text-[#2C2C2C]">Home</Link>
                  <Link href="#about" className="hover:text-[#2C2C2C]">About</Link>
                  <Link href="#pipeline" className="hover:text-[#2C2C2C]">Pipeline</Link>
                  <Link href={user ? "/upload" : "/signup"} className="hover:text-[#2C2C2C]">Demo</Link>
                  {user && <Link href="/dashboard" className="hover:text-[#2C2C2C]">Blog</Link>}
                  {!user && <Link href="/signup" className="hover:text-[#2C2C2C]">Subscribe</Link>}
                </nav>
              </div>
              <p className="text-xs text-[#8C8C8C]">
                © 2024 Panecho Project. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
