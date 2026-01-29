"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Linkedin, Github, BookOpen, Upload } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-[#D4B5A0]/30 bg-[#F5F1EA]">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="PanEcho" 
              width={50} 
              height={50}
              className="rounded-lg hover:opacity-80 transition-opacity"
            />
          </Link>

          <div className="flex items-center gap-6">
            {/* Navigation Links */}
            <nav className="flex items-center gap-4">
              <Link href="/upload">
                <Button variant="ghost" className="flex items-center gap-2 hover:bg-[#E5DDD5]">
                  <Upload className="h-4 w-4" />
                  Upload Scan
                </Button>
              </Link>
            </nav>

            {/* Social Links */}
            <div className="flex items-center gap-4 border-l border-[#D4B5A0]/30 pl-6">
              <a 
                href="https://www.linkedin.com/in/semilogo-oketola/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#5C5C5C] hover:text-[#2C2C2C] transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="https://github.com/itswkosi" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#5C5C5C] hover:text-[#2C2C2C] transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="https://medium.com/@semilogooketola" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#5C5C5C] hover:text-[#2C2C2C] transition-colors"
              >
                <BookOpen className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
