'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { DetailedFindings } from '@/lib/types/database';

interface TieredDisclosureProps {
  detailedFindings: DetailedFindings;
}

/**
 * Tiered disclosure component
 * Three levels of detail with smooth expand/collapse
 */
export function TieredDisclosure({ detailedFindings }: TieredDisclosureProps) {
  const {
    pancreatic_observations = [],
    risk_factors_identified = [],
    recommendations = [],
    confidence_metrics = {},
  } = detailedFindings;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Click sections below to explore more details about the analysis:</p>

      <Accordion type="single" collapsible className="w-full">
        {/* Detailed Findings */}
        <AccordionItem value="detailed-findings" className="border rounded-lg">
          <AccordionTrigger className="hover:no-underline px-4 py-3 bg-slate-50 hover:bg-slate-100">
            <span className="font-semibold text-slate-900">📋 Show Detailed Findings</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 py-3 bg-white space-y-4">
            {/* Pancreatic Observations */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Imaging Observations:</h4>
              {pancreatic_observations.length > 0 ? (
                <ul className="space-y-1 text-sm text-slate-700">
                  {pancreatic_observations.map((obs, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-slate-400">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600 italic">No specific observations noted.</p>
              )}
            </div>

            {/* Risk Factors */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Risk Factors Identified:</h4>
              {risk_factors_identified && risk_factors_identified.length > 0 ? (
                <ul className="space-y-1 text-sm text-slate-700">
                  {risk_factors_identified.map((factor, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-amber-500">⚠</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600 italic">No specific risk factors identified.</p>
              )}
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Clinical Recommendations:</h4>
              {recommendations && recommendations.length > 0 ? (
                <ul className="space-y-1 text-sm text-slate-700">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-blue-500">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600 italic">No specific recommendations at this time.</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Technical Analysis */}
        <AccordionItem value="technical-analysis" className="border rounded-lg">
          <AccordionTrigger className="hover:no-underline px-4 py-3 bg-slate-50 hover:bg-slate-100">
            <span className="font-semibold text-slate-900">🔬 Show Technical Analysis</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 py-3 bg-white space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Analysis Metrics:</h4>
              {confidence_metrics && Object.keys(confidence_metrics).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(confidence_metrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-slate-700 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="font-semibold text-slate-900">
                        {typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600 italic">No technical metrics available.</p>
              )}
            </div>

            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-900">
                <strong>Note:</strong> This analysis was performed using advanced AI vision analysis of the CT images. 
                All findings have been processed with a focus on accuracy and clinical relevance.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Educational Section */}
        <AccordionItem value="education" className="border rounded-lg">
          <AccordionTrigger className="hover:no-underline px-4 py-3 bg-slate-50 hover:bg-slate-100">
            <span className="font-semibold text-slate-900">📚 What Do These Findings Mean?</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 py-3 bg-white space-y-3 text-sm text-slate-700">
            <div>
              <h5 className="font-semibold text-slate-900 mb-1">About Pancreatic CT Analysis:</h5>
              <p>
                CT imaging is a primary tool for evaluating the pancreas. This analysis examines the pancreatic 
                tissue appearance, ductal system, vasculature, and surrounding structures to identify any abnormalities 
                that might suggest benign or malignant disease.
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-slate-900 mb-1">Risk Score Interpretation:</h5>
              <ul className="space-y-1 ml-4">
                <li>• <strong>0-29%:</strong> Imaging appears normal with low concern for malignancy</li>
                <li>• <strong>30-49%:</strong> Borderline findings that warrant clinical correlation</li>
                <li>• <strong>50-100%:</strong> Suspicious features that require urgent clinical evaluation</li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold text-slate-900 mb-1">Next Steps:</h5>
              <p>
                These results should be reviewed with a radiologist and your healthcare provider. Depending on the 
                findings, additional imaging, laboratory tests, or specialist consultation may be recommended.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
