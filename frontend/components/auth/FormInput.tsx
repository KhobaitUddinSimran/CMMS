'use client'

import React, { InputHTMLAttributes, useState } from 'react'

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, icon, type = 'text', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type

    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">{icon}</div>}
          <input
            ref={ref}
            type={inputType}
            className={`w-full px-4 py-2 border rounded-lg transition-colors ${
              icon ? 'pl-10' : ''
            } ${
              error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && <p className="mt-1 text-sm text-gray-600">{helperText}</p>}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

interface FormCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const FormCheckbox = React.forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="mb-4">
      <div className="flex items-center">
        <input
          ref={ref}
          type="checkbox"
          className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer ${className}`}
          {...props}
        />
        {label && (
          <label className="ml-2 text-sm text-gray-700 cursor-pointer">
            {label}
          </label>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
)

FormCheckbox.displayName = 'FormCheckbox'

interface FormSelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`w-full px-4 py-2 border rounded-lg transition-colors ${
          error
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
        } focus:outline-none focus:ring-2 ${className}`}
        {...props}
      >
        <option value="">Select {label?.toLowerCase() || 'an option'}...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
)

FormSelect.displayName = 'FormSelect'
