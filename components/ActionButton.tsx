import React from 'react';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

const ActionButton: React.FC<ActionButtonProps> = ({ children, variant = 'primary', ...props }) => {
  const baseClasses = "px-4 py-2 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-[var(--color-primary-btn-bg)] text-[var(--color-primary-btn-text)] hover:opacity-90 focus:ring-[var(--color-primary-btn-bg)]",
    secondary: "bg-[var(--color-secondary-btn-bg)] text-[var(--color-secondary-btn-text)] hover:opacity-90 focus:ring-gray-400"
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      {children}
    </button>
  );
};

export default ActionButton;
