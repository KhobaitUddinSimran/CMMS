// Validation - Form field validators
export const validators = {
  email: (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email) ? '' : 'Invalid email'
  },
  password: (password: string) => {
    if (password.length < 8) return 'Min 8 characters'
    if (!/[A-Z]/.test(password)) return 'Needs uppercase'
    if (!/[0-9]/.test(password)) return 'Needs number'
    return ''
  },
  required: (value: string) => (value ? '' : 'Required'),
}
