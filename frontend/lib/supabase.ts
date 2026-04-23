import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface User {
  id: string
  email: string
  full_name: string
  role: 'student' | 'lecturer' | 'coordinator' | 'hod' | 'admin'
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  code: string
  name: string
  description: string
  credits: number
  lecturer_id: string
  department_id: string
  semester: number
  academic_year: string
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  semester: number
  academic_year: string
  status: 'active' | 'completed' | 'dropped'
  enrolled_at: string
}

export interface Grade {
  id: string
  student_id: string
  course_id: string
  grade_type: 'assignment' | 'quiz' | 'midterm' | 'final' | 'practical'
  score: number
  max_score: number
  weight: number
  recorded_at: string
  recorded_by: string
}

export interface Department {
  id: string
  code: string
  name: string
  hod_id: string
  created_at: string
  updated_at: string
}
