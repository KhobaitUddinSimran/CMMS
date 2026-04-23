// Select Component - Dropdown select
import React from 'react'

export interface SelectProps {
  label?: string
  placeholder?: string
  options: { value: string; label: string }[]
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  error?: string
  className?: string
}

export const Select: React.FC<SelectProps> = ({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  error,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label className="text-[12px] text-[#111827]">{label}</label>
      )}
      <select
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={`w-full h-10 border rounded-lg px-3 text-[14px] transition-colors outline-none appearance-none bg-white
          ${error ? 'border-[#EF4444]' : 'border-[#E5E7EB] focus:border-[#C90031] focus:border-2 focus:bg-[#F9FAFB]'}
          ${disabled ? 'bg-[#F3F4F6] cursor-not-allowed text-[#9CA3AF]' : 'cursor-pointer text-[#111827]'}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-[12px] text-[#EF4444]">{error}</p>}
    </div>
  )
}
