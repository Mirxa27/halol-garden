/**
 * Testimonial Card Component
 */

'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

interface TestimonialProps {
  name: string;
  nameAr?: string;
  position: string;
  positionAr?: string;
  company: string;
  companyAr?: string;
  content: string;
  contentAr?: string;
  rating: number;
  image?: string;
  language?: 'en' | 'ar';
}

export function TestimonialCard({ 
  name,
  nameAr,
  position,
  positionAr,
  company,
  companyAr,
  content,
  contentAr,
  rating,
  image,
  language = 'en'
}: TestimonialProps) {
  const displayName = language === 'ar' && nameAr ? nameAr : name;
  const displayPosition = language === 'ar' && positionAr ? positionAr : position;
  const displayCompany = language === 'ar' && companyAr ? companyAr : company;
  const displayContent = language === 'ar' && contentAr ? contentAr : content;

  return (
    <Card className="h-full">
      <CardContent className="p-6 space-y-4">
        {/* Quote Icon */}
        <Quote className="h-8 w-8 text-blue-500 opacity-50" />
        
        {/* Content */}
        <p className="text-gray-600 dark:text-gray-300 italic">
          "{displayContent}"
        </p>
        
        {/* Rating */}
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        
        {/* Author */}
        <div className="flex items-center gap-3 pt-4 border-t">
          {image ? (
            <Image
              src={image}
              alt={displayName}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {displayName}
            </p>
            <p className="text-sm text-gray-500">
              {displayPosition}, {displayCompany}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}