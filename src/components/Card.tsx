import React from 'react';

interface CardProps {
  title?: string;
  icon?: React.ReactNode;
  color?: 'accent' | 'secondary' | 'tertiary' | 'quaternary';
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ title, icon, color = 'accent', children, className = '' }: CardProps) => {
  const colorClasses = {
    accent: 'bg-accent',
    secondary: 'bg-secondary',
    tertiary: 'bg-tertiary',
    quaternary: 'bg-quaternary',
  };

  const shadowStyles = {
    accent: { boxShadow: '8px 8px 0px 0px #E2E8F0' },
    secondary: { boxShadow: '8px 8px 0px 0px #F472B6' },
    tertiary: { boxShadow: '8px 8px 0px 0px #FBBF24' },
    quaternary: { boxShadow: '8px 8px 0px 0px #34D399' },
  };

  return (
    <div
      className={`bounce-transition bg-card border-2 border-foreground rounded-xl p-6 relative hover:rotate-[-1deg] hover:scale-[1.02] ${className}`}
      style={shadowStyles[color]}
    >
      {icon && (
        <div
          className={`absolute -top-4 -left-4 w-12 h-12 ${colorClasses[color]} rounded-full border-2 border-foreground flex items-center justify-center text-white`}
        >
          {icon}
        </div>
      )}
      {title && <h3 className="text-xl font-bold mb-4 mt-2">{title}</h3>}
      {children}
    </div>
  );
};
