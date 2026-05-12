import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  altText?: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, altText = "Full screen", onClose }) => {
  // Prevent scrolling on the body when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
      >
        <X size={24} />
      </button>
      <div 
         className="relative max-w-full max-h-full overflow-hidden flex items-center justify-center animate-in zoom-in-95 duration-200"
         onClick={(e) => e.stopPropagation()}
      >
          <img 
            src={imageUrl} 
            alt={altText} 
            className="max-w-full max-h-[90vh] object-contain select-none rounded-lg shadow-2xl"
          />
      </div>
    </div>
  );
};
