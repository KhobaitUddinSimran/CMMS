// FormLabel Component - Field label
export const FormLabel: React.FC<{ children: React.ReactNode; htmlFor?: string }> = ({
  children,
  htmlFor,
}) => (
  <label htmlFor={htmlFor} style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
    {children}
  </label>
)
