import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { 
  Search, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Home,
  LogOut,
  CreditCard
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

type User = {
  id?: string;
  role: 'student' | 'librarian';
  accessToken?: string;
  email?: string;
};

interface StudentManagementProps {
  user: User;
  onLogout: () => void;
  onNavigateBack: () => void;
}

interface StudentData {
  userId: string;
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
  registrationDate: string;
}

export function StudentManagement({ user, onLogout, onNavigateBack }: StudentManagementProps) {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<StudentData>>({});

  const courses = ['CSE', 'IT', 'AIML', 'CSBS', 'BBA', 'BCA'];
  const years = ['2020', '2021', '2022', '2023', '2024', '2025'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const categories = ['General', 'OBC', 'SC', 'ST', 'NT', 'SBC'];

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, courseFilter, yearFilter]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-374bb1bc/students`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const result = await response.json();
      console.log('Students response:', result);
      if (result.success) {
        setStudents(result.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
    setLoading(false);
  };

  const filterStudents = () => {
    let filtered = students;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.prn.includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.libraryNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(student => student.course === courseFilter);
    }

    // Year filter
    if (yearFilter !== 'all') {
      filtered = filtered.filter(student => student.admittedYear === yearFilter);
    }

    setFilteredStudents(filtered);
  };

  const handleEdit = async (updatedData: Partial<StudentData>) => {
    if (!editingStudent) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-374bb1bc/student/${editingStudent.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(updatedData)
      });

      const result = await response.json();
      if (result.success) {
        await fetchStudents();
        setEditingStudent(null);
        setEditFormData({});
      }
    } catch (error) {
      console.error('Error updating student:', error);
    }
  };

  const handleDelete = async (studentId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-374bb1bc/student/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const result = await response.json();
      if (result.success) {
        await fetchStudents();
      }
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const exportToIDCards = async (studentsToExport: StudentData[]) => {
    try {
      // Import jsPDF and QR code library
      const { jsPDF } = await import('jspdf');
      const QRCode = await import('qrcode');
      
      const doc = new jsPDF();
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 10;
      
      // 2 columns (front/back), 4 rows (4 students)
      const cardWidth = (pageWidth - 3 * margin) / 2; // Two cards per row with margins
      const cardHeight = (pageHeight - 5 * margin) / 4; // Four rows with margins
      
      let currentPage = 0;
      
      for (let i = 0; i < studentsToExport.length; i += 4) { // Process 4 students per page
        if (currentPage > 0) {
          doc.addPage();
        }
        currentPage++;
        
        const pageStudents = studentsToExport.slice(i, i + 4);
        
        // Process each student in rows
        for (let j = 0; j < pageStudents.length; j++) {
          const student = pageStudents[j];
          const row = j; // Each student gets their own row
          
          // Front card (left column)
          const frontX = margin;
          const frontY = margin + (row * (cardHeight + margin));
          
          // Back card (right column)
          const backX = margin + cardWidth + margin;
          const backY = frontY;
          
          // Draw Front Side
          await drawCardFront(doc, frontX, frontY, cardWidth, cardHeight, student);
          
          // Draw Back Side
          await drawCardBack(doc, backX, backY, cardWidth, cardHeight, student, QRCode);
        }
      }
      
      // Save the PDF
      doc.save(`student_id_cards_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again or contact support.');
    }
  };

  // Helper function to draw card front
  const drawCardFront = async (doc: any, x: number, y: number, width: number, height: number, student: StudentData) => {
    // Card border and background with subtle gradient effect
    doc.setFillColor(248, 250, 252);
    doc.rect(x, y, width, height, 'FD');
    
    // Add subtle shadow effect
    doc.setFillColor(230, 235, 240);
    doc.rect(x + 1, y + 1, width, height, 'F');
    doc.setFillColor(248, 250, 252);
    doc.rect(x, y, width, height, 'F');
    
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.rect(x, y, width, height);
    
    // Header with university branding - improved design
    const headerHeight = 18;
    doc.setFillColor(59, 130, 246);
    doc.rect(x, y, width, headerHeight, 'F');
    
    // Add gradient effect to header
    doc.setFillColor(37, 99, 235);
    doc.rect(x, y, width, headerHeight/2, 'F');
    doc.setFillColor(59, 130, 246);
    doc.rect(x, y + headerHeight/2, width, headerHeight/2, 'F');
    
    // University name in header - single line + Navi Mumbai below
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('BHARATI VIDYAPEETH DEEMED TO BE UNIVERSITY', x + width/2, y + 6, { align: 'center' });
    doc.setFontSize(6);
    doc.text('NAVI MUMBAI', x + width/2, y + 10, { align: 'center' });
    doc.setFontSize(5);
    doc.text('LIBRARY CARD', x + width/2, y + 15, { align: 'center' });
    
    // Student photo area with better styling
    const photoX = x + 8;
    const photoY = y + headerHeight + 8;
    const photoWidth = 25;
    const photoHeight = 30;
    
    // Add photo border with shadow
    doc.setFillColor(220, 220, 220);
    doc.rect(photoX + 1, photoY + 1, photoWidth, photoHeight, 'F');
    
    // Try to load and add student photo
    if (student.photoUrl) {
      try {
        // Create a temporary image to load the photo
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            try {
              // Create canvas to convert image to data URL
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = photoWidth * 4; // Higher resolution
              canvas.height = photoHeight * 4;
              
              if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                doc.addImage(dataUrl, 'JPEG', photoX, photoY, photoWidth, photoHeight);
              }
              resolve(null);
            } catch (err) {
              reject(err);
            }
          };
          img.onerror = reject;
          img.src = student.photoUrl;
        });
      } catch (error) {
        console.error('Error loading student photo:', error);
        // Fallback to placeholder
        drawPhotoPlaceholder(doc, photoX, photoY, photoWidth, photoHeight);
      }
    } else {
      // Draw placeholder
      drawPhotoPlaceholder(doc, photoX, photoY, photoWidth, photoHeight);
    }
    
    // Add photo border
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.8);
    doc.rect(photoX, photoY, photoWidth, photoHeight);
    
    // Student information section
    const infoX = photoX + photoWidth + 8;
    const infoY = photoY;
    
    // Student name (prominent) - removed blank spaces
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(10);
    const nameLines = doc.splitTextToSize(student.name.toUpperCase(), width - photoWidth - 20);
    doc.text(nameLines, infoX, infoY + 5);
    
    // Student details - removed Year, better spacing
    doc.setFontSize(7);
    doc.setTextColor(75, 85, 99);
    
    const details = [
      `PRN: ${student.prn}`,
      `Course: ${student.course}`,
      `Gender: ${student.gender}`,
      `Blood: ${student.bloodGroup}`
    ];
    
    // Calculate starting position to avoid footer overlap
    const detailStartY = infoY + (nameLines.length * 5) + 8;
    details.forEach((detail, index) => {
      doc.text(detail, infoX, detailStartY + (index * 5));
    });
    
    // Library number footer - adjusted position
    const footerY = y + height - 10;
    doc.setFillColor(37, 99, 235);
    doc.rect(x + 3, footerY, width - 6, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(`LIB ID: ${student.libraryNumber}`, x + width/2, footerY + 5, { align: 'center' });
    
    // Decorative elements
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(x + 3, y + headerHeight + 2, x + width - 3, y + headerHeight + 2);
    
    // Add corner accents
    doc.setFillColor(59, 130, 246);
    // Top left corner accent
    doc.rect(x, y, 8, 2, 'F');
    doc.rect(x, y, 2, 8, 'F');
    // Top right corner accent
    doc.rect(x + width - 8, y, 8, 2, 'F');
    doc.rect(x + width - 2, y, 2, 8, 'F');
  };

  // Helper function to draw photo placeholder
  const drawPhotoPlaceholder = (doc: any, x: number, y: number, width: number, height: number) => {
    doc.setFillColor(240, 242, 247);
    doc.rect(x, y, width, height, 'FD');
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.rect(x, y, width, height);
    
    // Placeholder text
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(6);
    doc.text('STUDENT', x + width/2, y + height/2 - 2, { align: 'center' });
    doc.text('PHOTO', x + width/2, y + height/2 + 2, { align: 'center' });
  };

  // Helper function to draw card back
  const drawCardBack = async (doc: any, x: number, y: number, width: number, height: number, student: StudentData, QRCode: any) => {
    // Card border and background with subtle pattern
    doc.setFillColor(250, 251, 252);
    doc.rect(x, y, width, height, 'FD');
    
    // Add subtle shadow effect
    doc.setFillColor(235, 240, 245);
    doc.rect(x + 1, y + 1, width, height, 'F');
    doc.setFillColor(250, 251, 252);
    doc.rect(x, y, width, height, 'F');
    
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.rect(x, y, width, height);
    
    // Header with improved styling
    const headerHeight = 14;
    doc.setFillColor(59, 130, 246);
    doc.rect(x, y, width, headerHeight, 'F');
    
    // Add gradient to header
    doc.setFillColor(37, 99, 235);
    doc.rect(x, y, width, headerHeight/2, 'F');
    doc.setFillColor(59, 130, 246);
    doc.rect(x, y + headerHeight/2, width, headerHeight/2, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text('LIBRARY CARD - BACK', x + width/2, y + 8, { align: 'center' });
    
    // Student details section - removed Category and Parent Mobile
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(7);
    
    const detailsStartY = y + headerHeight + 8;
    const details = [
      `Blood Group: ${student.bloodGroup}`,
      `Mobile: ${student.mobile}`,
      `DOB: ${student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-GB') : 'N/A'}`
    ];
    
    details.forEach((detail, index) => {
      doc.text(detail, x + 5, detailsStartY + (index * 6));
    });
    
    // Address section - positioned right after details with no extra space
    const addressY = detailsStartY + (details.length * 6) + 4;
    doc.setFontSize(7);
    doc.setTextColor(59, 130, 246);
    doc.text('Address:', x + 5, addressY);
    
    doc.setTextColor(75, 85, 99);
    doc.setFontSize(6);
    const address = student.permanentAddress || student.localAddress || 'Not provided';
    const addressLines = doc.splitTextToSize(address, width - 30);
    doc.text(addressLines, x + 5, addressY + 4);
    
    // QR Code section with better styling
    const qrSize = 22;
    const qrX = x + width - qrSize - 6;
    const qrY = y + height - qrSize - 16;
    
    // QR background
    doc.setFillColor(255, 255, 255);
    doc.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 'F');
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4);
    
    try {
      const qrDataUrl = await QRCode.toDataURL('https://bvdue-library.netlify.app/', {
        width: 128,
        margin: 0,
        color: {
          dark: '#3b82f6',
          light: '#ffffff'
        }
      });
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    } catch (qrError) {
      console.error('QR code generation error:', qrError);
      // Fallback: draw a rectangle
      doc.setFillColor(59, 130, 246);
      doc.rect(qrX, qrY, qrSize, qrSize, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(5);
      doc.text('QR', qrX + qrSize/2, qrY + qrSize/2, { align: 'center' });
    }
    
    // QR Code label
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(5);
    doc.text('Scan for Portal', qrX + qrSize/2, qrY + qrSize + 5, { align: 'center' });
    
    // Footer
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(5);
    doc.text('Valid only with student ID verification', x + width/2, y + height - 3, { align: 'center' });
    
    // Decorative corner elements - enhanced
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    const cornerSize = 8;
    // Top left
    doc.line(x + 3, y + 3, x + 3 + cornerSize, y + 3);
    doc.line(x + 3, y + 3, x + 3, y + 3 + cornerSize);
    // Top right
    doc.line(x + width - 3 - cornerSize, y + 3, x + width - 3, y + 3);
    doc.line(x + width - 3, y + 3, x + width - 3, y + 3 + cornerSize);
    // Bottom left
    doc.line(x + 3, y + height - 3 - cornerSize, x + 3, y + height - 3);
    doc.line(x + 3, y + height - 3, x + 3 + cornerSize, y + height - 3);
    // Bottom right
    doc.line(x + width - 3, y + height - 3 - cornerSize, x + width - 3, y + height - 3);
    doc.line(x + width - 3 - cornerSize, y + height - 3, x + width - 3, y + height - 3);
    
    // Add background pattern for visual interest
    doc.setDrawColor(220, 225, 235);
    doc.setLineWidth(0.1);
    for (let i = 0; i < 5; i++) {
      doc.line(x + width - 20, y + 20 + (i * 8), x + width - 5, y + 20 + (i * 8));
    }
  };

  const exportToExcel = async (studentsToExport: StudentData[]) => {
    try {
      // Import the xlsx library
      const XLSX = await import('xlsx');
      
      // Prepare data with reordered columns
      const excelData = studentsToExport.map(student => ({
        'Branch': student.course || 'N/A',
        'PRN': student.prn || 'N/A',
        'Name': student.name || 'N/A',
        'Phone Number': student.mobile || 'N/A',
        'Library Number': student.libraryNumber || 'N/A',
        'Email': student.email || 'N/A',
        'Admitted Year': student.admittedYear || 'N/A',
        'Roll Number': student.rollNumber || 'N/A',
        'Gender': student.gender || 'N/A',
        'Blood Group': student.bloodGroup || 'N/A',
        'Category': student.category || 'N/A',
        'Date of Birth': student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A',
        'Parent Mobile': student.parentMobile || 'N/A',
        'Permanent Address': student.permanentAddress || 'N/A',
        'Local Address': student.localAddress || 'N/A',
        'Registration Date': new Date(student.registrationDate).toLocaleDateString()
      }));
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths for better visibility
      const colWidths = [
        { wch: 12 }, // Branch
        { wch: 15 }, // PRN
        { wch: 25 }, // Name
        { wch: 15 }, // Phone Number
        { wch: 18 }, // Library Number
        { wch: 30 }, // Email
        { wch: 15 }, // Admitted Year
        { wch: 15 }, // Roll Number
        { wch: 10 }, // Gender
        { wch: 12 }, // Blood Group
        { wch: 12 }, // Category
        { wch: 15 }, // Date of Birth
        { wch: 15 }, // Parent Mobile
        { wch: 40 }, // Permanent Address
        { wch: 40 }, // Local Address
        { wch: 18 }  // Registration Date
      ];
      
      ws['!cols'] = colWidths;
      
      // Set row height for better visibility
      if (!ws['!rows']) ws['!rows'] = [];
      ws['!rows'][0] = { hpt: 25 }; // Header row height
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      
      // Write the file
      XLSX.writeFile(wb, `students_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      
    } catch (error) {
      console.error('Error generating Excel file:', error);
      // Fallback to CSV
      exportToCSV(studentsToExport);
    }
  };

  const exportToCSV = (studentsToExport: StudentData[]) => {
    const headers = [
      'Branch', 'PRN', 'Name', 'Phone Number', 'Library Number', 'Email', 
      'Admitted Year', 'Roll Number', 'Gender', 'Blood Group', 'Category',
      'Date of Birth', 'Parent Mobile', 'Permanent Address', 'Local Address', 'Registration Date'
    ];

    const csvContent = [
      headers.join(','),
      ...studentsToExport.map(student => [
        student.course || 'N/A',
        student.prn || 'N/A',
        student.name || 'N/A',
        student.mobile || 'N/A',
        student.libraryNumber || 'N/A',
        student.email || 'N/A',
        student.admittedYear || 'N/A',
        student.rollNumber || 'N/A',
        student.gender || 'N/A',
        student.bloodGroup || 'N/A',
        student.category || 'N/A',
        student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A',
        student.parentMobile || 'N/A',
        student.permanentAddress || 'N/A',
        student.localAddress || 'N/A',
        new Date(student.registrationDate).toLocaleDateString()
      ].map(field => `\"${field}\"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading students...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onNavigateBack}>
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            
            <Button variant="ghost" onClick={onNavigateBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <h1 className="text-xl font-semibold">Student Management</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Librarian</span>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Student Management</CardTitle>
              <CardDescription>
                Search, filter, and manage student records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="search">Search Students</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name, PRN, email, or library number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Course</Label>
                  <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {courses.map(course => (
                        <SelectItem key={course} value={course}>{course}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Year</Label>
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {years.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={() => exportToIDCards(filteredStudents)}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Export ID Cards
                </Button>
                
                <Button variant="outline" onClick={() => exportToExcel(filteredStudents)}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel Sheet
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <CardTitle>Students ({filteredStudents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>PRN</TableHead>
                    <TableHead>Library Number</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.userId}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={student.photoUrl} />
                            <AvatarFallback>
                              {student.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {student.gender} • {student.category}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.prn}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.libraryNumber}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>{student.course}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{student.email}</div>
                          <div className="text-muted-foreground">{student.mobile}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {/* View Dialog */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Student Details</DialogTitle>
                                <DialogDescription>
                                  Complete information for {student.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6">
                                {/* Profile Header */}
                                <div className="flex items-center space-x-4">
                                  <Avatar className="w-20 h-20">
                                    <AvatarImage src={student.photoUrl} />
                                    <AvatarFallback className="text-lg">
                                      {student.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="text-xl font-semibold">{student.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="default">{student.libraryNumber}</Badge>
                                      <Badge variant="outline">{student.course}</Badge>
                                    </div>
                                  </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>PRN Number</Label>
                                    <p className="font-medium">{student.prn}</p>
                                  </div>
                                  <div>
                                    <Label>Roll Number</Label>
                                    <p className="font-medium">{student.rollNumber || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label>Email</Label>
                                    <p className="font-medium">{student.email}</p>
                                  </div>
                                  <div>
                                    <Label>Mobile</Label>
                                    <p className="font-medium">{student.mobile}</p>
                                  </div>
                                  <div>
                                    <Label>Gender</Label>
                                    <p className="font-medium">{student.gender}</p>
                                  </div>
                                  <div>
                                    <Label>Blood Group</Label>
                                    <p className="font-medium">{student.bloodGroup}</p>
                                  </div>
                                  <div>
                                    <Label>Category</Label>
                                    <p className="font-medium">{student.category}</p>
                                  </div>
                                  <div>
                                    <Label>Admitted Year</Label>
                                    <p className="font-medium">{student.admittedYear}</p>
                                  </div>
                                </div>

                                {/* Addresses */}
                                <div className="space-y-4">
                                  <div>
                                    <Label>Permanent Address</Label>
                                    <p className="font-medium">{student.permanentAddress || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label>Local Address</Label>
                                    <p className="font-medium">{student.localAddress || 'N/A'}</p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Edit Dialog */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditingStudent(student);
                                  setEditFormData(student);
                                }}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Edit Student</DialogTitle>
                                <DialogDescription>
                                  Update student information
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="edit-name">Name</Label>
                                    <Input
                                      id="edit-name"
                                      value={editFormData.name || ''}
                                      onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-prn">PRN Number</Label>
                                    <Input
                                      id="edit-prn"
                                      value={editFormData.prn || ''}
                                      onChange={(e) => setEditFormData(prev => ({ ...prev, prn: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input
                                      id="edit-email"
                                      type="email"
                                      value={editFormData.email || ''}
                                      onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-mobile">Mobile</Label>
                                    <Input
                                      id="edit-mobile"
                                      value={editFormData.mobile || ''}
                                      onChange={(e) => setEditFormData(prev => ({ ...prev, mobile: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-parent-mobile">Parent Mobile</Label>
                                    <Input
                                      id="edit-parent-mobile"
                                      value={editFormData.parentMobile || ''}
                                      onChange={(e) => setEditFormData(prev => ({ ...prev, parentMobile: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-roll-number">Roll Number</Label>
                                    <Input
                                      id="edit-roll-number"
                                      value={editFormData.rollNumber || ''}
                                      onChange={(e) => setEditFormData(prev => ({ ...prev, rollNumber: e.target.value }))}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-course">Course</Label>
                                    <Select 
                                      value={editFormData.course || ''} 
                                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, course: value }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {courses.map(course => (
                                          <SelectItem key={course} value={course}>{course}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-admitted-year">Admitted Year</Label>
                                    <Select 
                                      value={editFormData.admittedYear || ''} 
                                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, admittedYear: value }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {years.map(year => (
                                          <SelectItem key={year} value={year}>{year}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-gender">Gender</Label>
                                    <Select 
                                      value={editFormData.gender || ''} 
                                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, gender: value }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-blood-group">Blood Group</Label>
                                    <Select 
                                      value={editFormData.bloodGroup || ''} 
                                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, bloodGroup: value }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {bloodGroups.map(bloodGroup => (
                                          <SelectItem key={bloodGroup} value={bloodGroup}>{bloodGroup}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-category">Category</Label>
                                    <Select 
                                      value={editFormData.category || ''} 
                                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, category: value }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {categories.map(category => (
                                          <SelectItem key={category} value={category}>{category}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-date-of-birth">Date of Birth</Label>
                                    <Input
                                      id="edit-date-of-birth"
                                      type="date"
                                      value={editFormData.dateOfBirth ? editFormData.dateOfBirth.split('T')[0] : ''}
                                      onChange={(e) => setEditFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <Label htmlFor="edit-permanent-address">Permanent Address</Label>
                                  <Textarea
                                    id="edit-permanent-address"
                                    value={editFormData.permanentAddress || ''}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, permanentAddress: e.target.value }))}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="edit-local-address">Local Address</Label>
                                  <Textarea
                                    id="edit-local-address"
                                    value={editFormData.localAddress || ''}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, localAddress: e.target.value }))}
                                  />
                                </div>
                                
                                <div className="flex justify-end space-x-2">
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline"
                                      onClick={() => {
                                        setEditingStudent(null);
                                        setEditFormData({});
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </DialogTrigger>
                                  <Button onClick={() => handleEdit(editFormData)}>
                                    Save Changes
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          {/* Delete Button */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Student</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {student.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(student.userId)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredStudents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No students found matching your criteria
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}