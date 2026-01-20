import Link from "next/link";
import Image from "next/image";
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
        {/* Hero + About Merged Section */}
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center mb-12">
            <div>
              <h1 className="text-5xl font-serif text-[#2C2C2C] mb-4 leading-tight">
                Welcome to Panecho
              </h1>
              <p className="text-lg text-[#2C2C2C] mb-4 font-light">
                Longitudinal CT radiomics for early pancreatic cancer detection.
              </p>
              <p className="text-base text-[#5C5C5C] mb-6 leading-relaxed">
                Turning subtle CT patterns into early signals of pancreatic disease.
              </p>
              <p className="text-base text-[#2C2C2C] mb-4 leading-relaxed">
                Pancreatic ductal adenocarcinoma (PDAC) is one of the deadliest cancers due to late detection. 
                Panecho uses advanced <span className="font-medium">radiomic</span> analysis of routine CT scans 
                to explore subtle, longitudinal patterns that may signal{" "}
                <span className="font-medium">pancreatic cancer progression</span>, potentially before conventional diagnosis.
              </p>
              <Link href={user ? "/upload" : "/signup"}>
                <Button 
                  className="bg-[#D4B5A0] hover:bg-[#C4A590] text-[#2C2C2C] rounded-none px-6 py-4 text-base"
                >
                  Explore the pipeline <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="rounded-lg overflow-hidden shadow-lg">
                <Image 
                  src="/Untitled design.png" 
                  alt="Pancreatic CT Scan Analysis" 
                  width={600} 
                  height={600}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Research Callout */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <p className="text-center text-base text-[#2C2C2C] leading-relaxed">
              <span className="font-medium">Researching radiomics-based methods to detect patterns</span>{" "}
              in routine CT scans that may signal early pancreatic cancer progression.
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-serif text-[#2C2C2C] mb-2">
                How Panecho Works
              </h2>
              <p className="text-base text-[#5C5C5C]">
                From CT scan to longitudinal analysis
              </p>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-4">
              {[
                { num: 1, icon: Upload, label: "Upload\nCT scans" },
                { num: 2, icon: Settings, label: "Preprocess" },
                { num: 3, icon: Activity, label: "Segment" },
                { num: 4, icon: Database, label: "Extract\nfeatures" },
                { num: 5, icon: Sparkles, label: "Classify" }
              ].map((step, idx) => (
                <div key={step.num} className="flex items-center">
                  <div className="text-center">
                    <div className="bg-[#D4B5A0] text-white rounded-full w-10 h-10 flex items-center justify-center mb-2 mx-auto text-base font-semibold">
                      {step.num}
                    </div>
                    <step.icon className="h-10 w-10 mx-auto mb-2 stroke-[#8C8C8C]" />
                    <p className="text-xs text-[#2C2C2C] whitespace-pre-line">
                      {step.label}
                    </p>
                  </div>
                  {idx < 4 && (
                    <ArrowRight className="h-5 w-5 mx-3 stroke-[#C4C4C4]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Try It Section */}
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-10">
            <div className="bg-[#E5DDD5] rounded-lg p-10 flex flex-col items-center justify-center">
              <h2 className="text-3xl font-serif text-[#2C2C2C] mb-6 text-center">
                Upload & Analyze
              </h2>
              <Link href={user ? "/upload" : "/signup"}>
                <Button 
                  className="bg-[#D4B5A0] hover:bg-[#C4A590] text-[#2C2C2C] rounded-none px-8 py-4 text-base"
                >
                  Upload & Analyze
                </Button>
              </Link>
            </div>
            <div>
              <h2 className="text-3xl font-serif text-[#2C2C2C] mb-6">
                Try Panecho for Yourself
              </h2>
              <div className="bg-white rounded-lg p-6 shadow-lg border border-[#D4B5A0]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-serif text-[#2C2C2C]">Results</h3>
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#D4B5A0]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E5DDD5]"></div>
                  </div>
                </div>
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-[#5C5C5C] mb-2">
                    Risk Probability Over Time
                  </h4>
                  <div className="h-24 bg-gradient-to-r from-[#FFE5D9] to-[#FFA07A] rounded-lg relative">
                    <div className="absolute inset-0 flex items-center px-3">
                      <div className="w-full h-0.5 bg-[#D4B5A0]"></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#7B8FA1] flex items-center justify-center">
                      <Sparkles className="h-3 w-3 stroke-white" />
                    </div>
                    <span className="text-xs text-[#5C5C5C]">AI Assessment</span>
                  </div>
                  <div className="bg-[#F5F1EA] rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <div className="w-10 h-10 rounded-lg bg-[#FFB380] flex-shrink-0"></div>
                      <div>
                        <h5 className="font-semibold text-[#2C2C2C] mb-1 text-sm">
                          PDAC Signal Detected
                        </h5>
                        <p className="text-xs text-[#5C5C5C] mb-1">
                          High-signal densities near centerlines
                        </p>
                        <ul className="text-xs text-[#5C5C5C] space-y-0.5">
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
      </div>
    </>
  );
}
