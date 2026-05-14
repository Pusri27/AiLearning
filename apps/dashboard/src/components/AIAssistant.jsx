import React, { useState } from 'react';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end gap-4">
      {/* Chat Card */}
      {isOpen && (
        <div className="w-80 md:w-96 bg-on-surface text-white border-4 border-on-surface shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-primary p-4 border-b-2 border-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-white">smart_toy</span>
              <h3 className="font-headline-md text-white text-lg">Lumina AI</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="material-symbols-outlined hover:rotate-90 transition-transform">close</button>
          </div>
          
          <div className="h-96 overflow-y-auto p-4 space-y-4 font-body-md text-sm">
            <div className="bg-inverse-surface border-2 border-white p-3 self-start mr-8">
              <p>"Halo Felix! Saya Lumina AI, asisten belajarmu. Ada yang bisa saya bantu hari ini?"</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <p className="text-xs text-on-surface-variant font-label-bold uppercase">Saran Pertanyaan:</p>
              <button className="text-left p-2 border-2 border-white/20 hover:border-primary hover:bg-primary/20 transition-all text-xs">"Jelaskan tentang CSS Grid lagi"</button>
              <button className="text-left p-2 border-2 border-white/20 hover:border-primary hover:bg-primary/20 transition-all text-xs">"Berapa progres belajar saya?"</button>
            </div>
          </div>

          <div className="p-4 border-t-2 border-white flex gap-2">
            <input 
              type="text" 
              placeholder="Tanya sesuatu..." 
              className="flex-1 bg-transparent border-2 border-white/50 px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
            />
            <button className="bg-primary p-2 border-2 border-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)] transition-all active:scale-95">
              <span className="material-symbols-outlined text-white">send</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-primary border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-white hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-none group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        <span className="material-symbols-outlined text-4xl relative z-10 animate-bounce">smart_toy</span>
      </button>
    </div>
  );
};

export default AIAssistant;
