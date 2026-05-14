import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';

const StudySpace = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-surface-bright text-on-surface font-body-md flex flex-col lg:flex-row overflow-hidden h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col bg-background p-8 overflow-y-auto gap-8 h-full">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="font-headline-xl text-on-surface">Study Space</h1>
            <p className="font-body-lg text-on-surface-variant">Focus tools, ambient sounds, and daily challenges for your deep learning sessions.</p>
          </div>
            <div className="flex items-center gap-4">
              <button className="material-symbols-outlined p-2 border-2 border-on-surface bg-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg">
                notifications
              </button>
              <ProfileDropdown />
            </div>
          </header>

        {/* Top Row: Player & Planner & Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Player Card */}
          <div className="lg:col-span-4 bg-surface-container-lowest border-2 border-on-surface rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-md text-on-surface">Study Tunes</h3>
              <span className="material-symbols-outlined text-on-surface">music_note</span>
            </div>
            <div className="flex flex-col gap-6 items-center">
              {/* Album Art */}
              <div className="w-full aspect-square bg-center bg-no-repeat bg-cover rounded-xl border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBnldYtmxZ_edZc09TwQtk3Bd0Bd0XcfFF-E3k44uQAPkvO2aMORmkgrbTFUkp-l_KgdFAsSaNWsJQRQd_xfHWHMBSjWRYUOIkzPIkO4URAij34YrVjOBd2HoHV8L1tp9-arRY_5IdS7M4FbeFjMWJd_fhpbdJJZqq1ltLUm18qtB0XSgRq25cry3sJEDaCj65_YZh3P5rlrFsFO2CXwECeiUD_-w105L04kFqdN1g929U2LrWaN4cqQzaEDzI5tJeBqWuNcK4pp4o")'}}></div>
              {/* Track Details & Controls */}
              <div className="flex flex-col justify-center w-full gap-4">
                <div className="flex flex-col text-center">
                  <span className="text-xs font-label-bold text-on-surface-variant uppercase tracking-widest">Now Playing</span>
                  <h2 className="font-headline-md text-on-surface truncate">Midnight Library Session</h2>
                  <p className="font-body-md text-secondary">Lo-fi Beats Academy</p>
                </div>
                {/* Progress Bar */}
                <div className="flex flex-col gap-2 w-full">
                  <div className="h-4 w-full bg-surface-container border-2 border-on-surface rounded-full overflow-hidden relative">
                    <div className="h-full bg-primary-container absolute left-0 top-0 border-r-2 border-on-surface" style={{width: '45%'}}></div>
                  </div>
                  <div className="flex justify-between font-label-bold text-xs text-on-surface-variant">
                    <span>02:15</span>
                    <span>05:00</span>
                  </div>
                </div>
                {/* Transport Controls */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  <button className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container text-on-surface border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <span className="material-symbols-outlined">skip_previous</span>
                  </button>
                  <button className="flex items-center justify-center w-14 h-14 rounded-full bg-primary-container text-on-primary-container border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <span className="material-symbols-outlined text-2xl">play_arrow</span>
                  </button>
                  <button className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container text-on-surface border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <span className="material-symbols-outlined">skip_next</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
 
          {/* AI Study Planner & Tasks */}
          <div className="lg:col-span-4 bg-tertiary-fixed border-2 border-on-surface rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-md text-on-tertiary-fixed">AI Study Planner</h3>
              <span className="material-symbols-outlined text-on-tertiary-fixed">smart_toy</span>
            </div>
            <div className="flex flex-col gap-4">
              <p className="font-body-md text-on-tertiary-fixed-variant">Based on your goals, here is your optimized schedule for today.</p>
              <ul className="flex flex-col gap-3">
                <li className="flex items-center gap-3 bg-surface-container-lowest border-2 border-on-surface p-3 rounded-lg">
                  <input className="w-5 h-5 rounded border-2 border-on-surface text-tertiary focus:ring-0 cursor-pointer" type="checkbox" defaultChecked />
                  <span className="font-label-bold text-on-surface line-through decoration-2">Review Calculus Ch 4</span>
                  <span className="ml-auto text-xs font-bold text-tertiary">Done</span>
                </li>
                <li className="flex items-center gap-3 bg-surface-container-lowest border-2 border-on-surface p-3 rounded-lg">
                  <input className="w-5 h-5 rounded border-2 border-on-surface text-tertiary focus:ring-0 cursor-pointer" type="checkbox"/>
                  <span className="font-label-bold text-on-surface">Read History Essay</span>
                  <span className="ml-auto text-xs font-bold text-on-surface-variant">45 min</span>
                </li>
                <li className="flex items-center gap-3 bg-surface-container-lowest border-2 border-on-surface p-3 rounded-lg">
                  <input className="w-5 h-5 rounded border-2 border-on-surface text-tertiary focus:ring-0 cursor-pointer" type="checkbox"/>
                  <span className="font-label-bold text-on-surface">Physics Lab Report</span>
                  <span className="ml-auto text-xs font-bold text-on-surface-variant">1 hr</span>
                </li>
              </ul>
              <div className="flex gap-2 mt-auto pt-2">
                <input className="flex-1 rounded-lg h-10 border-2 border-on-surface bg-surface-container-lowest px-3 font-body-md focus:outline-none focus:ring-0" placeholder="Add a quick task..."/>
                <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-on-surface text-surface-container-lowest font-label-bold border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                  Add
                </button>
              </div>
            </div>
          </div>
 
          {/* Pomodoro & Challenge Widgets */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-secondary-fixed border-2 border-on-surface rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col justify-between gap-6 flex-1">
              <div className="flex justify-between items-center">
                <h3 className="font-headline-md text-on-secondary-fixed">Study Session</h3>
                <span className="material-symbols-outlined text-on-secondary-fixed">timer</span>
              </div>
              <div className="flex justify-center py-4">
                <div className="font-headline-xl text-[72px] leading-none text-on-secondary-fixed font-black tracking-tighter">
                  25:00
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex gap-2 p-1 bg-surface-container-lowest border-2 border-on-surface rounded-lg">
                  <button className="flex-1 py-2 rounded-md bg-secondary-container text-on-secondary-container font-label-bold border-2 border-on-surface">Focus</button>
                  <button className="flex-1 py-2 rounded-md text-on-surface hover:bg-surface-container font-label-bold transition-colors">Break</button>
                </div>
                <button className="w-full py-4 bg-primary-container text-on-primary-container font-headline-md rounded-lg border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all">
                  START
                </button>
              </div>
            </div>
 
            <div className="bg-primary-container border-2 border-on-surface rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="font-headline-md text-on-primary-container">Daily Quiz</h3>
                <span className="material-symbols-outlined text-on-primary-container">lightbulb</span>
              </div>
              <p className="font-body-md text-on-primary-fixed-variant">Test your knowledge and earn a streak!</p>
              <button 
                onClick={() => navigate('/challenge')}
                className="w-full py-3 bg-surface-container-lowest text-on-surface font-label-bold rounded-lg border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all mt-2 flex items-center justify-center gap-2"
              >
                <span>Start Challenge</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Playlists Section */}
        <div className="flex flex-col gap-6 pt-4">
          <h2 className="font-headline-lg text-on-surface">Explore Moods</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Deep Focus', color: 'bg-primary-container', text: 'Binaural beats and soft drones to wire your brain for deep work.', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSPpgy-8sd2tIzGVKwihD1pYu4D781cUJHeh4HxR83zBCIBciW-cnJkqclEIWLr6wKcjJvo7txfqge8jZ1bsKu4FwQtS4keSP3-2jvS8UcOtugnoN675wYqLtydF40zKB14ApWxgdoSqY2K6RSDk0SegxXvLq6v-fJcAKzRQixlrHbOvsS1Mj-6wH_cQhgBqB5hMX8tCdQslTuaI0HYAkxhyuIfnghuIgHjpcbDsY34bnwftOgjdnD_POikMjQjpuYABTHxdYQ6JE' },
              { title: 'Lo-fi Beats', color: 'bg-secondary-fixed', text: 'Chill, rhythmic loops to keep your momentum going steadily.', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYYZCHqL8fzuTG9xyMxJK5pdf6osIGvgWterEVSuKDoCom8s9nQXId2iDI3PhESKUGcHITkQSgdB431LR8t40u-CSWohqXOXQzoDKmvP-ldfzPvARZwONc4OS9EnJFZUusM8y241XWtrhO0ta1Zo0wPeObcF0HKScGqi5n6ag4WkDBec1GJVe9FEjnCUJSz7Bj8nfB0OYMZ4iAsm9MPux1RtZ81qelnjLpR4Zb8LSs7XPBINW2kmX5VwdHFqa8E0Dw70f0CFa9n1Q' },
              { title: 'Classical Study', color: 'bg-tertiary-fixed', text: 'Timeless piano and strings for reading and complex problem solving.', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCalYpKNY_3a2rIXGmLOzXCcAIpr6IWiD_kHbymwwivT-qJPS64QolvVOoDRLLiiscyl-tHnJa1_umuXokxl7FlvALKphRS9wncgBRfR_-s_FtM42gXFXnnjS6b8RUoF7S0MSXTAv0NgfCteiMfg-0G-Kz6h-PJ9xKaGow2s4_gPeY4eer1M7Ve2033QlWtfQ8t-Ny3s02tdFzm8dvDWSiLRAu5K58w9npYdavW-JTrhoK9ponPsp5cWK4l6XW6jXxA1sBR5KmRX28' },
              { title: 'Nature Ambient', color: 'bg-surface-container-high', text: 'Rain, forest sounds, and ocean waves to block out distractions.', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6buIArVOc6dPYmWaPWW7bMc5cWHkCo7n7BFYc8HpV1315aWfoRQjcaw9TVep5BYWnACLYAcj647e7nLJ_PK54_BMQ6jv2YAESEQH-13eG5mwcRac7X_ZiDGhkBbaUcb82COGmhfOcWP7LvmUDIBt-V2NsHzWrH_xgPX13gEsLkYdU4c7ZvIBjm3P_R4Pn8xDdVEywAL1Wqj9eUwFd4ldlz6KqVbSV8zi421n6a8tra1UhrgLSet3CG4lnDVZ3zbBTRV6HUiC3C54' }
            ].map((mood, idx) => (
              <div key={idx} className={`${mood.color} border-2 border-on-surface rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex flex-col gap-4`}>
                <div className="h-32 bg-surface-container-lowest border-2 border-on-surface rounded-lg bg-cover bg-center" style={{backgroundImage: `url("${mood.img}")`}}></div>
                <div className="flex flex-col">
                  <h3 className="font-headline-md text-on-surface">{mood.title}</h3>
                  <p className="font-body-md text-on-surface-variant">{mood.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudySpace;
