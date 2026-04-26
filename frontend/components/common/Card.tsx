interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({ children, className = '', header, footer }: CardProps) {
  return (
    <div className={`bg-white border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] rounded-xl ${className}`}>
      {header && <div className="px-5 py-4 border-b border-[#F0F2F5]">{header}</div>}
      <div className="p-5">{children}</div>
      {footer && <div className="px-5 py-4 border-t border-[#F0F2F5]">{footer}</div>}
    </div>
  );
}
