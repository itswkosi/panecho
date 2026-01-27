'use server';
import { getScan, getAnalysis } from '@/lib/supabase/db';
export async function getResultsData(scanId: string) {
  const scan = await getScan(scanId);
  const analysis = await getAnalysis(scanId);
  return { success: !!analysis, data: { scan, analysis }, error: !analysis ? 'Not found' : undefined };
}
