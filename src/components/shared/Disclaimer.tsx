import React from 'react';

/**
 * Medical disclaimer component
 * Always visible, not dismissible
 * Displayed prominently in results
 */
export function Disclaimer() {
  return (
    <div className="mb-6 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">⚠️ Important Medical Disclaimer</p>
      <p className="mt-2">
        This AI analysis is intended to assist radiologists and healthcare providers in their clinical decision-making 
        and is not a substitute for professional medical judgment. The risk assessment provided is based on imaging 
        analysis alone and should be interpreted in the context of the patient's complete medical history, clinical 
        presentation, and physical examination.
      </p>
      <p className="mt-2">
        All results require confirmation by a qualified radiologist or clinician. Do not make medical decisions 
        based solely on this report. In case of uncertainty or concerning findings, immediate consultation with a 
        healthcare provider is recommended.
      </p>
      <p className="mt-2">
        This tool is not intended for diagnostic purposes and does not replace medical professional expertise or 
        clinical judgment.
      </p>
    </div>
  );
}
