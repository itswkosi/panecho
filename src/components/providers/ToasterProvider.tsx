'use client';

import { Toaster } from 'sonner';

/**
 * Global toast notification provider
 * Should be placed in root layout
 */
export function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      theme="light"
      expand={true}
      visibleToasts={3}
    />
  );
}
