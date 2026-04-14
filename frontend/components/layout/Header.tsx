import { Menu } from 'lucide-react';
import { Badge } from '../common/Badge';
import type { UserRole } from '../../types';

interface HeaderProps {
  title: string;
  userName: string;
  userInitials: string;
  role: UserRole;
  onMenuToggle: () => void;
}

const roleLabels: Record<UserRole, string> = {
  student: 'Student',
  lecturer: 'Lecturer',
  coordinator: 'Coordinator',
  hod: 'HOD',
  admin: 'Admin',
};

export function Header({ title, userName, userInitials, role, onMenuToggle }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center px-4 gap-4 shrink-0 z-50 shadow-sm">
      {/* Mobile Menu Toggle */}
      <button 
        onClick={onMenuToggle} 
        className="md:hidden text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Logo and Branding */}
      <div className="flex items-center gap-3">
        <img
          src="/logos/utm-logo.png"
          alt="UTM Logo"
          className="h-12 w-auto object-contain shrink-0"
        />
        <div className="hidden sm:flex flex-col">
          <span className="text-[14px] font-bold text-[#111827]">CMMS</span>
          <span className="text-[10px] text-[#6B7280]">Carry Mark System</span>
        </div>
      </div>

      {/* Separator */}
      <div className="hidden md:block w-px h-6 bg-[#E5E7EB]"></div>

      {/* Page Title */}
      <h1 className="hidden md:block text-[18px] font-semibold text-[#111827]">{title}</h1>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* User Info */}
      <div className="flex items-center gap-3 pl-4 border-l border-[#E5E7EB]">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[14px] font-medium text-[#111827]">{userName}</span>
          <Badge variant="role">{roleLabels[role]}</Badge>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#C90031] text-white flex items-center justify-center text-[12px] font-bold shrink-0">
          {userInitials}
        </div>
      </div>
    </header>
  )
}