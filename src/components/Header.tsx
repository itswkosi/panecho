"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { signOut } from "@/app/actions/auth";
import { Linkedin, Github, BookOpen } from "lucide-react";

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface HeaderProps {
  user?: User | null;
}

export function Header({ user }: HeaderProps) {
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    setOpen(false);
  }

  return (
    <header className="border-b border-[#D4B5A0]/30 bg-[#F5F1EA]">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="Panecho Logo" 
              width={60} 
              height={60}
              className="rounded-lg"
            />
          </Link>

          <div className="flex items-center gap-6">
            {/* Social Links */}
            <div className="flex items-center gap-4">
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

            {user ? (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-[#E5DDD5]">
                    <div className="w-8 h-8 rounded-full bg-[#D4B5A0] flex items-center justify-center">
                      <span className="text-sm font-medium text-[#2C2C2C]">
                        {user.user_metadata?.full_name?.[0]?.toUpperCase() ||
                          user.email?.[0]?.toUpperCase() ||
                          "U"}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-[#2C2C2C]">
                      {user.user_metadata?.full_name || user.email}
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <p className="text-sm font-medium text-slate-900">Account</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                    <Button onClick={handleSignOut} variant="destructive" className="w-full">
                      Sign Out
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <div className="flex gap-2">
                <Link href="/login">
                  <Button variant="outline" className="border-[#D4B5A0] text-[#2C2C2C] hover:bg-[#E5DDD5]">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-[#D4B5A0] hover:bg-[#C4A590] text-[#2C2C2C]">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
