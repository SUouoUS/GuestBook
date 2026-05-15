'use client';

import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    if (!supabase) return;

    if (isLoginMode) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(error.message);
      else setAuthSuccess('가입에 성공했습니다! 바로 로그인해주세요.');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 z-10">
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
        <div className="text-center mb-10">
          <h2 className="text-[26px] font-bold text-gray-900 mb-3 tracking-tight">
            {isLoginMode ? '반가워요 학우님!' : '환영합니다!'}
          </h2>
          <p className="text-gray-500 text-[15px]">
            {isLoginMode ? '대구대 방명록에 로그인하세요' : '새로운 학우 계정을 만들어보세요'}
          </p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-emerald-800/70 ml-1">이메일</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-700 transition-colors" size={18} />
              <input 
                type="email" 
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-emerald-50/30 border border-emerald-100/50 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all text-[15px]"
                placeholder="student@daegu.ac.kr"
                required
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-emerald-800/70 ml-1">비밀번호</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-700 transition-colors" size={18} />
              <input 
                type="password" 
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-emerald-50/30 border border-emerald-100/50 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50 transition-all text-[15px]"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {authError && <p className="text-rose-500 text-[13px] font-medium text-center pt-2 animate-in">{authError}</p>}
          {authSuccess && <p className="text-emerald-600 text-[13px] font-medium text-center pt-2 animate-in">{authSuccess}</p>}

          <button type="submit" className="w-full bg-[#1a1a1a] text-white rounded-2xl py-4 font-bold text-[15px] mt-2 shadow-[0_4px_14px_0_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0 transition-all">
            {isLoginMode ? '로그인' : '회원가입'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); setAuthSuccess(''); }} className="text-[14px] text-gray-500 hover:text-[#1a1a1a] transition-colors font-medium">
            {isLoginMode ? '아직 계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
          </button>
        </div>
      </div>
    </div>
  );
}
