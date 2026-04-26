import { Menu } from 'lucide-react';
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
    <header className="h-14 bg-white border-b border-[#E8EAED] flex items-center px-5 gap-4 shrink-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      {/* Mobile Menu Toggle */}
      <button 
        onClick={onMenuToggle} 
        className="md:hidden text-[#94A3B8] hover:text-[#0F172A] transition-colors cursor-pointer"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo and Branding */}
      <div className="flex items-center gap-3 shrink-0">
        <img
          src="/logos/utm-logo.png"
          alt="UTM Logo"
          className="h-8 w-auto object-contain shrink-0"
        />
        <div className="hidden sm:flex flex-col leading-none">
          <span className="text-[12px] font-bold tracking-widest text-[#C90031] uppercase">CMMS</span>
          <span className="text-[10px] text-[#94A3B8] mt-0.5">Carry Mark System</span>
        </div>
      </div>

      {/* Separator */}
      <div className="hidden md:block w-px h-5 bg-[#E8EAED]" />

      {/* Page Title */}
      <h1 className="hidden md:block text-[15px] font-semibold text-[#0F172A] tracking-tight">{title}</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end leading-none">
          <span className="text-[13.5px] font-semibold text-[#0F172A]">{userName}</span>
          <span className="text-[11px] text-[#94A3B8] mt-0.5">{roleLabels[role]}</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#C90031] text-white flex items-center justify-center text-[11px] font-bold shrink-0 tracking-wide">
          {userInitials}
        </div>
      </div>
    </header>
  )
}