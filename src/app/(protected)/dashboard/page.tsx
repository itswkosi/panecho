import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#F5F1EA] py-8">
      <div className="max-w-7xl mx-auto px-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-serif text-[#2C2C2C]">Dashboard</h1>
            <p className="text-[#5C5C5C] mt-2">Welcome to Panecho - Your CT scan analysis platform</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-[#D4B5A0]/30">
              <CardHeader>
                <CardTitle className="text-sm text-[#2C2C2C]">Total Scans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#2C2C2C]">0</div>
                <p className="text-xs text-[#5C5C5C] mt-1">CT scans analyzed</p>
              </CardContent>
            </Card>

            <Card className="border-[#D4B5A0]/30">
              <CardHeader>
                <CardTitle className="text-sm text-[#2C2C2C]">Risk Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#2C2C2C]">—</div>
                <p className="text-xs text-[#5C5C5C] mt-1">Latest assessment</p>
              </CardContent>
            </Card>

            <Card className="border-[#D4B5A0]/30">
              <CardHeader>
                <CardTitle className="text-sm text-[#2C2C2C]">Last Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#2C2C2C]">—</div>
                <p className="text-xs text-[#5C5C5C] mt-1">No scans yet</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-[#D4B5A0]/30">
            <CardHeader>
              <CardTitle className="text-[#2C2C2C]">Getting Started</CardTitle>
              <CardDescription className="text-[#5C5C5C]">Next steps to use Panecho</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4B5A0] flex items-center justify-center">
                    <span className="text-sm font-bold text-[#2C2C2C]">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#2C2C2C]">Upload CT Scan</h3>
                    <p className="text-sm text-[#5C5C5C]">
                      Upload your DICOM files or images for analysis
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4B5A0] flex items-center justify-center">
                    <span className="text-sm font-bold text-[#2C2C2C]">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#2C2C2C]">AI Analysis</h3>
                    <p className="text-sm text-[#5C5C5C]">
                      Our AI analyzes your scans for pancreatic anomalies
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4B5A0] flex items-center justify-center">
                    <span className="text-sm font-bold text-[#2C2C2C]">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#2C2C2C]">Track Progress</h3>
                    <p className="text-sm text-[#5C5C5C]">
                      Monitor longitudinal changes and trends over time
                    </p>
                  </div>
                </div>
              </div>
              <Link href="/upload">
                <Button className="w-full mt-4 bg-[#D4B5A0] hover:bg-[#C4A590] text-[#2C2C2C]">Upload Your First Scan</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
