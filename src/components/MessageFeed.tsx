'use client';
import { Heart, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { cn, getAvatarTheme } from '@/lib/utils';
import { Message } from '@/lib/types';

type MessageFeedProps = {
  messages: Message[];
  isLoading: boolean;
  likedMessageIds: Set<string>;
  onLike: (id: string, currentLikes: number) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
};

export function MessageFeed({ messages, isLoading, likedMessageIds, onLike, messagesEndRef }: MessageFeedProps) {
  return (
    <main className="flex-1 px-5 pb-32 space-y-4 z-10">
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-emerald-100 border-t-emerald-700 rounded-full animate-spin"></div>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-20 text-gray-400 flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-300">
            <Sparkles size={24} />
          </div>
          <p>아직 작성된 글이 없습니다.</p>
        </div>
      ) : (
        messages.map((msg) => {
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
                  onClick={() => onLike(msg.id, msg.likes)}
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
  );
}
