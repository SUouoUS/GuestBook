'use client';
import { cn } from '@/lib/utils';

type TabsProps = {
  activeTab: 'all' | 'my';
  onTabChange: (tab: 'all' | 'my') => void;
};

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="px-6 flex justify-center z-10 mb-6">
      <div className="bg-gray-100/80 backdrop-blur p-1 rounded-full flex gap-1 shadow-inner border border-gray-200/50">
        <button
          onClick={() => onTabChange('all')}
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
          onClick={() => onTabChange('my')}
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
  );
}
