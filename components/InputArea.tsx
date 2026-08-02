import React, { useRef } from 'react';
import { Mic, Send, Square } from 'lucide-react';

interface InputAreaProps {
  onSend: (text: string) => void;
  onStop?: () => void;
  onStartLive: () => void;
  isLoading: boolean;
  voiceMode: boolean;
  value: string;
  onChange: (val: string) => void;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSend, onStop, onStartLive, isLoading, value, onChange }) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (value.trim() && !isLoading) {
      onSend(value);
      onChange('');
      // Force refocus immediately after sending
      setTimeout(() => {
          inputRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white border-t border-gray-100 p-4 pb-6 flex justify-center w-full">
      <div className="flex items-end gap-3 w-full max-w-4xl">
        
        {/* Live Mic Button */}
        <button 
            onClick={onStartLive}
            disabled={isLoading}
            className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0 text-gray-500"
            title="Use Voice"
        >
            <Mic size={20} />
        </button>
        {/* Text Input */}
        <div className="flex-1 bg-white rounded-[24px] border border-gray-200 focus-within:border-blue-400 focus-within:shadow-sm transition-all flex items-end overflow-hidden shadow-sm min-h-[48px]">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about locations, directions, or facilities..."
            className={`w-full bg-transparent border-none focus:ring-0 px-5 text-[16px] md:text-[15px] placeholder:text-[13px] text-gray-800 placeholder-gray-400 resize-none outline-none py-3 leading-tight ${isLoading ? 'opacity-70' : ''}`}
            rows={1}
            style={{ height: '48px', overflowY: 'auto' }}
          />
        </div>

        {/* Send / Stop Button */}
        {isLoading ? (
          <button
            onClick={onStop}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-colors shrink-0 bg-red-500 hover:bg-red-600 text-white shadow-sm"
            title="Stop Generation"
          >
            <Square size={16} className="fill-current" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!value.trim()}
            className={`
              w-11 h-11 rounded-full flex items-center justify-center transition-colors shrink-0
              ${!value.trim() 
                  ? 'bg-blue-300 cursor-not-allowed text-white/80' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm'}
            `}
            title="Send Message"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        )}
      </div>
    </div>
  );
};