// useForm Hook - Form state management
'use client'

import { useState } from 'react'

export const useForm = <T extends Record<string, any>>(initialValues: T) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Partial<T>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value })
  }

  const handleSubmit = (callback: () => void) => (e: React.FormEvent) => {
    e.preventDefault()
    callback()
  }

  return { values, errors, handleChange, handleSubmit, setValues, setErrors }
}
