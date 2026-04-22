'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { ArrowRight, BarChart3, Lock, Globe, CheckCircle } from 'lucide-react'

const FEATURES = [
  {
    icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
    title: 'Real-Time Tracking',
    description: 'Monitor carry marks and grades in real-time across all courses',
  },
  {
    icon: <Lock className="w-8 h-8 text-blue-600" />,
    title: 'Secure Access',
    description: 'Role-based access control with enterprise-grade security',
  },
  {
    icon: <Globe className="w-8 h-8 text-blue-600" />,
    title: 'Mobile Responsive',
    description: 'Access the system anytime, anywhere, on any device',
  },
  {
    icon: <CheckCircle className="w-8 h-8 text-blue-600" />,
    title: 'Automated Reports',
    description: 'Generate detailed reports instantly for decision-making',
  },
]

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [router, isAuthenticated])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logos/utm-logo.png" alt="UTM Logo" className="h-12 w-auto" />
            <div className="flex flex-col">
              <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent tracking-tight">CMMS</h1>
              <p className="text-xs font-semibold text-blue-600">Universiti Teknologi Malaysia</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Features</a>
            <button 
              onClick={() => router.push('/auth/login')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              UTM Carry Mark Management System
            </h2>
            <p className="text-xl text-gray-200 mb-8">
              A unified platform built for UTM. Empower students, faculty, and administrators with real-time grade tracking, secure access control, and comprehensive reporting.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/auth/login')}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight size={20} />
              </button>
              <button className="px-8 py-3 border-2 border-gray-300 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-gray-600 font-semibold text-sm uppercase tracking-wider">Trusted by UTM</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">Serving the Academic Community</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '1,250+', label: 'Active Students' },
              { number: '120+', label: 'Faculty Members' },
              { number: '48', label: 'Courses' },
              { number: '24/7', label: 'System Uptime' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</p>
                <p className="text-gray-600 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Why CMMS</p>
            <h3 className="text-4xl font-bold text-gray-900 mt-2">Powerful Features for Every Role</h3>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Designed to simplify academic carry mark management with industry-leading features</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, idx) => (
              <div key={idx} className="p-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
                <div className="mb-4">{feature.icon}</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Email Domains</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="text-gray-900 font-medium">Students</p>
                    <p className="text-gray-600 text-sm">@graduate.utm.my</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="text-gray-900 font-medium">Faculty & Staff</p>
                    <p className="text-gray-600 text-sm">@utm.my</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h4>
              <p className="text-gray-600 mb-4">
                If you have any questions or need technical support, please contact our help desk.
              </p>
              <button className="text-blue-600 font-medium hover:text-blue-700">
                Contact Support →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <p className="text-white font-semibold mb-4">CMMS</p>
              <p className="text-sm text-gray-400">Carry Mark Management System for Universiti Teknologi Malaysia</p>
            </div>
            <div>
              <p className="text-white text-sm font-semibold mb-4">Quick Links</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Roles</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <p className="text-white text-sm font-semibold mb-4">Resources</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <p className="text-white text-sm font-semibold mb-4">Contact</p>
              <p className="text-sm text-gray-400">Universiti Teknologi Malaysia</p>
              <p className="text-sm text-gray-400 mt-2">Email: support@utm.my</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Universiti Teknologi Malaysia. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
