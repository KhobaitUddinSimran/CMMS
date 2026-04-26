import { Loader2 } from 'lucide-react';
import type { ButtonVariant, ButtonSize } from '../../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[#C90031] text-white hover:bg-[#A50028] active:bg-[#87001F]',
  secondary: 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-[#F3F4F6] active:bg-[#E5E7EB]',
  danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626] active:bg-[#B91C1C]',
  icon: 'bg-transparent hover:bg-[#F3F4F6] active:bg-[#E5E7EB]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[12px]',
  md: 'h-10 px-4 text-[14px]',
  lg: 'h-12 px-6 text-[16px]',
};

export function Button({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#C90031]/40
        ${variantClasses[variant]} ${sizeClasses[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {(!loading || variant !== 'icon') && <span className={loading ? 'opacity-0' : ''}>{children}</span>}
    </button>
  );
}