'use client';
import { GraduationCap, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function Header() {
  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  return (
    <header className="pt-8 px-6 pb-2 flex items-center justify-between z-10">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100/50">
          <GraduationCap size={18} strokeWidth={2.5} />
        </div>
        <h1 className="font-bold text-lg text-emerald-950 tracking-tight">대구대 방명록</h1>
      </div>
      <button onClick={handleLogout} className="flex items-center gap-1.5 text-gray-400 hover:text-gray-900 transition-colors text-sm font-medium">
        <LogOut size={16} />
        로그아웃
      </button>
    </header>
  );
}
