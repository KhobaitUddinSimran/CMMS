interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({ children, className = '', header, footer }: CardProps) {
  return (
    <div className={`bg-white shadow-sm rounded-lg ${className}`}>
      {header && <div className="p-4 border-b border-[#E5E7EB]">{header}</div>}
      <div className="p-4">{children}</div>
      {footer && <div className="p-4 border-t border-[#E5E7EB]">{footer}</div>}
    </div>
  );
}
