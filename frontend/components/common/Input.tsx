import { useState } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
  isPassword?: boolean;
}

export function Input({ label, error, success, icon, isPassword, className = '', type, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-[12px] text-[#111827]">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">{icon}</div>}
        <input
          type={inputType}
          className={`w-full h-10 border rounded-lg px-3 text-[14px] placeholder-[#9CA3AF] transition-colors outline-none
            ${icon ? 'pl-10' : ''}
            ${isPassword ? 'pr-10' : ''}
            ${error ? 'border-[#EF4444] focus:border-[#EF4444]' : 'border-[#E5E7EB] focus:border-[#C90031] focus:border-2 focus:bg-[#F9FAFB]'}
            ${props.disabled ? 'bg-[#F3F4F6] border-[#E5E7EB] cursor-not-allowed' : 'bg-white'}
            ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        {success && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#10B981]">
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>
      {error && <p className="text-[12px] text-[#EF4444]">{error}</p>}
    </div>
  );
}