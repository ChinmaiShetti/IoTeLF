import React from 'react';

interface CardProps {
  title?: string;
  icon?: React.ReactNode;
  color?: 'accent' | 'secondary' | 'tertiary' | 'quaternary';
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ title, icon, color = 'accent', children, className = '' }: CardProps) => {
  const accentMap: Record<CardProps['color'] & string, string> = {
    accent: '#8B5CF6',
    secondary: '#F472B6',
    tertiary: '#FBBF24',
    quaternary: '#34D399',
  };

  const shadowMap: Record<CardProps['color'] & string, string> = {
    accent: 'var(--shadow-accent)',
    secondary: 'var(--shadow-secondary)',
    tertiary: 'var(--shadow-tertiary)',
    quaternary: 'var(--shadow-quaternary)',
  };

  return (
    <div
      className={`bounce-transition relative ${className}`}
      style={{
        backgroundColor: 'rgb(var(--color-card))',
        border: '2px solid rgb(var(--color-foreground))',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: shadowMap[color],
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'rotate(-1deg) scale(1.02)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
      }}
    >
      {icon && (
        <div
          style={{
            position: 'absolute',
            top: '-16px',
            left: '-16px',
            width: '48px',
            height: '48px',
            backgroundColor: accentMap[color],
            borderRadius: '9999px',
            border: '2px solid rgb(var(--color-foreground))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          {icon}
        </div>
      )}
      {title && (
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px', marginTop: '8px' }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};
