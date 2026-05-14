import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProfileDropdown from '../components/ProfileDropdown';

const MyCourses = () => {
  const navigate = useNavigate();

  const courses = [
    {
      id: 1,
      title: "Mekanika Kuantum Lanjutan",
      instructor: "Dr. Yohanes Surya",
      category: "Sains",
      progress: 65,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnlipmZbSCj3X6I5jxxEjCm362d9IuretC2rx3x61EG4uCWUpHXHp643kBoGNlcmM22hn2A5TStUIToKCYpvd-38nRzM3D0Bvwfrthht8QpGSOM2lXitMXkoTvHLotOiW783rENgf-Ro4bJP-L8-3jVcULKyG2oKTdubbxz1W1U9LS922ZatGSJRX6HLQ_R34oSGZETN-dOGUu8xjSzh987h3rac-3txjulwRx2cUEVvqDaF7elbCxmoTQUZdni-DPhC9Bjr9OvPQ"
    },
    {
      id: 2,
      title: "Desain UI/UX Dasar",
      instructor: "Siska Pratiwi",
      category: "Desain",
      progress: 30,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmJPHL75zneOJNQ6HzMNDd7SH1y6y8N1-CTpRFbwJiOSNcZHM9xfGklMV8B7aQIDBeKP551kjFJxp3dXnC78l2fDcFUFrDfP36jCAkGdC0WLy1dnvXtFktkMpZhYVlo4d9gW1NcI89VXv8hdogqoB00rMGo4wE0eJgrzw9xuhEuNKIfVeAzy51RHjzosI30DHEryC0nqcMbL8N6Pwj1NHFt0jUDXsZaCVKevLj2P44FKWx7LTLvriB6uZmyv6MTLLjFbXkMjQw2O0"
    },
    {
      id: 3,
      title: "Fundamental Web Dev",
      instructor: "Rudi Heryanto",
      category: "Teknologi",
      progress: 90,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAt6-Oaj4-__reB0sYijTIVtP42pHrzU28qjit7eTeNBZFezesAymrnIqqrTay0ylpvDn_ykAJMeBAF5mv4WyhBKBsXjfMGu-Nvd0kpzVl8s-_I7J8Lm8nQuoOLcaJFRQIsdxcqqqi2cG7if4LpJW_ihk7BdgX4nWiPPlCoGk6l28FXnTdOgyInft26S9eRsyqgMQTRyI5EvVBOaX2s0ywCL0CzPnxEaQV8wJGXY0FhqHYV0v6o_ioLZz7qH2MfuwxHzdjMo11zPU"
    }
  ];

  return (
    <div className="bg-surface text-on-surface font-body-md flex h-screen overflow-hidden">
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-grow overflow-hidden">
        {/* TopAppBar */}
        <header className="bg-surface flex justify-between items-center w-full px-gutter h-16 sticky top-0 z-40 border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="md:hidden">
            <h1 className="font-headline-md text-headline-md font-extrabold text-primary tracking-tight">Lumina Learning</h1>
          </div>
          <div className="hidden md:flex items-center flex-grow max-w-md mx-4">
            <div className="flex w-full bg-white brutal-border rounded-full items-center px-4 py-2 brutal-shadow-sm focus-within:border-primary focus-within:border-4 transition-all">
              <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
              <input className="w-full bg-transparent border-none focus:ring-0 font-body-md text-body-md p-0" placeholder="Cari materi, tugas..." type="text"/>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined p-2 border-2 border-on-surface bg-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg">
              notifications
            </button>
            <ProfileDropdown />
          </div>
        </header>

        {/* Page Canvas */}
        <main className="flex-grow p-4 md:p-gutter overflow-y-auto bg-surface-bright">
          <div className="max-w-container-max mx-auto w-full">
            <div className="mb-8">
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Kursus Saya</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">Lanjutkan perjalanan belajarmu hari ini.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
              {/* Left Column: Courses */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
                  <button className="bg-primary-container text-on-primary-container font-label-bold text-label-bold brutal-border rounded-full px-6 py-2 brutal-shadow whitespace-nowrap">Semua Kursus</button>
                  <button className="bg-white text-on-surface-variant font-label-bold text-label-bold brutal-border rounded-full px-6 py-2 hover:bg-surface-variant transition-colors whitespace-nowrap">Sedang Berjalan</button>
                  <button className="bg-white text-on-surface-variant font-label-bold text-label-bold brutal-border rounded-full px-6 py-2 hover:bg-surface-variant transition-colors whitespace-nowrap">Selesai</button>
                </div>

                <div className="flex flex-col gap-6">
                  {courses.map(course => (
                    <div key={course.id} className="bg-white brutal-border rounded-xl p-4 flex flex-col md:flex-row gap-6 brutal-shadow hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                      <div className="w-full md:w-1/3 aspect-video md:aspect-square lg:aspect-video rounded-lg brutal-border overflow-hidden relative">
                        <div className="absolute top-2 left-2 bg-secondary-container text-on-secondary-container font-label-bold text-[12px] px-2 py-1 rounded-md brutal-border z-10">{course.category}</div>
                        <img alt={course.title} className="w-full h-full object-cover" src={course.image}/>
                      </div>
                      <div className="w-full md:w-2/3 flex flex-col justify-between">
                        <div>
                          <h3 className="font-headline-md text-headline-md text-on-surface mb-1">{course.title}</h3>
                          <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">person</span>
                            {course.instructor}
                          </p>
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between items-end mb-2">
                            <span className="font-label-bold text-label-bold text-on-surface-variant">Progress</span>
                            <span className="font-label-bold text-label-bold text-primary">{course.progress}%</span>
                          </div>
                          <div className="h-4 w-full bg-white brutal-border rounded-full overflow-hidden p-[2px]">
                            <div className="h-full bg-primary" style={{ width: `${course.progress}%` }}></div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button 
                            onClick={() => navigate(`/courses/${course.id}`)}
                            className="bg-primary text-on-primary font-label-bold text-label-bold px-6 py-2 rounded-lg brutal-border brutal-shadow-sm hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all"
                          >
                            Lanjutkan Belajar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Sidebar Widgets */}
              <div className="lg:col-span-4 flex flex-col gap-6 mt-8 lg:mt-0">
                <div className="bg-secondary-fixed text-on-secondary-fixed brutal-border rounded-xl p-6 brutal-shadow">
                  <h3 className="font-headline-md text-headline-md mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined fill text-secondary">local_fire_department</span>
                    Statistik Belajar
                  </h3>
                  <div className="bg-white brutal-border rounded-lg p-4 mb-4">
                    <p className="font-body-md text-body-md text-on-surface-variant mb-1">Minggu Ini</p>
                    <p className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-black">12 Jam <span className="text-lg text-on-surface">30 Menit</span></p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white brutal-border rounded-lg p-3 text-center">
                      <span className="material-symbols-outlined text-tertiary text-3xl mb-1">workspace_premium</span>
                      <p className="font-label-bold text-label-bold text-on-surface">5 Badges</p>
                    </div>
                    <div className="bg-white brutal-border rounded-lg p-3 text-center">
                      <span className="material-symbols-outlined text-error text-3xl mb-1">bolt</span>
                      <p className="font-label-bold text-label-bold text-on-surface">7 Hari Streak!</p>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-low brutal-border rounded-xl p-6 brutal-shadow">
                  <h3 className="font-headline-md text-headline-md mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">lightbulb</span>
                    Rekomendasi
                  </h3>
                  <div className="flex flex-col gap-4">
                    <a className="flex gap-4 group" href="#">
                      <div className="w-16 h-16 rounded brutal-border overflow-hidden flex-shrink-0">
                        <img alt="Robotika" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_G4qtwsz7pMSz3O_JQCgxDxJxtXs4aa_OnLx39PyQPGB4s3m5AS7sgXbw3p_dAm2UdK36MaIcN8aA-PAcIb937veiIrDI0dql1UFb5SXzr5QMgRQ-wurETrM7BXXl0IFlZahBgtdCx65xmAwlclEpEfDDwMohBUhpDpycvku6hZEfu5DxAd-Tlhs8BGClgusznvpzYh9RCQC5Yu4bHijxiO20YjQej0ixRIBet-vljpsHlK6j9hQHQPhch77pKmzIM6izatZkR5Y"/>
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="font-label-bold text-label-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2">Pengantar Robotika Modern</p>
                        <p className="font-body-md text-body-md text-sm text-on-surface-variant">Sains • 4.8 <span className="text-primary text-xs">★</span></p>
                      </div>
                    </a>
                    <div className="border-t-2 border-on-surface-variant/20"></div>
                    <a className="flex gap-4 group" href="#">
                      <div className="w-16 h-16 rounded brutal-border overflow-hidden flex-shrink-0 bg-tertiary-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-tertiary-container text-3xl">brush</span>
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="font-label-bold text-label-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2">Ilustrasi Digital Tingkat Lanjut</p>
                        <p className="font-body-md text-body-md text-sm text-on-surface-variant">Desain • 4.9 <span className="text-primary text-xs">★</span></p>
                      </div>
                    </a>
                  </div>
                  <button className="w-full mt-6 bg-transparent border-2 border-primary text-primary font-label-bold text-label-bold py-2 rounded-lg hover:bg-primary-container transition-colors">Lihat Semua</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-surface border-t-2 border-on-surface z-50 flex justify-around items-center h-16 px-2 pb-safe">
        <NavLink to="/" className="flex flex-col items-center justify-center w-16 h-full text-on-surface-variant">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-label-bold mt-1">Dashboard</span>
        </NavLink>
        <a className="flex flex-col items-center justify-center w-16 h-full text-on-surface-variant" href="#">
          <span className="material-symbols-outlined">explore</span>
          <span className="text-[10px] font-label-bold mt-1">Catalog</span>
        </a>
        <NavLink to="/courses" className="flex flex-col items-center justify-center w-16 h-full bg-primary-container text-on-primary-container border-2 border-on-surface rounded-t-xl -mt-2 shadow-[0px_-2px_0px_0px_rgba(0,0,0,1)]">
          <span className="material-symbols-outlined fill">school</span>
          <span className="text-[10px] font-label-bold mt-1">Kursus</span>
        </NavLink>
        <a className="flex flex-col items-center justify-center w-16 h-full text-on-surface-variant" href="#">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-label-bold mt-1">Profil</span>
        </a>
      </nav>
    </div>
  );
};

export default MyCourses;
