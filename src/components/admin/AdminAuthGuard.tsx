'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/app/actions/auth';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

/**
 * Admin Authentication Guard
 * Verifies user has admin access before rendering children
 * Redirects to home if not admin
 */
export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const user = await getUser();
        
        if (!user) {
          // Not authenticated - redirect to login
          router.push('/login');
          return;
        }

        // Check if user is admin
        // For now, we check against a hardcoded list of admin emails
        // In production, this should be in the database
        const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
        const userEmail = user.email || '';
        const isAdminUser = adminEmails.includes(userEmail.trim());

        if (!isAdminUser) {
          // Not admin - redirect to home
          router.push('/dashboard');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Not admin - shouldn't show since we redirect, but just in case
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Admin - render children
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
