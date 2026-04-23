import { supabase, User, Course, Enrollment, Grade } from '../supabase'

// ============================================
// USER SERVICES
// ============================================

export const userService = {
  async getUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user:', error)
      return null
    }
    return data
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) {
      console.error('Error fetching user by email:', error)
      return null
    }
    return data
  },

  async getUsersByRole(role: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
    
    if (error) {
      console.error('Error fetching users by role:', error)
      return []
    }
    return data || []
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating user:', error)
      return null
    }
    return data
  },

  async updateLastLogin(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId)
    
    if (error) {
      console.error('Error updating last login:', error)
      return false
    }
    return true
  },
}

// ============================================
// COURSE SERVICES
// ============================================

export const courseService = {
  async getCourse(courseId: string): Promise<Course | null> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()
    
    if (error) {
      console.error('Error fetching course:', error)
      return null
    }
    return data
  },

  async getCoursesByLecturer(lecturerId: string, academicYear?: string): Promise<Course[]> {
    let query = supabase
      .from('courses')
      .select('*')
      .eq('lecturer_id', lecturerId)
    
    if (academicYear) {
      query = query.eq('academic_year', academicYear)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching lecturer courses:', error)
      return []
    }
    return data || []
  },

  async getCoursesByDepartment(departmentId: string, semester?: number): Promise<Course[]> {
    let query = supabase
      .from('courses')
      .select('*')
      .eq('department_id', departmentId)
    
    if (semester) {
      query = query.eq('semester', semester)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching department courses:', error)
      return []
    }
    return data || []
  },

  async getAllCourses(academicYear: string): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('academic_year', academicYear)
      .order('code', { ascending: true })
    
    if (error) {
      console.error('Error fetching all courses:', error)
      return []
    }
    return data || []
  },

  async createCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course | null> {
    const { data, error } = await supabase
      .from('courses')
      .insert([course])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating course:', error)
      return null
    }
    return data
  },

  async updateCourse(courseId: string, updates: Partial<Course>): Promise<Course | null> {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', courseId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating course:', error)
      return null
    }
    return data
  },

  async deleteCourse(courseId: string): Promise<boolean> {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
    
    if (error) {
      console.error('Error deleting course:', error)
      return false
    }
    return true
  },
}

// ============================================
// ENROLLMENT SERVICES
// ============================================

export const enrollmentService = {
  async getStudentEnrollments(studentId: string, academicYear?: string): Promise<Enrollment[]> {
    let query = supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
    
    if (academicYear) {
      query = query.eq('academic_year', academicYear)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching student enrollments:', error)
      return []
    }
    return data || []
  },

  async getCourseEnrollments(courseId: string, status?: string): Promise<Enrollment[]> {
    let query = supabase
      .from('enrollments')
      .select('*')
      .eq('course_id', courseId)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching course enrollments:', error)
      return []
    }
    return data || []
  },

  async enrollStudent(studentId: string, courseId: string, semester: number, academicYear: string): Promise<Enrollment | null> {
    const { data, error } = await supabase
      .from('enrollments')
      .insert([
        {
          student_id: studentId,
          course_id: courseId,
          semester,
          academic_year: academicYear,
          status: 'active',
        },
      ])
      .select()
      .single()
    
    if (error) {
      console.error('Error enrolling student:', error)
      return null
    }
    return data
  },

  async updateEnrollmentStatus(enrollmentId: string, status: string): Promise<Enrollment | null> {
    const { data, error } = await supabase
      .from('enrollments')
      .update({ status })
      .eq('id', enrollmentId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating enrollment status:', error)
      return null
    }
    return data
  },

  async dropCourse(enrollmentId: string): Promise<boolean> {
    const { error } = await supabase
      .from('enrollments')
      .update({ status: 'dropped' })
      .eq('id', enrollmentId)
    
    if (error) {
      console.error('Error dropping course:', error)
      return false
    }
    return true
  },
}

// ============================================
// GRADE SERVICES
// ============================================

export const gradeService = {
  async getStudentGrades(studentId: string, courseId?: string): Promise<Grade[]> {
    let query = supabase
      .from('grades')
      .select('*')
      .eq('student_id', studentId)
    
    if (courseId) {
      query = query.eq('course_id', courseId)
    }
    
    const { data, error } = await query.order('recorded_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching student grades:', error)
      return []
    }
    return data || []
  },

  async getCourseGrades(courseId: string, studentId?: string): Promise<Grade[]> {
    let query = supabase
      .from('grades')
      .select('*')
      .eq('course_id', courseId)
    
    if (studentId) {
      query = query.eq('student_id', studentId)
    }
    
    const { data, error } = await query.order('student_id', { ascending: true })
    
    if (error) {
      console.error('Error fetching course grades:', error)
      return []
    }
    return data || []
  },

  async recordGrade(grade: Omit<Grade, 'id' | 'created_at' | 'updated_at'>): Promise<Grade | null> {
    const { data, error } = await supabase
      .from('grades')
      .insert([grade])
      .select()
      .single()
    
    if (error) {
      console.error('Error recording grade:', error)
      return null
    }
    return data
  },

  async updateGrade(gradeId: string, updates: Partial<Grade>): Promise<Grade | null> {
    const { data, error } = await supabase
      .from('grades')
      .update(updates)
      .eq('id', gradeId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating grade:', error)
      return null
    }
    return data
  },

  async deleteGrade(gradeId: string): Promise<boolean> {
    const { error } = await supabase
      .from('grades')
      .delete()
      .eq('id', gradeId)
    
    if (error) {
      console.error('Error deleting grade:', error)
      return false
    }
    return true
  },

  async calculateCourseGPA(studentId: string, courseId: string): Promise<number | null> {
    const { data, error } = await supabase
      .from('grades')
      .select('score, max_score, weight')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
    
    if (error || !data) {
      console.error('Error calculating GPA:', error)
      return null
    }
    
    // Calculate weighted average
    let totalWeight = 0
    let weightedSum = 0
    
    data.forEach((grade: any) => {
      const weight = grade.weight || 1
      const percentage = (grade.score / grade.max_score) * 100
      weightedSum += percentage * weight
      totalWeight += weight
    })
    
    return totalWeight > 0 ? weightedSum / totalWeight : null
  },
}
