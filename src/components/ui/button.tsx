import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  loading,
  className = '',
  children,
  ...props
}) => {
  return (
    <button
      {...props}
      className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      disabled={props.disabled || loading}
    >
      {loading ? 'Carregando...' : children}
    </button>
  );
};

export default Button; 