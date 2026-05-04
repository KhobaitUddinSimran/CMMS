'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/common/Card'
import { Spinner } from '@/components/common/Spinner'
import { useToastStore } from '@/stores/toastStore'
import {
  listMessages, sendMessage, markMessageRead, markAllRead, deleteMessage,
  type Message,
} from '@/lib/api/messages'
import { listLecturers, listCourses } from '@/lib/api/courses'
import {
  MessageSquare, Send, Plus, Trash2, Mail, MailOpen,
  RefreshCw, X, ChevronDown, ChevronUp, Users, Bell,
} from 'lucide-react'

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
function fmt(d: string) {
  return new Date(d).toLocaleString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function displayName(u?: Partial<{ full_name: string; email: string }>) {
  return u?.full_name || u?.email || 'Unknown'
}

// ────────────────────────────────────────────────────────────────────────────
// Compose modal
// ────────────────────────────────────────────────────────────────────────────
interface ComposeProps {
  onClose: () => void
  onSent: () => void
  isCoordinator: boolean
}

function ComposeModal({ onClose, onSent, isCoordinator }: ComposeProps) {
  const { addToast } = useToastStore()
  const [lecturers, setLecturers] = useState<any[]>([])
  const [courses, setCourses]     = useState<any[]>([])
  const [form, setForm] = useState({
    to_user_id: '',
    broadcast_course_id: '',
    subject: '',
    body: '',
    is_reminder: false,
  })
  const [sending, setSending] = useState(false)
  const [mode, setMode] = useState<'direct' | 'broadcast'>('direct')

  useEffect(() => {
    listLecturers().then(setLecturers).catch(() => {})
    if (isCoordinator) listCourses({ limit: 500 }).then(r => setCourses(r.data || [])).catch(() => {})
  }, [isCoordinator])

  async function handleSend() {
    if (!form.body.trim()) { addToast('Message body is required', 'error'); return }

    let payload: any = { subject: form.subject, body: form.body, course_id: form.broadcast_course_id || undefined }

    if (mode === 'broadcast') {
      if (!form.broadcast_course_id) { addToast('Select a course to broadcast to', 'error'); return }
      // get lecturers of this course
      const course = courses.find((c: any) => c.id === form.broadcast_course_id)
      if (!course?.lecturer_id) { addToast('This course has no assigned lecturer', 'error'); return }
      payload.to_user_ids = [course.lecturer_id]
    } else {
      if (!form.to_user_id) { addToast('Select a recipient', 'error'); return }
      payload.to_user_id = form.to_user_id
    }

    setSending(true)
    try {
      await sendMessage(payload)
      addToast('Message sent', 'success')
      onSent()
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Failed to send', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-[18px] font-bold text-[#111827]">
            {form.is_reminder ? '📣 Send Reminder' : '✉️ New Message'}
          </h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#111827]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Message type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setForm(f => ({ ...f, is_reminder: false }))}
              className={`flex-1 py-2 rounded-lg text-[13px] font-medium border transition-colors
                ${!form.is_reminder ? 'bg-[#C90031] text-white border-[#C90031]' : 'bg-white text-[#374151] border-[#E5E7EB] hover:bg-[#F9FAFB]'}`}
            >
              <MessageSquare className="w-3.5 h-3.5 inline mr-1" /> Direct Message
            </button>
            <button
              onClick={() => setForm(f => ({ ...f, is_reminder: true, subject: f.subject || 'Reminder: Grade Submission' }))}
              className={`flex-1 py-2 rounded-lg text-[13px] font-medium border transition-colors
                ${form.is_reminder ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-[#374151] border-[#E5E7EB] hover:bg-[#F9FAFB]'}`}
            >
              <Bell className="w-3.5 h-3.5 inline mr-1" /> Reminder
            </button>
          </div>

          {/* Recipient mode (coordinator only) */}
          {isCoordinator && (
            <div className="flex gap-2 text-[13px]">
              <button
                onClick={() => setMode('direct')}
                className={`px-3 py-1.5 rounded-lg border transition-colors
                  ${mode === 'direct' ? 'border-[#C90031] text-[#C90031] bg-red-50' : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]'}`}
              >
                <Mail className="w-3.5 h-3.5 inline mr-1" /> Direct
              </button>
              <button
                onClick={() => setMode('broadcast')}
                className={`px-3 py-1.5 rounded-lg border transition-colors
                  ${mode === 'broadcast' ? 'border-[#C90031] text-[#C90031] bg-red-50' : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]'}`}
              >
                <Users className="w-3.5 h-3.5 inline mr-1" /> By Course
              </button>
            </div>
          )}

          {/* Recipient */}
          {mode === 'direct' ? (
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1">To *</label>
              <select value={form.to_user_id}
                onChange={e => setForm(f => ({ ...f, to_user_id: e.target.value }))}
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#C90031]">
                <option value="">Select lecturer…</option>
                {lecturers.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.full_name || l.email}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1">Course (sends to assigned lecturer)</label>
              <select value={form.broadcast_course_id}
                onChange={e => setForm(f => ({ ...f, broadcast_course_id: e.target.value }))}
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#C90031]">
                <option value="">Select course…</option>
                {courses.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name || c.code}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1">Subject</label>
            <input type="text" value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder={form.is_reminder ? 'Reminder: Grade Submission Deadline' : 'Subject…'}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#C90031]" />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#374151] mb-1">Message *</label>
            {form.is_reminder && (
              <div className="flex gap-1 mb-2 flex-wrap">
                {[
                  'Please submit grades by the deadline.',
                  'Reminder: assessment marks are due this week.',
                  'Your grade submission is overdue. Please update immediately.',
                ].map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, body: t }))}
                    className="text-[11px] px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200 hover:bg-amber-100">
                    {t.slice(0, 32)}…
                  </button>
                ))}
              </div>
            )}
            <textarea rows={4} value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Write your message…"
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#C90031] resize-none" />
          </div>
        </div>

        <div className="flex gap-2 justify-end px-6 py-4 border-t border-[#E5E7EB]">
          <button onClick={onClose}
            className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-[14px] text-[#374151] hover:bg-[#F9FAFB]">
            Cancel
          </button>
          <button onClick={handleSend} disabled={sending}
            className={`flex items-center gap-2 px-4 py-2 text-white text-[14px] font-medium rounded-lg disabled:opacity-50
              ${form.is_reminder ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#C90031] hover:bg-[#A80028]'}`}>
            {sending ? <Spinner /> : <Send className="w-4 h-4" />}
            {form.is_reminder ? 'Send Reminder' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Message row
// ────────────────────────────────────────────────────────────────────────────
function MessageRow({
  msg, isInbox, onDelete, onRead,
}: {
  msg: Message
  isInbox: boolean
  onDelete: (id: string) => void
  onRead: (id: string) => void
}) {
  const [open, setOpen] = useState(false)

  function handleOpen() {
    setOpen(o => !o)
    if (isInbox && !msg.is_read) onRead(msg.id)
  }

  const other = isInbox ? msg.from_user : msg.to_user
  const unread = isInbox && !msg.is_read

  return (
    <div className={`border rounded-lg transition-colors ${unread ? 'border-[#C90031] bg-red-50' : 'border-[#E5E7EB] bg-white'}`}>
      <div className="flex items-start gap-3 px-4 py-3 cursor-pointer" onClick={handleOpen}>
        <div className="mt-0.5 flex-shrink-0">
          {unread
            ? <Mail className="w-4 h-4 text-[#C90031]" />
            : <MailOpen className="w-4 h-4 text-[#9CA3AF]" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#111827]">{displayName(other)}</span>
            {msg.courses && <span className="text-[11px] text-[#6B7280] font-mono">{msg.courses.code}</span>}
            {unread && <span className="text-[10px] px-1.5 py-0.5 bg-[#C90031] text-white rounded-full font-semibold">NEW</span>}
          </div>
          <p className="text-[13px] text-[#374151] font-medium truncate">{msg.subject || '(no subject)'}</p>
          <p className="text-[12px] text-[#9CA3AF] mt-0.5">{fmt(msg.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); onDelete(msg.id) }}
            className="p-1 text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 rounded">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 border-t border-[#E5E7EB] pt-3">
          <p className="text-[14px] text-[#111827] whitespace-pre-wrap">{msg.body}</p>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const { user } = useAuth()
  const { addToast } = useToastStore()
  const isCoordinator = user?.role === 'coordinator' || user?.special_roles?.includes('coordinator') || false

  const [data, setData]       = useState<{ inbox: Message[]; sent: Message[]; unread_count: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'inbox' | 'sent'>('inbox')
  const [showCompose, setShowCompose] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listMessages()
      setData(res)
    } catch {
      addToast('Failed to load messages', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this message? This cannot be undone.')) return
    try {
      await deleteMessage(id)
      addToast('Deleted', 'success')
      load()
    } catch { addToast('Failed to delete', 'error') }
  }

  async function handleRead(id: string) {
    await markMessageRead(id).catch(() => {})
    setData(d => d ? {
      ...d,
      inbox: d.inbox.map(m => m.id === id ? { ...m, is_read: true } : m),
      unread_count: Math.max(0, d.unread_count - 1),
    } : d)
  }

  async function handleMarkAllRead() {
    await markAllRead().catch(() => {})
    setData(d => d ? { ...d, inbox: d.inbox.map(m => ({ ...m, is_read: true })), unread_count: 0 } : d)
  }

  const messages = tab === 'inbox' ? (data?.inbox || []) : (data?.sent || [])

  return (
    <MainLayout>
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between pt-4">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827]">Messages</h1>
          <p className="text-[16px] text-[#6B7280] mt-1">
            {isCoordinator ? 'Contact lecturers and send reminders' : 'Messages from your coordinator'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#6B7280]" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#C90031] hover:bg-[#A80028] text-white text-[14px] font-medium rounded-lg">
            <Plus className="w-4 h-4" /> New Message
          </button>
        </div>
      </div>

      {/* Tabs + actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-[#F3F4F6] p-1 rounded-lg">
          <button
            onClick={() => setTab('inbox')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-colors
              ${tab === 'inbox' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'}`}
          >
            Inbox
            {(data?.unread_count ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 bg-[#C90031] text-white text-[10px] rounded-full font-bold">
                {data?.unread_count}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('sent')}
            className={`px-4 py-2 rounded-md text-[13px] font-medium transition-colors
              ${tab === 'sent' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'}`}
          >
            Sent
          </button>
        </div>
        {tab === 'inbox' && (data?.unread_count ?? 0) > 0 && (
          <button onClick={handleMarkAllRead}
            className="text-[13px] text-[#C90031] hover:text-[#A80028] font-medium">
            Mark all read
          </button>
        )}
      </div>

      {/* Messages */}
      {loading ? (
        <Card><div className="flex justify-center py-12"><Spinner /></div></Card>
      ) : messages.length === 0 ? (
        <Card>
          <div className="text-center py-14">
            <MessageSquare className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
            <p className="font-semibold text-[#6B7280]">
              {tab === 'inbox' ? 'Your inbox is empty' : 'No sent messages yet'}
            </p>
            {tab === 'inbox' && isCoordinator && (
              <p className="text-sm text-[#9CA3AF] mt-1">Messages from others will appear here</p>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {messages.map(msg => (
            <MessageRow
              key={msg.id}
              msg={msg}
              isInbox={tab === 'inbox'}
              onDelete={handleDelete}
              onRead={handleRead}
            />
          ))}
        </div>
      )}

      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onSent={() => { setShowCompose(false); load() }}
          isCoordinator={isCoordinator}
        />
      )}
    </div>
    </MainLayout>
  )
}
