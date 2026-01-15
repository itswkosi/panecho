'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ZoomIn, ZoomOut } from 'lucide-react';
import Image from 'next/image';

interface ComparisonViewProps {
  currentSlices: Array<{
    url: string;
    sliceNumber?: number;
  }>;
  previousSlices: Array<{
    url: string;
    sliceNumber?: number;
  }>;
  currentDate: Date;
  previousDate: Date;
}

/**
 * Side-by-side comparison of scan slices
 * Allows zooming and scrolling through multiple slices
 */
export function ComparisonView({
  currentSlices,
  previousSlices,
  currentDate,
  previousDate,
}: ComparisonViewProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentSliceIndex, setCurrentSliceIndex] = useState(0);

  if (!currentSlices || currentSlices.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">No comparison slices available</p>
      </div>
    );
  }

  const maxSlices = Math.max(currentSlices.length, previousSlices.length);
  const currentSlice = currentSlices[currentSliceIndex];
  const previousSlice = previousSlices[currentSliceIndex] || null;

  const handleZoom = (delta: number) => {
    setZoomLevel(Math.max(50, Math.min(200, zoomLevel + delta)));
  };

  return (
    <div className="space-y-4">
      {/* Zoom Controls */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleZoom(-10)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-12">{zoomLevel}%</span>
          <button
            onClick={() => handleZoom(10)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Slice Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSliceIndex(Math.max(0, currentSliceIndex - 1))}
            disabled={currentSliceIndex === 0}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronUp className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm text-gray-600 min-w-16 text-center">
            {currentSliceIndex + 1} / {maxSlices}
          </span>
          <button
            onClick={() => setCurrentSliceIndex(Math.min(maxSlices - 1, currentSliceIndex + 1))}
            disabled={currentSliceIndex === maxSlices - 1}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Image Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Scan */}
        <div className="bg-black rounded-lg overflow-hidden border border-gray-200">
          <div className="bg-gray-900 aspect-square flex items-center justify-center overflow-auto">
            {currentSlice && (
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'center',
                }}
                className="transition-transform"
              >
                <Image
                  src={currentSlice.url}
                  alt={`Current scan slice ${currentSliceIndex + 1}`}
                  width={512}
                  height={512}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
            )}
          </div>
          <div className="bg-white p-3 text-center border-t border-gray-200">
            <p className="text-sm font-medium text-gray-900">
              {new Date(currentDate).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-600">Current Scan</p>
          </div>
        </div>

        {/* Previous Scan */}
        <div className="bg-black rounded-lg overflow-hidden border border-gray-200">
          <div className="bg-gray-900 aspect-square flex items-center justify-center overflow-auto">
            {previousSlice ? (
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'center',
                }}
                className="transition-transform"
              >
                <Image
                  src={previousSlice.url}
                  alt={`Previous scan slice ${currentSliceIndex + 1}`}
                  width={512}
                  height={512}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
            ) : (
              <p className="text-gray-600">No previous slice at this index</p>
            )}
          </div>
          <div className="bg-white p-3 text-center border-t border-gray-200">
            <p className="text-sm font-medium text-gray-900">
              {new Date(previousDate).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-600">Previous Scan</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <p className="text-xs text-gray-600 text-center">
        Use zoom controls to inspect details. Navigate slices with up/down arrows.
      </p>
    </div>
  );
}
