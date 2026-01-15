'use client';

import { useEffect, useState } from 'react';

const EDUCATIONAL_CONTENT = [
  {
    id: 1,
    title: 'What is Pancreatic Imaging?',
    description:
      'Modern imaging techniques like CT and MRI allow doctors to visualize the pancreas in detail. These scans help detect abnormalities early and guide treatment decisions.',
  },
  {
    id: 2,
    title: 'The Role of AI in Medical Analysis',
    description:
      'Artificial Intelligence assists radiologists by analyzing medical images with high precision. AI can detect subtle patterns that might be missed by the human eye, improving diagnostic accuracy.',
  },
  {
    id: 3,
    title: 'Understanding Radiomics',
    description:
      'Radiomics extracts detailed quantitative features from medical images. These features capture information about tumor texture, shape, and heterogeneity that are invisible to the naked eye.',
  },
  {
    id: 4,
    title: 'Longitudinal Analysis Benefits',
    description:
      'Comparing scans over time reveals how abnormalities are changing. This longitudinal assessment is crucial for monitoring disease progression and evaluating treatment response.',
  },
  {
    id: 5,
    title: 'Clinical Decision Support',
    description:
      'AI-generated insights provide doctors with evidence-based recommendations. These decision support tools help clinicians make informed choices about patient care and follow-up strategies.',
  },
  {
    id: 6,
    title: 'Patient Privacy & Security',
    description:
      'Your medical data is protected with enterprise-grade security. All scans and analysis results are encrypted and stored securely, with strict access controls.',
  },
];

interface EducationalContentProps {
  autoPlay?: boolean;
  rotationInterval?: number; // milliseconds
}

export function EducationalContent({
  autoPlay = true,
  rotationInterval = 10000,
}: EducationalContentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % EDUCATIONAL_CONTENT.length);
        setIsTransitioning(false);
      }, 300); // Match fade transition duration
    }, rotationInterval);

    return () => clearInterval(timer);
  }, [autoPlay, rotationInterval]);

  const goToSlide = (index: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  const current = EDUCATIONAL_CONTENT[currentIndex];

  return (
    <div className="w-full max-w-2xl">
      {/* Main content card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div
          className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        >
          <h3 className="text-lg font-semibold text-gray-900">{current.title}</h3>
          <p className="mt-3 text-gray-700 leading-relaxed">{current.description}</p>
        </div>

        {/* Navigation dots */}
        <div className="mt-6 flex justify-center gap-2">
          {EDUCATIONAL_CONTENT.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-blue-500'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex ? 'page' : undefined}
            />
          ))}
        </div>

        {/* Slide counter */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <span className="font-semibold">{currentIndex + 1}</span> of{' '}
          <span className="font-semibold">{EDUCATIONAL_CONTENT.length}</span>
        </div>
      </div>

      {/* Info note */}
      <p className="mt-4 text-center text-sm text-gray-600">
        Content rotates every 10 seconds. Click any dot to navigate.
      </p>
    </div>
  );
}
