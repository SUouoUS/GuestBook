'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GraduationCap, LogOut, Heart, Send, Mail, Lock, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Session } from '@supabase/supabase-js';

// --- Theme Colors for Avatars ---
const AVATAR_COLORS = [
  { bg: 'd1fae5', text: '064e3b' }, // Emerald
  { bg: 'cffafe', text: '164e63' }, // Cyan
  { bg: 'e0e7ff', text: '312e81' }, // Indigo
  { bg: 'fce7f3', text: '831843' }, // Pink
  { bg: 'fef08a', text: '713f12' }, // Yellow
  { bg: 'ffedd5', text: '7c2d12' }, // Orange
  { bg: 'ccfbf1', text: '115e59' }, // Teal
  { bg: 'dbeafe', text: '1e3a8a' }, // Blue
];

const getAvatarTheme = (name: string) => {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

// --- Types ---
type Message = {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string;
  content: string;
  created_at: string;
  likes: number;
};

export default function GuestbookPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // App State
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [likedMessageIds, setLikedMessageIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Session 체크
  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      setIsLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2. 데이터 로드 및 실시간 구독
  useEffect(() => {
    if (!session || !supabase) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setMessages(data);
      setIsLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((msg) => msg.id === newMsg.id)) return prev;
            return [newMsg, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const updatedMsg = payload.new as Message;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  // --- Auth Handlers ---
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

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  // --- App Handlers ---
  const filteredMessages = messages.filter((msg) => {
    if (activeTab === 'my') return msg.user_id === session?.user.id;
    return true;
  });

  const handleLike = async (id: string, currentLikes: number) => {
    const isLiking = !likedMessageIds.has(id);
    const newLikes = currentLikes + (isLiking ? 1 : -1);

    setLikedMessageIds((prev) => {
      const newSet = new Set(prev);
      if (isLiking) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });

    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, likes: newLikes } : msg))
    );

    if (supabase) {
      await supabase.from('messages').update({ likes: newLikes }).eq('id', id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !supabase || !session) return;

    const emailPrefix = session.user.email?.split('@')[0] || '익명';
    const theme = getAvatarTheme(emailPrefix);

    const newMessage: Omit<Message, 'id' | 'created_at'> = {
      user_id: session.user.id,
      name: emailPrefix,
      avatar_url: `https://ui-avatars.com/api/?name=${emailPrefix}&background=${theme.bg}&color=${theme.text}&bold=true`,
      content: inputValue.trim(),
      likes: 0,
    };

    setInputValue('');

    const { data, error } = await supabase
      .from('messages')
      .insert([newMessage])
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => {
        if (prev.find((msg) => msg.id === data.id)) return prev;
        return [data, ...prev];
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isAuthLoading) {
    return <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-700 rounded-full animate-spin" />
    </div>;
  }

  // --- 로그인 화면 ---
  if (!session) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-[#FDFDFD] flex flex-col relative border-x border-gray-100 overflow-hidden">
        {/* 상단 헤더 */}
        <header className="absolute top-0 w-full flex items-center px-6 pt-8 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100/50">
              <GraduationCap size={18} strokeWidth={2.5} />
            </div>
            <h1 className="font-bold text-lg text-emerald-950 tracking-tight">대구대 방명록</h1>
          </div>
        </header>

        {/* 배경 꾸밈 요소 (대구대 메인 컬러인 그린/블루 톤을 고급스럽게 변형) */}
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-teal-50/60 rounded-full blur-3xl pointer-events-none" />

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
      </div>
    );
  }

  const emailPrefix = session.user.email?.split('@')[0] || '익명';

  // --- 메인 화면 ---
  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#FDFDFD] flex flex-col relative shadow-2xl border-x border-gray-100 overflow-x-hidden">
      
      {/* 배경 꾸밈 요소 */}
      <div className="absolute top-[-5%] left-[-10%] w-72 h-72 bg-emerald-50/60 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
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

      {/* Greeting */}
      <div className="px-6 pt-6 pb-8 text-center z-10">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-3 flex items-center justify-center gap-2">
          안녕하세요, <span className="bg-emerald-100/70 text-emerald-800 px-3 py-0.5 rounded-full text-xl shadow-sm border border-emerald-200/50">{emailPrefix}</span> 님!
        </h2>
        <p className="text-gray-500 text-[15px]">오늘 학과 학우들에게 남기고 싶은 말이 있나요?</p>
      </div>

      {/* Pill Tabs */}
      <div className="px-6 flex justify-center z-10 mb-6">
        <div className="bg-gray-100/80 backdrop-blur p-1 rounded-full flex gap-1 shadow-inner border border-gray-200/50">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "px-6 py-2.5 rounded-full text-[14px] font-bold transition-all duration-300",
              activeTab === 'all' 
                ? "bg-white text-emerald-900 shadow-sm" 
                : "text-gray-500 hover:text-emerald-700"
            )}
          >
            전체 글
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={cn(
              "px-6 py-2.5 rounded-full text-[14px] font-bold transition-all duration-300",
              activeTab === 'my' 
                ? "bg-white text-emerald-900 shadow-sm" 
                : "text-gray-500 hover:text-emerald-700"
            )}
          >
            내 글
          </button>
        </div>
      </div>

      {/* Feed */}
      <main className="flex-1 px-5 pb-32 space-y-4 z-10">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-emerald-100 border-t-emerald-700 rounded-full animate-spin"></div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-300">
              <Sparkles size={24} />
            </div>
            <p>아직 작성된 글이 없습니다.</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const hasLiked = likedMessageIds.has(msg.id);
            const theme = getAvatarTheme(msg.name);
            return (
              <div
                key={msg.id}
                className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-gray-100/80 animate-in transition-transform hover:-translate-y-1 duration-300"
              >
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex gap-3 items-center">
                    <img
                      src={`https://ui-avatars.com/api/?name=${msg.name}&background=${theme.bg}&color=${theme.text}&bold=true`}
                      alt={msg.name}
                      className="w-10 h-10 rounded-full bg-gray-50 object-cover border border-gray-100"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900 text-[15px]">{msg.name}</h3>
                    </div>
                  </div>
                  <p className="text-[11px] font-medium text-gray-400 mt-1">
                    {format(new Date(msg.created_at), 'M월 d일 a h:mm')}
                  </p>
                </div>
                
                <p className="text-gray-700 text-[15px] leading-relaxed mb-4 pl-13 pr-2 whitespace-pre-wrap">
                  {msg.content}
                </p>
                
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => handleLike(msg.id, msg.likes)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-[13px] font-bold border",
                      hasLiked
                        ? "bg-red-50 text-red-500 border-red-100 shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100"
                    )}
                  >
                    <Heart
                      size={14}
                      className={cn(hasLiked && "fill-current")}
                      strokeWidth={hasLiked ? 2 : 2.5}
                    />
                    {msg.likes > 0 && <span>{msg.likes}</span>}
                  </button>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Sticky Bottom Input */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto w-full z-40 bg-gradient-to-t from-[#FDFDFD] via-[#FDFDFD] to-transparent pt-12 pb-safe">
        <div className="px-5 pb-5">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 bg-white border border-gray-200/80 p-2 pl-5 rounded-full shadow-[0_10px_40px_rgba(4,47,46,0.06)] backdrop-blur-md"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="메시지를 남겨주세요 (최대 200자)"
              className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-gray-400 min-w-0 font-medium"
              maxLength={200}
            />
            <span className="text-[11px] font-medium text-gray-300 mr-1 whitespace-nowrap">
              {inputValue.length}/200
            </span>
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-emerald-800 text-white w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 disabled:bg-gray-200 disabled:text-gray-400 transition-all hover:bg-emerald-900 hover:shadow-md active:scale-95"
            >
              <Send size={18} className="ml-0.5" strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
