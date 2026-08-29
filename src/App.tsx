import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth-context';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JoinPage from './pages/JoinPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import MemberLayout from './pages/MemberLayout';
import DashboardPage from './pages/DashboardPage';
import ProfilesPage from './pages/ProfilesPage';
import ProfileDetailPage from './pages/ProfileDetailPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import AccountPage from './pages/AccountPage';

import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminPortalPage from './pages/admin/AdminPortalPage';

function ProtectedMemberRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0d0e' }}>
        <div style={{ color: 'var(--primary-light)', fontWeight: 700 }}>Authenticating Membership...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Visitor Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/signup" element={<RegisterPage />} />
          <Route path="/join/:token" element={<JoinPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Secret Executive Console Routes */}
          <Route path="/likecrazy/login" element={<AdminLoginPage />} />
          <Route path="/likecrazy" element={<AdminPortalPage />} />
          <Route path="/likecrazy/*" element={<AdminPortalPage />} />

          {/* Member Protected Shell */}
          <Route
            element={
              <ProtectedMemberRoute>
                <MemberLayout />
              </ProtectedMemberRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profiles" element={<ProfilesPage />} />
            <Route path="/profile/:slug" element={<ProfileDetailPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
