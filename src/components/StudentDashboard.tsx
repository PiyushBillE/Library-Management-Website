import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { User, BarChart3, LogOut, GraduationCap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { projectId, publicAnonKey } from '../utils/supabase/info';

type User = {
  id?: string;
  role: 'student' | 'librarian';
  accessToken?: string;
  email?: string;
};

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

interface StudentData {
  name: string;
  prn: string;
  libraryNumber: string;
  course: string;
  email: string;
  mobile: string;
  photoUrl?: string;
  admittedYear: string;
  rollNumber: string;
  gender: string;
  bloodGroup: string;
  category: string;
  dateOfBirth: string;
  parentMobile: string;
  permanentAddress: string;
  localAddress: string;
}

interface DashboardStats {
  totalStudents: number;
  courseDistribution: Record<string, number>;
}

export function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile'>('dashboard');
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
    fetchDashboardStats();
  }, []);

  const fetchStudentData = async () => {
    try {
      console.log('Fetching student data with token:', user.accessToken);
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-374bb1bc/student-profile`, {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`
        }
      });

      const result = await response.json();
      console.log('Student data response:', result);
      if (result.success) {
        setStudentData(result.student);
      } else {
        console.error('Failed to fetch student data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-374bb1bc/dashboard-stats`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setDashboardStats(result.stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
    setLoading(false);
  };

  const chartData = dashboardStats?.courseDistribution ? 
    Object.entries(dashboardStats.courseDistribution).map(([course, count]) => ({
      name: course,
      value: count,
      percentage: ((count / dashboardStats.totalStudents) * 100).toFixed(1)
    })) : [];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];

  const renderProfile = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            My Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentData && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={studentData.photoUrl} />
                  <AvatarFallback className="text-lg">
                    {studentData.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-semibold">{studentData.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      {studentData.libraryNumber}
                    </Badge>
                    <Badge variant="outline">{studentData.course}</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Personal Information */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>PRN Number</Label>
                    <p className="font-medium">{studentData.prn}</p>
                  </div>
                  <div>
                    <Label>Roll Number</Label>
                    <p className="font-medium">{studentData.rollNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <p className="font-medium">{studentData.gender}</p>
                  </div>
                  <div>
                    <Label>Blood Group</Label>
                    <p className="font-medium">{studentData.bloodGroup}</p>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <p className="font-medium">{studentData.category}</p>
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <p className="font-medium">
                      {studentData.dateOfBirth ? new Date(studentData.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Academic Information */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Academic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Course</Label>
                    <p className="font-medium">{studentData.course}</p>
                  </div>
                  <div>
                    <Label>Admitted Year</Label>
                    <p className="font-medium">{studentData.admittedYear}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <p className="font-medium">{studentData.email}</p>
                  </div>
                  <div>
                    <Label>Mobile Number</Label>
                    <p className="font-medium">{studentData.mobile}</p>
                  </div>
                  <div>
                    <Label>Parent Mobile</Label>
                    <p className="font-medium">{studentData.parentMobile || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Address Information */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Address Information</h4>
                <div className="space-y-4">
                  <div>
                    <Label>Permanent Address</Label>
                    <p className="font-medium">{studentData.permanentAddress || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label>Local Address</Label>
                    <p className="font-medium">{studentData.localAddress || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered in the library system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Course</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentData?.course || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              Your enrolled course
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Library Number</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentData?.libraryNumber || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              Your unique library ID
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Distribution</CardTitle>
          <CardDescription>
            Distribution of students across different courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant={currentView === 'dashboard' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setCurrentView('dashboard')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            
            <Button 
              variant={currentView === 'profile' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setCurrentView('profile')}
            >
              <User className="w-4 h-4 mr-2" />
              My Profile
            </Button>
            
            <h1 className="text-xl font-semibold">BVDUET Library System</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {studentData?.name || 'Student'}
            </span>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {currentView === 'profile' ? renderProfile() : renderDashboard()}
      </main>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium text-muted-foreground">{children}</span>;
}