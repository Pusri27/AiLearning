import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import BlogFeed from './pages/BlogFeed';
import BlogPost from './pages/BlogPost';
import WritePost from './pages/WritePost';
import MyCourses from './pages/MyCourses';
import CourseDetail from './pages/CourseDetail';
import CourseLesson from './pages/CourseLesson';
import Catalog from './pages/Catalog';
import Help from './pages/Help';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import StudySpace from './pages/StudySpace';
import DailyChallenge from './pages/DailyChallenge';
import Achievements from './pages/Achievements';
import Checkout from './pages/Checkout';
import Cart from './pages/Cart';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherCourses from './pages/TeacherCourses';
import TeacherStudents from './pages/TeacherStudents';
import TeacherAnalytics from './pages/TeacherAnalytics';
import TeacherActivity from './pages/TeacherActivity';
import TeacherCreateCourse from './pages/TeacherCreateCourse';
import TeacherSettings from './pages/TeacherSettings';
import Community from './pages/Community';
import CourseLearn from './pages/CourseLearn';
import AIAssistant from './components/AIAssistant';
import { MusicPlayerProvider } from './context/MusicPlayerContext';
import PersistentMusicPlayer from './components/PersistentMusicPlayer';
import { useUserProfile } from './context/UserProfileContext';

const AIAssistantWrapper = ({ session, isGuest, profile }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isCommunityPage = location.pathname === '/community';

  if ((session || isGuest) && !isAuthPage && !isCommunityPage) {
    return <AIAssistant userRole={profile.role} userName={profile.fullName} />;
  }
  return null;
};

// ── Centralized ProtectedRoute ────────────────────────────────────────────────
// Listens to onAuthStateChange at App level — when Supabase fires SIGNED_OUT,
// session becomes null and every protected route instantly redirects to /login.
const ProtectedRoute = ({ session, isGuest, loading, children }) => {
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!session && !isGuest) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// ── AppContent (needs to be inside <Router> to use useLocation) ───────────────
function AppContent() {
  const { profile } = useUserProfile();
  const isGuest = profile.isGuest;
  const location = useLocation();

  const [session, setSession] = useState(undefined); // undefined = not yet resolved
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
    });

    // React instantly to SIGNED_IN / SIGNED_OUT events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setSessionLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  // Shorthand: wrap a page in ProtectedRoute
  const P = (element) => (
    <ProtectedRoute session={session} isGuest={isGuest} loading={sessionLoading}>
      {element}
    </ProtectedRoute>
  );

  return (
    <>
      <Routes>
        {/* ── Protected routes ── */}
        <Route path="/"                         element={P(<Dashboard />)} />
        <Route path="/courses"                  element={P(<MyCourses />)} />
        <Route path="/courses/:id"              element={P(<CourseDetail />)} />
        <Route path="/courses/:courseId/learn/:lessonId" element={P(<CourseLesson />)} />
        <Route path="/courses/:id/learn"        element={P(<CourseLearn />)} />
        <Route path="/write"                    element={P(<WritePost />)} />
        <Route path="/edit-post/:id"            element={P(<WritePost />)} />
        <Route path="/settings"                 element={P(<Settings />)} />
        <Route path="/profile"                  element={P(<Profile />)} />
        <Route path="/study"                    element={P(<StudySpace />)} />
        <Route path="/challenge"                element={P(<DailyChallenge />)} />
        <Route path="/achievements"             element={P(<Achievements />)} />
        <Route path="/checkout"                 element={P(<Checkout />)} />
        <Route path="/cart"                     element={P(<Cart />)} />
        <Route path="/community"                element={P(<Community />)} />
        <Route path="/teacher/dashboard"        element={P(<TeacherDashboard />)} />
        <Route path="/teacher/courses"          element={P(<TeacherCourses />)} />
        <Route path="/teacher/students"         element={P(<TeacherStudents />)} />
        <Route path="/teacher/analytics"        element={P(<TeacherAnalytics />)} />
        <Route path="/teacher/activity"         element={P(<TeacherActivity />)} />
        <Route path="/teacher/settings"         element={P(<TeacherSettings />)} />
        <Route path="/teacher/courses/create"   element={P(<TeacherCreateCourse />)} />
        <Route path="/teacher/courses/edit/:id" element={P(<TeacherCreateCourse />)} />

        {/* ── Public routes ── */}
        <Route path="/pricing"  element={<Pricing />} />
        <Route path="/blog"     element={<BlogFeed />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        <Route path="/catalog"  element={<Catalog />} />
        <Route path="/help"     element={<Help />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/signup"   element={<SignUp />} />
      </Routes>

      <AIAssistantWrapper session={session} isGuest={isGuest} profile={profile} />
      <PersistentMusicPlayer />
    </>
  );
}

// ── App shell ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <MusicPlayerProvider>
      <Router>
        <AppContent />
      </Router>
    </MusicPlayerProvider>
  );
}

export default App;
