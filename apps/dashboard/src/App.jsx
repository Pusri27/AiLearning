import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import BlogFeed from './pages/BlogFeed';
import WritePost from './pages/WritePost';
import MyCourses from './pages/MyCourses';
import CourseDetail from './pages/CourseDetail';
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
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherCourses from './pages/TeacherCourses';
import TeacherStudents from './pages/TeacherStudents';
import TeacherAnalytics from './pages/TeacherAnalytics';
import TeacherActivity from './pages/TeacherActivity';
import TeacherCreateCourse from './pages/TeacherCreateCourse';
import AIAssistant from './components/AIAssistant';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/blog" element={<BlogFeed />} />
        <Route path="/write" element={<WritePost />} />
        <Route path="/courses" element={<MyCourses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/help" element={<Help />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/study" element={<StudySpace />} />
        <Route path="/challenge" element={<DailyChallenge />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/courses" element={<TeacherCourses />} />
        <Route path="/teacher/students" element={<TeacherStudents />} />
        <Route path="/teacher/analytics" element={<TeacherAnalytics />} />
        <Route path="/teacher/activity" element={<TeacherActivity />} />
        <Route path="/teacher/courses/create" element={<TeacherCreateCourse />} />
      </Routes>
      <AIAssistant />
    </Router>
  );
}

export default App;
