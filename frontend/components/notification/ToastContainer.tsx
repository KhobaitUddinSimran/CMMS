import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToast } from '@/lib/contexts/toast-context'
import type { ToastType } from '@/types'

const config: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
  success: { bg: 'bg-[#10B981]', icon: <CheckCircle className="w-5 h-5 text-white" /> },
  error: { bg: 'bg-[#EF4444]', icon: <XCircle className="w-5 h-5 text-white" /> },
  warning: { bg: 'bg-[#F59E0B]', icon: <AlertTriangle className="w-5 h-5 text-gray-900" /> },
  info: { bg: 'bg-[#C90031]', icon: <Info className="w-5 h-5 text-white" /> },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[1000] flex flex-col gap-3 max-w-[350px]">
      {toasts.map(toast => {
        const c = config[toast.type];
        const textColor = toast.type === 'warning' ? 'text-gray-900' : 'text-white';
        return (
          <div
            key={toast.id}
            className={`${c.bg} rounded-xl shadow-lg p-4 flex items-center gap-3 animate-[slideIn_0.3s_ease] min-w-[200px]`}
          >
            {c.icon}
            <p className={`flex-1 text-[14px] ${textColor}`}>{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className={`${textColor} opacity-70 hover:opacity-100 cursor-pointer`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}