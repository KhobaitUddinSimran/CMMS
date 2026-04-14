'use client'

import { useState } from 'react'
import { useToast } from '@/lib/contexts/toast-context'
import { Card } from '@/components/common/Card'
import { Bell, Lock, Eye, Database, Users } from 'lucide-react'

export default function SettingsPage() {
  const { showToast } = useToast()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailDigest, setEmailDigest] = useState('weekly')
  const [darkMode, setDarkMode] = useState(false)

  const handleSave = () => {
    showToast('success', 'Settings saved successfully!')
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Customize your preferences and account settings</p>
      </div>

      {/* Notifications Section */}
      <Card>
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <p className="text-gray-600 text-sm">Manage how you receive updates</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Enable Notifications</p>
              <p className="text-sm text-gray-600">Receive system notifications</p>
            </div>
            <input type="checkbox" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Digest</p>
              <p className="text-sm text-gray-600">Receive summary emails</p>
            </div>
            <select value={emailDigest} onChange={(e) => setEmailDigest(e.target.value)} className="px-3 py-2 border rounded-lg bg-white">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Privacy & Security Section */}
      <Card>
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900">Privacy & Security</h2>
          </div>
          <p className="text-gray-600 text-sm">Manage your privacy and security settings</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600">Add extra security to your account</p>
            </div>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Set Up
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Active Sessions</p>
              <p className="text-sm text-gray-600">Manage your active sessions</p>
            </div>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              View
            </button>
          </div>
        </div>
      </Card>

      {/* Display Section */}
      <Card>
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900">Display</h2>
          </div>
          <p className="text-gray-600 text-sm">Customize your display preferences</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Dark Mode</p>
              <p className="text-sm text-gray-600">Use dark theme</p>
            </div>
            <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} className="w-5 h-5" />
          </div>
        </div>
      </Card>

      {/* Data Section */}
      <Card>
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">Data</h2>
          </div>
          <p className="text-gray-600 text-sm">Manage your data and exports</p>
        </div>
        <div className="p-6 space-y-4">
          <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-left">
            Download Your Data
          </button>
          <button className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-left">
            Delete Account
          </button>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
          Cancel
        </button>
        <button onClick={handleSave} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium">
          Save Changes
        </button>
      </div>
    </div>
  )
}
