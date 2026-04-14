'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { useToast } from '@/lib/contexts/toast-context'
import { Spinner } from '@/components/common/Spinner'
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react'

type UserRole = 'student' | 'lecturer' | 'coordinator' | 'hod' | 'admin'

const ROLE_INFO: Record<UserRole, { name: string; color: string; suggestions: string[] }> = {
  student: { name: 'Student', color: 'from-blue-500 to-blue-600', suggestions: ['student@graduate.utm.my'] },
  lecturer: { name: 'Lecturer', color: 'from-green-500 to-green-600', suggestions: ['lecturer@utm.my'] },
  coordinator: { name: 'Coordinator', color: 'from-purple-500 to-purple-600', suggestions: ['coordinator@utm.my'] },
  hod: { name: 'HOD', color: 'from-red-500 to-red-600', suggestions: ['hod@utm.my'] },
  admin: { name: 'Admin', color: 'from-yellow-500 to-yellow-600', suggestions: ['admin@utm.my'] },
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  useEffect(() => {
    const role = searchParams.get('role') as UserRole | null
    if (role && Object.keys(ROLE_INFO).includes(role)) {
      setSelectedRole(role)
    } else if (typeof window !== 'undefined') {
      // Only redirect on client side
      router.replace('/')
    }
  }, [searchParams, router])

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)

    // Validate inputs
    if (!email.trim()) {
      showToast('error', 'Please enter your email address')
      return
    }

    if (!validateEmail(email)) {
      showToast('error', 'Please enter a valid email address')
      return
    }

    if (!password) {
      showToast('error', 'Please enter your password')
      return
    }

    if (password.length < 6) {
      showToast('error', 'Password must be at least 6 characters')
      return
    }

    try {
      setIsLoading(true)

      // Call the backend API
      const result = await login(email.toLowerCase(), password)

      if (result.success) {
        setSuccess(true)
        showToast('success', 'Login successful! Redirecting...')
        setEmail('')
        setPassword('')

        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard')
        }, 800)
      } else {
        showToast('error', result.error || 'Login failed. Please check your credentials.')
      }
    } catch (err: any) {
      showToast('error', err?.message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Spinner size="lg" />
      </div>
    )
  }

  const roleInfo = ROLE_INFO[selectedRole]

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 border-l-4 border-blue-600">
      <div className="w-full max-w-[440px] bg-white rounded-xl shadow-xl p-8 md:p-10">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logos/utm-logo.png" alt="UTM Logo" className="h-20 w-auto object-contain mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 text-center">Carry Mark Management System</h1>
          <p className="text-gray-600 text-center mt-2">Sign in as {roleInfo.name}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={roleInfo.suggestions[0]}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                disabled={isLoading || authLoading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                disabled={isLoading || authLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                disabled={isLoading || authLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Role Display */}
          <div className={`p-4 rounded-lg bg-gradient-to-r ${roleInfo.color} text-white font-medium text-center`}>
            Logging in as: {roleInfo.name}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || authLoading}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading || authLoading ? (
              <>
                <Spinner size="sm" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Forgot Password Link */}
        <div className="mt-6 text-center">
          <a href="/password-reset" className="text-blue-500 hover:text-blue-600 font-medium text-sm">
            Forgot your password?
          </a>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-600 text-xs">
            For testing purposes, use:<br />
            Email: {roleInfo.suggestions[0]}<br />
            Password: password@cmsss
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <LoginContent />
}
