import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export const Button = ({ variant = 'primary', children, ...props }: ButtonProps) => {
  if (variant === 'primary') {
    return (
      <button
        {...props}
        className="bounce-transition flex items-center gap-2 rounded-full bg-accent text-white font-bold px-8 py-3 border-2 border-foreground pop-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] pop-shadow-hover active:translate-x-[2px] active:translate-y-[2px] pop-shadow-active"
      >
        {children}
        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
          <ArrowRight className="w-4 h-4 text-accent" strokeWidth={2.5} />
        </div>
      </button>
    );
  }

  return (
    <button
      {...props}
      className="bounce-transition flex items-center gap-2 rounded-full bg-transparent text-foreground font-bold px-8 py-3 border-2 border-foreground hover:bg-tertiary"
    >
      {children}
    </button>
  );
};
