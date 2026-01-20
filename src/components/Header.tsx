"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { signOut } from "@/app/actions/auth";

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
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="Panecho Logo" 
              width={40} 
              height={40}
              className="rounded-lg"
            />
            <span className="font-serif text-2xl text-[#2C2C2C]">Panecho</span>
          </Link>

          <div className="flex items-center gap-6">{user ? (
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
