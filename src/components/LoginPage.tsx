import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { StudentRegistration } from './StudentRegistration';
import { projectId, publicAnonKey } from '../utils/supabase/info';

type User = {
  id?: string;
  role: 'student' | 'librarian';
  accessToken?: string;
  email?: string;
};

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [loginData, setLoginData] = useState({
    identifier: '',
    password: ''
  });
  const [librarianData, setLibrarianData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-374bb1bc/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(loginData)
      });

      const result = await response.json();

      if (result.success) {
        onLogin({
          id: result.user.id,
          role: 'student',
          accessToken: result.accessToken,
          email: result.user.email
        });
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }

    setLoading(false);
  };

  const handleLibrarianLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-374bb1bc/librarian-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(librarianData)
      });

      const result = await response.json();

      if (result.success) {
        onLogin({
          role: 'librarian',
          email: result.email
        });
      } else {
        setError(result.error || 'Invalid librarian credentials');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }

    setLoading(false);
  };

  const handleRegistrationSuccess = (user: User) => {
    onLogin(user);
  };

  if (showRegistration) {
    return (
      <StudentRegistration 
        onSuccess={handleRegistrationSuccess}
        onBack={() => setShowRegistration(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            BVDUET Library System
          </h1>
          <p className="text-gray-600">
            Welcome to the college library management system
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login to Your Account</CardTitle>
            <CardDescription>
              Access your library account or admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="student" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="student">Student</TabsTrigger>
                <TabsTrigger value="librarian">Librarian</TabsTrigger>
              </TabsList>
              
              <TabsContent value="student">
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-identifier">
                      PRN Number / Email / Phone Number
                    </Label>
                    <Input
                      id="student-identifier"
                      type="text"
                      placeholder="Enter your PRN, email, or phone number"
                      value={loginData.identifier}
                      onChange={(e) => setLoginData(prev => ({
                        ...prev,
                        identifier: e.target.value
                      }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="student-password">Password</Label>
                    <Input
                      id="student-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({
                        ...prev,
                        password: e.target.value
                      }))}
                      required
                    />
                  </div>
                  
                  {error && (
                    <div className="text-red-600 text-sm">{error}</div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowRegistration(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      New student? Register here
                    </button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="librarian">
                <form onSubmit={handleLibrarianLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="librarian-email">Email</Label>
                    <Input
                      id="librarian-email"
                      type="email"
                      placeholder="Enter librarian email"
                      value={librarianData.email}
                      onChange={(e) => setLibrarianData(prev => ({
                        ...prev,
                        email: e.target.value
                      }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="librarian-password">Password</Label>
                    <Input
                      id="librarian-password"
                      type="password"
                      placeholder="Enter librarian password"
                      value={librarianData.password}
                      onChange={(e) => setLibrarianData(prev => ({
                        ...prev,
                        password: e.target.value
                      }))}
                      required
                    />
                  </div>
                  
                  {error && (
                    <div className="text-red-600 text-sm">{error}</div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In as Librarian'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}