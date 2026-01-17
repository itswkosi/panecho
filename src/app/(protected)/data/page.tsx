'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DeletionConfirmationDialog } from '@/components/shared/DeletionConfirmationDialog';
import {
  deleteScan,
  deleteAllUserScans,
  getRetentionStatus,
  extendScanRetention,
} from '@/app/actions/retention';
import type { RetentionStatus } from '@/lib/retention/manager';

/**
 * Data management page
 * Users can view all their scans with retention status and delete them
 */
export default function DataManagementPage() {
  const router = useRouter();
  const [scans, setScans] = useState<RetentionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deletingScanned, setDeletingScanned] = useState<string | null>(null);
  const [extendingScanned, setExtendingScanned] = useState<string | null>(null);
  const [extendSuccess, setExtendSuccess] = useState<string | null>(null);
  const [deletionDialog, setDeletionDialog] = useState<{
    isOpen: boolean;
    scanId?: string;
    scanDate?: string;
    isAll: boolean;
  }>({
    isOpen: false,
    isAll: false,
  });

  const [isDeleting, setIsDeleting] = useState(false);

  // Load retention status on mount
  useEffect(() => {
    loadRetentionStatus();
  }, []);

  const loadRetentionStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getRetentionStatus();

      if (!response.success) {
        setError(response.error || 'Failed to load retention status');
        return;
      }

      // Parse dates from ISO strings
      const parsedScans = (response.data || []).map((scan: any) => ({
        ...scan,
        scanDate: new Date(scan.scanDate),
        expiresAt: new Date(scan.expiresAt),
      }));

      setScans(parsedScans);
    } catch (err) {
      console.error('Error loading retention status:', err);
      setError('Failed to load your scans');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScan = async (scanId: string) => {
    const scan = scans.find((s) => s.scanId === scanId);
    if (!scan) return;

    setDeletionDialog({
      isOpen: true,
      scanId,
      scanDate: scan.scanDate.toLocaleDateString(),
      isAll: false,
    });
  };

  const handleExtendRetention = async (scanId: string) => {
    try {
      setExtendingScanned(scanId);
      setError(null);
      setExtendSuccess(null);

      const response = await extendScanRetention(scanId);
      if (!response.success) {
        setError(response.error || 'Failed to extend retention');
        return;
      }

      // Update the scan in the list
      setScans(scans.map((scan) => {
        if (scan.scanId === scanId && response.data) {
          const newExpiresAt = new Date(response.data.newExpirationDate);
          const now = new Date();
          const daysRemaining = Math.ceil(
            (newExpiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
          );

          return {
            ...scan,
            expiresAt: newExpiresAt,
            daysRemaining: Math.max(0, daysRemaining),
            extensionCount: scan.extensionCount + 1,
            canExtend: response.data.extensionsRemaining > 0,
          };
        }
        return scan;
      }));

      const targetScan = scans.find(s => s.scanId === scanId);
      if (targetScan && response.data) {
        const newExpiresAt = new Date(response.data.newExpirationDate);
        setExtendSuccess(`Retention extended! New expiration: ${newExpiresAt.toLocaleDateString()}`);
      }
      setTimeout(() => setExtendSuccess(null), 5000);
    } catch (err) {
      console.error('Error extending retention:', err);
      setError('An error occurred while extending retention');
    } finally {
      setExtendingScanned(null);
    }
  };

  const handleDeleteAll = () => {
    setDeletionDialog({
      isOpen: true,
      isAll: true,
    });
  };

  const handleConfirmDeletion = async () => {
    try {
      setIsDeleting(true);

      if (deletionDialog.isAll) {
        const response = await deleteAllUserScans();
        if (!response.success) {
          setError(response.error || 'Failed to delete all scans');
          return;
        }
        setScans([]);
      } else if (deletionDialog.scanId) {
        const response = await deleteScan(deletionDialog.scanId);
        if (!response.success) {
          setError(response.error || 'Failed to delete scan');
          return;
        }
        setScans(scans.filter((s) => s.scanId !== deletionDialog.scanId));
      }

      router.refresh();
    } catch (err) {
      console.error('Error during deletion:', err);
      setError('An error occurred during deletion');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Data Management
          </h1>
          <p className="text-slate-600">
            Manage your scans and data retention settings
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Alert */}
        {extendSuccess && (
          <Card className="border-green-200 bg-green-50 mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800">{extendSuccess}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4" role="status" aria-busy="true" aria-label="Loading your scans">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && scans.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="py-8">
                <p className="text-slate-600 mb-4">
                  You don't have any scans yet.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Your First Scan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scans List */}
        {!loading && scans.length > 0 && (
          <>
            <div className="grid gap-4 mb-6" role="region" aria-label="Your scans">
              {scans.map((scan) => {
                const isExpiring = scan.daysRemaining <= 30;
                return (
                  <Card
                    key={scan.scanId}
                    className={isExpiring ? 'border-amber-200 bg-amber-50' : ''}
                  >
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Scan Info */}
                        <div>
                          <p className="text-sm text-slate-600 mb-1">
                            Scan Date
                          </p>
                          <p className="font-medium text-slate-900">
                            {scan.scanDate.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>

                        {/* Retention Status */}
                        <div>
                          <p className="text-sm text-slate-600 mb-1">
                            Retention Status
                          </p>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                scan.daysRemaining <= 10
                                  ? 'bg-red-100 text-red-800'
                                  : scan.daysRemaining <= 30
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {scan.daysRemaining} days remaining
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Expires{' '}
                            {scan.expiresAt.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        {/* Extensions Info */}
                        <div>
                          <p className="text-sm text-slate-600 mb-1">
                            Extensions Used
                          </p>
                          <p className="font-medium text-slate-900">
                            {scan.extensionCount}/3
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {scan.canExtend
                              ? `${3 - scan.extensionCount} extension${3 - scan.extensionCount !== 1 ? 's' : ''} remaining`
                              : 'No more extensions available'}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 justify-end items-center">
                          {scan.canExtend && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-300 hover:bg-blue-50"
                              onClick={() => handleExtendRetention(scan.scanId)}
                              disabled={extendingScanned === scan.scanId}
                              aria-label={`Extend retention for scan from ${scan.scanDate.toLocaleDateString()}`}
                            >
                              {extendingScanned === scan.scanId ? 'Extending...' : 'Extend (+90d)'}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteScan(scan.scanId)}
                            disabled={isDeleting}
                            aria-label={`Delete scan from ${scan.scanDate.toLocaleDateString()}`}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Delete All Section */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-800 mb-4">
                  Permanently delete all your scans and data. This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAll}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All My Data
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Deletion Confirmation Dialog */}
      <DeletionConfirmationDialog
        isOpen={deletionDialog.isOpen}
        onOpenChange={(open) =>
          setDeletionDialog({ ...deletionDialog, isOpen: open })
        }
        onConfirm={handleConfirmDeletion}
        isLoading={isDeleting}
        isDeletingAll={deletionDialog.isAll}
        itemDate={deletionDialog.scanDate}
      />
    </div>
  );
}
