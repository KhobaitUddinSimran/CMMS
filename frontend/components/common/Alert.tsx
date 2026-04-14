import { Info, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import type { AlertType } from '../../types';

interface AlertProps {
  type: AlertType;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

const config: Record<AlertType, { border: string; bg: string; icon: React.ReactNode }> = {
  info: { border: 'border-l-[#C90031]', bg: 'bg-[#FFF0F3]', icon: <Info className="w-5 h-5 text-[#C90031]" /> },
  success: { border: 'border-l-[#10B981]', bg: 'bg-green-50', icon: <CheckCircle className="w-5 h-5 text-[#10B981]" /> },
  error: { border: 'border-l-[#EF4444]', bg: 'bg-red-50', icon: <XCircle className="w-5 h-5 text-[#EF4444]" /> },
  warning: { border: 'border-l-[#F59E0B]', bg: 'bg-yellow-50', icon: <AlertTriangle className="w-5 h-5 text-[#F59E0B]" /> },
};

export function Alert({ type, title, children, onClose }: AlertProps) {
  const c = config[type];
  return (
    <div className={`border-l-4 ${c.border} ${c.bg} p-4 rounded-r-lg flex gap-3 relative`}>
      <div className="shrink-0 mt-0.5">{c.icon}</div>
      <div className="flex-1">
        {title && <p className="text-[14px] text-[#111827] mb-1">{title}</p>}
        <div className="text-[14px] text-[#6B7280]">{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="absolute top-3 right-3 text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}