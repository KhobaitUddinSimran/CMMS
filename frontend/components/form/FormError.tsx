// FormError Component - Error message
export const FormError: React.FC<{ message: string }> = ({ message }) => (
  <span style={{ color: '#ef4444', fontSize: '12px' }}>{message}</span>
)
