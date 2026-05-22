'use client';
import React, { useState, useEffect, useRef } from 'react';
import { GraduationCap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Message } from '@/lib/types';
import { getAvatarTheme } from '@/lib/utils';
import { AuthForm } from '@/components/AuthForm';
import { Header } from '@/components/Header';
import { Tabs } from '@/components/Tabs';
import { MessageFeed } from '@/components/MessageFeed';
import { MessageInput } from '@/components/MessageInput';

export default function GuestbookPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedMessageIds, setLikedMessageIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      setIsLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setIsAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!session || !client) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await client
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
        (payload: any) => {
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
        (payload: any) => {
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

    const client = supabase;
    if (client) {
      await client.from('messages').update({ likes: newLikes }).eq('id', id);
    }
  };

  const handleSubmit = async (content: string) => {
    const client = supabase;
    if (!client || !session) return;

    const emailPrefix = session.user.email?.split('@')[0] || '익명';
    const theme = getAvatarTheme(emailPrefix);

    const newMessage: Omit<Message, 'id' | 'created_at'> = {
      user_id: session.user.id,
      name: emailPrefix,
      avatar_url: `https://ui-avatars.com/api/?name=${emailPrefix}&background=${theme.bg}&color=${theme.text}&bold=true`,
      content,
      likes: 0,
    };

    const { data, error } = await client
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
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-[#FDFDFD] flex flex-col relative border-x border-gray-100 overflow-hidden">
        <header className="absolute top-0 w-full flex items-center px-6 pt-8 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100/50">
              <GraduationCap size={18} strokeWidth={2.5} />
            </div>
            <h1 className="font-bold text-lg text-emerald-950 tracking-tight">대구대 방명록</h1>
          </div>
        </header>
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-teal-50/60 rounded-full blur-3xl pointer-events-none" />
        
        <AuthForm />
      </div>
    );
  }

  const emailPrefix = session.user.email?.split('@')[0] || '익명';
  const filteredMessages = messages.filter((msg) => {
    if (activeTab === 'my') return msg.user_id === session.user.id;
    return true;
  });

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#FDFDFD] flex flex-col relative shadow-2xl border-x border-gray-100 overflow-x-hidden">
      <div className="absolute top-[-5%] left-[-10%] w-72 h-72 bg-emerald-50/60 rounded-full blur-3xl pointer-events-none" />

      <Header />

      <div className="px-6 pt-6 pb-8 text-center z-10">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-3 flex items-center justify-center gap-2">
          안녕하세요, <span className="bg-emerald-100/70 text-emerald-800 px-3 py-0.5 rounded-full text-xl shadow-sm border border-emerald-200/50">{emailPrefix}</span> 님!
        </h2>
        <p className="text-gray-500 text-[15px]">오늘 학과 학우들에게 남기고 싶은 말이 있나요?</p>
      </div>

      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      <MessageFeed 
        messages={filteredMessages} 
        isLoading={isLoading} 
        likedMessageIds={likedMessageIds} 
        onLike={handleLike} 
        messagesEndRef={messagesEndRef} 
      />
      <MessageInput onSubmit={handleSubmit} />
    </div>
  );
}
