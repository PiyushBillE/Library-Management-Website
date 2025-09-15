import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { StudentDashboard } from './components/StudentDashboard';
import { LibrarianDashboard } from './components/LibrarianDashboard';
import { StudentManagement } from './components/StudentManagement';

type User = {
  id?: string;
  role: 'student' | 'librarian';
  accessToken?: string;
  email?: string;
};

type AppState = {
  currentUser: User | null;
  currentPage: 'login' | 'student-dashboard' | 'librarian-dashboard' | 'student-management';
};

export default function App() {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    currentPage: 'login'
  });

  const handleLogin = (user: User) => {
    setState({
      currentUser: user,
      currentPage: user.role === 'student' ? 'student-dashboard' : 'librarian-dashboard'
    });
  };

  const handleLogout = () => {
    setState({
      currentUser: null,
      currentPage: 'login'
    });
  };

  const navigateToStudentManagement = () => {
    setState(prev => ({
      ...prev,
      currentPage: 'student-management'
    }));
  };

  const navigateToDashboard = () => {
    setState(prev => ({
      ...prev,
      currentPage: prev.currentUser?.role === 'student' ? 'student-dashboard' : 'librarian-dashboard'
    }));
  };

  const renderCurrentPage = () => {
    switch (state.currentPage) {
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
      case 'student-dashboard':
        return (
          <StudentDashboard 
            user={state.currentUser!} 
            onLogout={handleLogout}
          />
        );
      case 'librarian-dashboard':
        return (
          <LibrarianDashboard 
            user={state.currentUser!}
            onLogout={handleLogout}
            onNavigateToStudentManagement={navigateToStudentManagement}
          />
        );
      case 'student-management':
        return (
          <StudentManagement 
            user={state.currentUser!}
            onLogout={handleLogout}
            onNavigateBack={navigateToDashboard}
          />
        );
      default:
        return <LoginPage onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderCurrentPage()}
    </div>
  );
}