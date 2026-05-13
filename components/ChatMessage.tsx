import React, { useMemo, useState } from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import { CAMPUS_DATA } from '../data/campusData';
import { ImageModal } from './ImageModal';
import { Map } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  locations?: CampusLocation[];
  onViewMap?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, locations = [], onViewMap }) => {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const isBot = message.role === 'bot';
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const locationImg = useMemo(() => {
     if (isBot && message.suggestedLocationId) {
         const loc = locations.find(l => l.id === message.suggestedLocationId) || CAMPUS_DATA.locations.find(l => l.id === message.suggestedLocationId);
         return loc?.imageUrl;
     }
     return null;
  }, [isBot, message.suggestedLocationId, locations]);

  return (
    <div className={`w-full mb-6 flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {/* Bot Avatar */}
      {isBot && (
        <img src="/logo.png" alt="Bot Avatar" className="w-8 h-8 rounded-full shadow-sm shrink-0 mt-1" />
      )}

      <div className={`max-w-[75%] flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
        
        {/* Message Bubble */}
        <div className={`
            px-4 py-3 rounded-2xl shadow-sm
            ${isBot 
                ? 'bg-[#f3f4f6] text-gray-800 rounded-tl-sm' 
                : 'bg-blue-600 text-white rounded-tr-sm'}
        `}>
          {locationImg && (
            <div 
               className="w-full h-36 mb-3 mt-1 rounded-lg overflow-hidden bg-gray-200 border border-gray-300/30 shadow-sm shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
               onClick={() => setIsImageOpen(true)}
            >
               <img src={locationImg} alt="Location reference" className="w-full h-full object-cover" />
            </div>
          )}
          <div className={`prose prose-sm ${!isBot && 'prose-invert'} max-w-none prose-p:leading-relaxed`}>
             <ReactMarkdown
               components={{
                 a: ({node, ...props}) => (
                   <a 
                     {...props} 
                     target="_blank"
                     rel="noopener noreferrer"
                     className="text-blue-600 font-medium no-underline border-b-2 border-blue-200/60 hover:border-blue-600 hover:text-blue-700 transition-all duration-300"
                   />
                 )
               }}
             >
               {message.content}
             </ReactMarkdown>
          </div>
        </div>

        {/* Timestamp */}
        <div className="mt-1 text-[11px] text-gray-400 font-medium px-1 flex items-center justify-between w-full">
          <span>{formattedTime}</span>
        </div>

        {/* Action Button for Map */}
        {isBot && message.suggestedLocationId && onViewMap && (
             <button 
                onClick={onViewMap}
                className="mt-2.5 flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-all w-fit border border-blue-200/50 shadow-sm hover:shadow active:scale-95"
             >
                 <Map className="w-3.5 h-3.5" strokeWidth={2.5} />
                 View on Map
             </button>
        )}

        {/* Grounding Info (Maps/Search) */}
        {isBot && message.groundingMetadata && (
             <div className="mt-2 flex flex-wrap gap-2">
                 {message.groundingMetadata.groundingChunks?.map((chunk: any, idx: number) => {
                     if (chunk.web?.uri) {
                         return (
                             <a 
                                key={idx} 
                                href={chunk.web.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white border border-gray-200 px-3 py-1 rounded-full text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                             >
                                 {chunk.web.title || 'Source'}
                             </a>
                         );
                     }
                     return null;
                 })}
             </div>
        )}
      </div>

      {/* User Avatar */}
      {!isBot && (
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
          <span className="text-[13px] font-bold">U</span>
        </div>
      )}

      {isImageOpen && locationImg && (
        <ImageModal 
          imageUrl={locationImg} 
          altText="Location reference" 
          onClose={() => setIsImageOpen(false)} 
        />
      )}
    </div>
  );
};