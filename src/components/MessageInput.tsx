'use client';
import React, { useState } from 'react';
import { Send } from 'lucide-react';

type MessageInputProps = {
  onSubmit: (content: string) => Promise<void>;
};

export function MessageInput({ onSubmit }: MessageInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const content = inputValue.trim();
    setInputValue('');
    await onSubmit(content);
  };

  return (
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
  );
}
