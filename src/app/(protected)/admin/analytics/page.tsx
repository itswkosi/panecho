import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { getAnalyticsMetrics } from '@/lib/admin/dashboard';

/**
 * Admin Analytics Dashboard Page
 * Displays real-time system metrics and performance data
 * Admin-only access required
 * 
 * @note This page requires dynamic rendering because it uses cookies() for authentication
 */
export const dynamic = 'force-dynamic';
export default async function AdminAnalyticsPage() {
  let metrics = null;
  let error = null;

  try {
    metrics = await getAnalyticsMetrics();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load metrics';
    console.error('Error loading analytics metrics:', err);
  }

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Dashboard</h2>
              <p className="text-red-700">{error}</p>
              <p className="text-sm text-red-600 mt-2">
                Please check that you have valid data in the database and try refreshing the page.
              </p>
            </div>
          ) : metrics ? (
            <AnalyticsDashboard metrics={metrics} />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <p className="text-yellow-800">Loading metrics...</p>
            </div>
          )}
        </div>
      </div>
    </AdminAuthGuard>
  );
}

export const metadata = {
  title: 'Admin Analytics Dashboard - PanEcho',
  description: 'Real-time system metrics and performance data',
};
