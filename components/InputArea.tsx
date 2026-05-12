import React, { useState, useRef } from 'react';
import { Mic, Send } from 'lucide-react';

interface InputAreaProps {
  onSend: (text: string) => void;
  onStartLive: () => void;
  isLoading: boolean;
  voiceMode: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSend, onStartLive, isLoading }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
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
      <div className="flex items-center gap-3 w-full max-w-4xl">
        
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
        <div className="flex-1 bg-white rounded-full border border-gray-200 focus-within:border-blue-400 focus-within:shadow-sm transition-all flex items-center overflow-hidden h-12 shadow-sm">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about locations, directions, or facilities..."
            className={`w-full bg-transparent border-none focus:ring-0 px-5 text-[16px] md:text-[15px] placeholder:text-[13px] text-gray-800 placeholder-gray-400 resize-none outline-none py-3 leading-tight ${isLoading ? 'opacity-70' : ''}`}
            rows={1}
            style={{ minHeight: '48px' }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className={`
            w-11 h-11 rounded-full flex items-center justify-center transition-colors shrink-0
            ${(!input.trim() || isLoading) 
                ? 'bg-blue-300 cursor-not-allowed text-white/80' 
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm'}
          `}
          title="Send Message"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
             <Send size={18} className="ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
};