export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'student' | 'lecturer' | 'coordinator' | 'hod' | 'admin'
          password_hash: string | null
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role: 'student' | 'lecturer' | 'coordinator' | 'hod' | 'admin'
          password_hash?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'student' | 'lecturer' | 'coordinator' | 'hod' | 'admin'
          password_hash?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      departments: {
        Row: {
          id: string
          code: string
          name: string
          hod_id: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          hod_id?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          hod_id?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          credits: number
          lecturer_id: string
          department_id: string
          semester: number
          academic_year: string
          max_students: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          credits?: number
          lecturer_id: string
          department_id: string
          semester: number
          academic_year: string
          max_students?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          credits?: number
          lecturer_id?: string
          department_id?: string
          semester?: number
          academic_year?: string
          max_students?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          student_id: string
          course_id: string
          semester: number
          academic_year: string
          status: 'active' | 'completed' | 'dropped' | 'pending'
          enrolled_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          semester: number
          academic_year: string
          status?: 'active' | 'completed' | 'dropped' | 'pending'
          enrolled_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          semester?: number
          academic_year?: string
          status?: 'active' | 'completed' | 'dropped' | 'pending'
          enrolled_at?: string
          updated_at?: string
        }
      }
      grades: {
        Row: {
          id: string
          student_id: string
          course_id: string
          assessment_name: string
          grade_type: 'assignment' | 'quiz' | 'midterm' | 'final' | 'practical' | 'project'
          score: number
          max_score: number
          weight: number
          recorded_at: string
          recorded_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          assessment_name: string
          grade_type: 'assignment' | 'quiz' | 'midterm' | 'final' | 'practical' | 'project'
          score: number
          max_score?: number
          weight?: number
          recorded_at?: string
          recorded_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          assessment_name?: string
          grade_type?: 'assignment' | 'quiz' | 'midterm' | 'final' | 'practical' | 'project'
          score?: number
          max_score?: number
          weight?: number
          recorded_at?: string
          recorded_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          student_id: string
          course_id: string
          attendance_date: string
          status: 'present' | 'absent' | 'late' | 'excused'
          recorded_by: string
          remarks: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          attendance_date: string
          status: 'present' | 'absent' | 'late' | 'excused'
          recorded_by: string
          remarks?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          attendance_date?: string
          status?: 'present' | 'absent' | 'late' | 'excused'
          recorded_by?: string
          remarks?: string | null
          created_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          course_id: string | null
          posted_by: string
          posted_at: string
          expires_at: string | null
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          course_id?: string | null
          posted_by: string
          posted_at?: string
          expires_at?: string | null
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          course_id?: string | null
          posted_by?: string
          posted_at?: string
          expires_at?: string | null
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {
      update_updated_at_column: {
        Args: {}
        Returns: undefined
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & { schema: 'public' })
    | { schema: keyof Database }
    | { name: keyof Database['public']['Tables'] },
  TableName extends PublicTableNameOrOptions extends { name: infer P }
    ? P
    : PublicTableNameOrOptions extends { schema: infer P }
    ? keyof (P extends { Tables: infer T } ? T : never)
    : never = never,
> = PublicTableNameOrOptions extends { schema: infer _ }
  ? // @ts-ignore
    Database[Extract<PublicTableNameOrOptions['schema'], keyof Database>]['Tables'][TableName]
  : Database['public']['Tables'][Extract<
      PublicTableNameOrOptions extends { name: infer P } ? P : PublicTableNameOrOptions,
      keyof Database['public']['Tables']
    >]
