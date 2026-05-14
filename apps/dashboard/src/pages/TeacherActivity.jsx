import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileDropdown from '../components/ProfileDropdown';
import TeacherSidebar from '../components/TeacherSidebar';
import { supabase } from '../lib/supabaseClient';

const TeacherActivity = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'teacher') {
        navigate('/');
        return;
      }

      setUser({ ...session.user, full_name: profile.full_name });

      // Fetch Real Enrollments as Primary Activity
      const { data: teacherCourses } = await supabase
        .from('courses')
        .select('id, title')
        .eq('instructor_id', session.user.id);

      const courseIds = teacherCourses?.map(c => c.id) || [];
      
      if (courseIds.length > 0) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select(`
            id,
            enrolled_at,
            course:course_id (title),
            profile:user_id (full_name, email)
          `)
          .in('course_id', courseIds)
          .order('enrolled_at', { ascending: false });

        // Map real data to activity format
        const realActivities = enrollments?.map(e => ({
          id: e.id,
          type: 'Enrollment',
          user: e.profile?.full_name,
          target: e.course?.title,
          time: new Date(e.enrolled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          date: new Date(e.enrolled_at).toLocaleDateString('en-US', { weekday: 'long' }),
          timestamp: new Date(e.enrolled_at).getTime()
        })) || [];

        // Add Mock activities for UI demonstration
        const mockActivities = [
          {
            id: 'mock-1',
            type: 'Submission',
            user: 'Budi Santoso',
            target: 'Module 1: Design Systems',
            time: '09:15 AM',
            date: 'Today',
            file: 'Assignment_1_Final.fig',
            timestamp: Date.now() - 3600000
          },
          {
            id: 'mock-2',
            type: 'Discussion',
            user: 'Michael Chen',
            target: 'Web Typography',
            time: '08:30 AM',
            date: 'Today',
            content: "I'm having trouble deciding between geometric and humanist sans-serifs for the body text of my project.",
            timestamp: Date.now() - 7200000
          },
          {
            id: 'mock-3',
            type: 'AI Tutor Note',
            user: 'Lumina AI',
            target: 'Cohort A Progress',
            time: '4:20 PM',
            date: 'Yesterday',
            content: "3 students in Cohort A have failed the 'CSS Grid Layout' quiz multiple times. Consider unlocking supplemental video materials.",
            timestamp: Date.now() - 86400000
          }
        ];

        setActivities([...realActivities, ...mockActivities].sort((a, b) => b.timestamp - a.timestamp));
      }

      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  const filteredActivities = filter === 'All' 
    ? activities 
    : activities.filter(a => a.type.includes(filter));

  return (
    <div className="bg-surface font-sans text-on-surface min-h-screen antialiased flex">
      <TeacherSidebar user={user} />

      {/* Main Content */}
      <main className="flex-1 lg:ml-[280px] pt-20 lg:pt-10 pb-24 lg:pb-8 px-margin-mobile lg:px-margin-desktop w-full max-w-[1440px] mx-auto min-h-screen">
        {/* Page Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-2">Activity Feed</h1>
            <p className="text-lg text-on-surface-variant font-bold">Track recent student interactions and platform events.</p>
          </div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {['All', 'Submission', 'Enrollment'].map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-full font-black border-2 border-on-surface transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${filter === f ? 'bg-on-surface text-surface' : 'bg-white text-on-surface hover:bg-surface-variant'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Activity List */}
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-surface-container animate-pulse rounded-3xl border-2 border-on-surface"></div>)}
            </div>
          ) : filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <div 
                key={activity.id}
                className={`bg-white rounded-[32px] p-6 md:p-8 border-4 border-on-surface shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all relative overflow-hidden group`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-3 ${
                  activity.type === 'Enrollment' ? 'bg-primary-container' : 
                  activity.type === 'Submission' ? 'bg-secondary-container' : 
                  activity.type === 'Discussion' ? 'bg-tertiary-container' : 'bg-secondary'
                } border-r-2 border-on-surface`}></div>

                <div className="flex flex-col sm:flex-row gap-6 pl-2">
                  <div className="flex-shrink-0">
                    {activity.type === 'AI Tutor Note' ? (
                      <div className="w-14 h-14 rounded-2xl bg-secondary text-on-secondary flex items-center justify-center border-2 border-on-surface shadow-[4px_4px_0px_0px_#1c1b1b]">
                        <span className="material-symbols-outlined text-3xl font-black">smart_toy</span>
                      </div>
                    ) : (
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 border-on-surface shadow-[4px_4px_0px_0px_#1c1b1b] ${
                        activity.type === 'Enrollment' ? 'bg-primary-container text-on-primary-container' :
                        activity.type === 'Submission' ? 'bg-secondary-container text-on-secondary-container' :
                        'bg-tertiary-container text-on-tertiary-container'
                      }`}>
                        <span className="material-symbols-outlined text-3xl font-black">
                          {activity.type === 'Enrollment' ? 'person_add' : 
                           activity.type === 'Submission' ? 'task' : 'chat'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-black px-3 py-1 border-2 border-on-surface rounded-full uppercase tracking-widest ${
                        activity.type === 'AI Tutor Note' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-surface-variant text-on-surface-variant'
                      }`}>
                        {activity.type}
                      </span>
                      <span className="text-xs font-black text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm font-black">schedule</span> {activity.time}
                      </span>
                    </div>

                    <h4 className="text-xl text-on-surface mb-2 font-bold">
                      <span className="font-black underline decoration-primary decoration-4">{activity.user}</span> {
                        activity.type === 'Enrollment' ? 'enrolled in' :
                        activity.type === 'Submission' ? 'completed' :
                        activity.type === 'AI Tutor Note' ? 'identified a pattern' : 'posted in'
                      } <span className="font-black text-primary">{activity.target}</span>
                    </h4>

                    {activity.file && (
                      <div className="mt-4 p-4 rounded-2xl bg-surface-container-low border-2 border-on-surface flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-variant border-2 border-on-surface flex items-center justify-center">
                            <span className="material-symbols-outlined font-black">description</span>
                          </div>
                          <div>
                            <p className="font-black text-sm">{activity.file}</p>
                            <p className="text-[10px] font-black text-on-surface-variant uppercase">Submitted on time</p>
                          </div>
                        </div>
                        <button className="text-sm font-black text-secondary underline hover:text-primary transition-colors">Grade Now</button>
                      </div>
                    )}

                    {activity.content && (
                      <div className={`mt-2 p-4 rounded-2xl border-2 border-on-surface ${activity.type === 'AI Tutor Note' ? 'bg-secondary-container/30' : 'bg-surface-container'}`}>
                        <p className="text-sm font-bold italic text-on-surface-variant">"{activity.content}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 border-4 border-dashed border-on-surface rounded-[40px]">
              <p className="text-on-surface-variant font-black">Belum ada aktivitas di kategori ini.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherActivity;
