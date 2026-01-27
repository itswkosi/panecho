'use client';

import { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';

interface SegmentedPancreasVisualizationProps {
  imageUrl: string;
  sliceUrls?: string[];
  scanId: string;
}

export function SegmentedPancreasVisualization({ 
  imageUrl, 
  sliceUrls = [], 
  scanId 
}: SegmentedPancreasVisualizationProps) {
  const [zoom, setZoom] = useState(1);
  const [currentSliceIndex, setCurrentSliceIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const allSlices = sliceUrls.length > 0 ? sliceUrls : [imageUrl];
  const currentImage = allSlices[currentSliceIndex];

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => { setZoom(1); setPosition({ x: 0, y: 0 }); };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoom > 1) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleSliceChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentSliceIndex > 0) {
      setCurrentSliceIndex(prev => prev - 1);
    } else if (direction === 'next' && currentSliceIndex < allSlices.length - 1) {
      setCurrentSliceIndex(prev => prev + 1);
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm ${isFullscreen ? 'fixed inset-0 z-50 p-8' : 'p-8'}`}
      ref={containerRef}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-serif" style={{ color: '#2C2520', fontWeight: 400 }}>Scan Visualization</h3>
        <div className="flex items-center gap-2">
          <button onClick={handleZoomOut} disabled={zoom <= 0.5}
            className="p-2 rounded transition-colors" 
            style={{ 
              backgroundColor: zoom <= 0.5 ? '#F5F1EA' : 'white',
              color: zoom <= 0.5 ? '#C4B5A0' : '#6B5E52',
              opacity: zoom <= 0.5 ? 0.5 : 1,
              cursor: zoom <= 0.5 ? 'not-allowed' : 'pointer'
            }} 
            title="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm min-w-[4rem] text-center" style={{ color: '#6B5E52' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} disabled={zoom >= 3}
            className="p-2 rounded transition-colors" 
            style={{ 
              backgroundColor: zoom >= 3 ? '#F5F1EA' : 'white',
              color: zoom >= 3 ? '#C4B5A0' : '#6B5E52',
              opacity: zoom >= 3 ? 0.5 : 1,
              cursor: zoom >= 3 ? 'not-allowed' : 'pointer'
            }}
            title="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded transition-colors ml-2" 
            style={{ color: '#6B5E52' }}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div 
        className={`relative bg-slate-900 rounded-lg overflow-hidden ${
          isFullscreen ? 'h-[calc(100vh-12rem)]' : 'h-96'
        } ${zoom > 1 ? 'cursor-move' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
          <img src={currentImage} alt="CT scan slice" className="select-none"
            style={{
              transform: `scale(${zoom})`,
              transition: isPanning ? 'none' : 'transform 0.2s ease-out',
              maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
            }}
            draggable={false}
          />
        </div>

        {allSlices.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-3">
            <button onClick={() => handleSliceChange('prev')} disabled={currentSliceIndex === 0}
              className="text-white hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              ←
            </button>
            <span className="text-white text-sm">Slice {currentSliceIndex + 1} / {allSlices.length}</span>
            <button onClick={() => handleSliceChange('next')} disabled={currentSliceIndex === allSlices.length - 1}
              className="text-white hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              →
            </button>
          </div>
        )}

        {(zoom !== 1 || position.x !== 0 || position.y !== 0) && (
          <button onClick={handleReset}
            className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded text-sm hover:bg-black/80 transition-colors">
            Reset View
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500 mt-3 text-center">
        {allSlices.length > 1 
          ? `Segmented pancreas visualization - ${allSlices.length} slices available. Use arrows to navigate.`
          : 'Segmented pancreas illustrating radiomic analysis heatmap.'}
      </p>

      {zoom > 1 && (
        <p className="text-xs text-blue-600 mt-2 text-center">💡 Click and drag to pan the image</p>
      )}
    </div>
  );
}