
import React from 'react';

interface SectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({ id, title, children, className = '' }) => {
  return (
    <section id={id} className={`w-full max-w-5xl mx-auto px-4 py-8 md:py-12 ${className}`}>
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 text-center">{title}</h2>
      {children}
    </section>
  );
};
