// Select Component - Dropdown select
interface SelectProps {
  label?: string
  options: { value: string; label: string }[]
  value?: string
  onChange?: (value: string) => void
}
export const Select: React.FC<SelectProps> = ({ options, value, onChange }) => {
  return (
    <select value={value} onChange={(e) => onChange?.(e.target.value)}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
