import type { BadgeVariant } from '../../types';

const variantClasses: Record<BadgeVariant, string> = {
  draft: 'bg-[#F3F4F6] text-[#6B7280]',
  published: 'bg-green-100 text-[#10B981]',
  flagged: 'bg-red-100 text-[#EF4444]',
  delayed: 'bg-yellow-100 text-[#F59E0B]',
  anomaly: 'bg-orange-100 text-[#FBBF24]',
  role: 'bg-[#C90031] text-white',
};

export function Badge({ variant = 'role', children }: { variant?: BadgeVariant; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}