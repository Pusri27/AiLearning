import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Icon from '../components/Icon';

const DailyChallenge = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(null);

  return (
    <div className="bg-surface text-on-surface font-body-md flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Header for Challenge (Page specific) */}
        <header className="bg-surface border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center w-full px-10 h-16 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/study')}
              className="p-2 hover:bg-secondary-fixed-dim/20 rounded-full transition-all duration-200 text-on-surface-variant flex items-center justify-center border-2 border-transparent hover:border-on-surface"
            >
              <Icon name="close" className="w-6 h-6" />
            </button>
            <h1 className="font-headline-md text-headline-md font-extrabold text-primary tracking-tight">Challenge Mode</h1>
          </div>
        </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col items-center justify-center p-8 w-full max-w-3xl mx-auto">
        {/* Header & Progress */}
        <div className="w-full mb-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container font-label-sm text-label-sm rounded-full border-2 border-on-surface mb-2">
                Biologi Dasar
              </span>
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg text-on-surface">Tantangan Harian</h2>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Icon name="local_fire_department" className="w-6 h-6 text-[#765b00] fill-current" />
              <span className="font-label-md text-label-md">Hari ke-4</span>
            </div>
          </div>
          {/* Progress Tracker */}
          <div className="w-full h-3 bg-surface-variant rounded-full overflow-hidden border-2 border-on-surface">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{width: '60%'}}></div>
          </div>
          <p className="text-right font-label-sm text-label-sm text-on-surface-variant mt-2 font-bold">Soal 3 dari 5</p>
        </div>

        {/* Question Card */}
        <div className="w-full bg-surface-container-lowest border-2 border-on-surface rounded-xl p-6 md:p-8 mb-8 shadow-[4px_4px_0px_0px_rgba(28,27,27,1)] relative">
          {/* Decorative Bookmark */}
          <div className="absolute -top-4 -right-2 bg-primary text-on-primary p-2 rounded-lg border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(28,27,27,1)] rotate-12">
            <Icon name="star" className="w-5 h-5 fill-current" />
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface leading-snug">
            Pada tahap reaksi terang fotosintesis, energi cahaya matahari ditangkap oleh klorofil dan digunakan untuk proses memecah molekul air. Proses biokimia ini disebut sebagai...
          </h3>
        </div>

        {/* Options Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {[
            { id: 'A', label: 'Fiksasi Karbon', color: 'hover:bg-primary-container' },
            { id: 'B', label: 'Fotolisis Air', color: 'hover:bg-secondary-container' },
            { id: 'C', label: 'Siklus Calvin', color: 'hover:bg-tertiary-container' },
            { id: 'D', label: 'Respirasi Seluler', color: 'hover:bg-error-container' }
          ].map((option) => (
            <button 
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`w-full group bg-surface-container text-on-surface border-2 border-on-surface rounded-xl p-4 flex items-center gap-4 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] shadow-[4px_4px_0px_0px_rgba(28,27,27,1)] active:translate-x-0 active:translate-y-0 active:shadow-none focus:outline-none focus:ring-4 focus:ring-primary-container ${selectedOption === option.id ? 'bg-primary-container translate-x-[-2px] translate-y-[-2px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' : ''}`}
            >
              <span className={`w-10 h-10 shrink-0 rounded-lg border-2 border-on-surface bg-surface flex items-center justify-center font-label-md text-label-md group-hover:bg-primary-container transition-colors ${selectedOption === option.id ? 'bg-primary' : ''}`}>
                {option.id}
              </span>
              <span className="font-body-lg text-body-lg text-left font-bold">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Action Area */}
        <div className="w-full flex justify-end border-t-2 border-outline-variant pt-6">
          <button 
            onClick={() => navigate('/study')}
            className="bg-[#FF6B4A] text-white border-2 border-on-surface px-8 py-4 rounded-xl font-label-md text-label-md flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0 active:translate-y-0 active:shadow-none"
          >
            Kirim Jawaban
            <Icon name="arrow_forward" className="w-5 h-5" />
          </button>
        </div>
      </main>

      {/* Floating AI Tutor Button */}
      <button className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-secondary-container text-on-secondary-container border-2 border-on-surface rounded-full p-4 flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all z-50 group">
        <div className="relative flex items-center justify-center">
          <Icon name="psychology" className="w-7 h-7 fill-current" />
          <div className="absolute inset-0 bg-secondary blur-md opacity-30 rounded-full"></div>
        </div>
        <span className="font-label-md text-label-md pr-2 hidden md:block whitespace-nowrap overflow-hidden max-w-0 group-hover:max-w-[200px] transition-all duration-300 ease-in-out">
          Buntu? Tanya AI
        </span>
      </button>
      </div>
    </div>
  );
};

export default DailyChallenge;
