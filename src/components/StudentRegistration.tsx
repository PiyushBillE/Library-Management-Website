import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Upload, ArrowLeft } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { ImageWithFallback } from './figma/ImageWithFallback';

type User = {
  id?: string;
  role: 'student' | 'librarian';
  accessToken?: string;
  email?: string;
};

interface StudentRegistrationProps {
  onSuccess: (user: User) => void;
  onBack: () => void;
}

export function StudentRegistration({ onSuccess, onBack }: StudentRegistrationProps) {
  const [formData, setFormData] = useState({
    name: '',
    prn: '',
    gender: '',
    course: '',
    bloodGroup: '',
    dateOfBirth: '',
    category: '',
    mobile: '',
    parentMobile: '',
    email: '',
    admittedYear: '',
    rollNumber: '',
    permanentAddress: '',
    localAddress: '',
    password: ''
  });
  
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const courses = ['CSE', 'IT', 'AIML', 'CSBS', 'BBA', 'BCA'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const categories = ['Open', 'OBC', 'SC', 'ST'];
  const genders = ['Male', 'Female', 'Other'];

  const handleInputChange = (field: string, value: string) => {
    // Auto-format DOB with slashes
    if (field === 'dateOfBirth') {
      // Remove any non-digit characters first
      const cleanValue = value.replace(/\D/g, '');
      
      // Apply formatting
      if (cleanValue.length >= 2 && cleanValue.length < 4) {
        value = cleanValue.slice(0, 2) + '/' + cleanValue.slice(2);
      } else if (cleanValue.length >= 4) {
        value = cleanValue.slice(0, 2) + '/' + cleanValue.slice(2, 4) + '/' + cleanValue.slice(4, 8);
      } else {
        value = cleanValue;
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(''); // Clear error when user starts typing
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(''); // Clear error when photo is selected
    }
  };

  const validateDateOfBirth = (dob: string): boolean => {
    // Validate DD/MM/YYYY format
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (!regex.test(dob)) {
      return false;
    }

    // Parse the date
    const parts = dob.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Check if date is valid
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return false;
    }

    // Check if date is in the future
    const today = new Date();
    if (date > today) {
      return false;
    }

    return true;
  };

  const formatDateForBackend = (dob: string): string => {
    const parts = dob.split('/');
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    return `${year}-${month}-${day}T00:00:00.000Z`;
  };

  const validateForm = () => {
    const requiredFields = [
      { field: formData.name, name: 'Name' },
      { field: formData.prn, name: 'PRN Number' },
      { field: formData.email, name: 'Email' },
      { field: formData.password, name: 'Password' },
      { field: formData.gender, name: 'Gender' },
      { field: formData.course, name: 'Course' },
      { field: formData.bloodGroup, name: 'Blood Group' },
      { field: formData.mobile, name: 'Mobile Number' },
      { field: formData.parentMobile, name: 'Parent Mobile Number' }
    ];

    for (const { field, name } of requiredFields) {
      if (!field) {
        setError(`${name} is required`);
        return false;
      }
    }

    if (!formData.dateOfBirth) {
      setError('Date of Birth is required');
      return false;
    }

    if (!validateDateOfBirth(formData.dateOfBirth)) {
      setError('Please enter a valid date of birth in DD/MM/YYYY format');
      return false;
    }

    if (!photo) {
      setError('Passport size photo is required');
      return false;
    }

    // Validate PRN format (10 digits)
    if (!/^\d{10}$/.test(formData.prn)) {
      setError('PRN must be exactly 10 digits');
      return false;
    }

    // Validate mobile numbers (10 digits)
    if (!/^\d{10}$/.test(formData.mobile)) {
      setError('Mobile number must be exactly 10 digits');
      return false;
    }

    if (!/^\d{10}$/.test(formData.parentMobile)) {
      setError('Parent mobile number must be exactly 10 digits');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      console.log('Submitting registration for:', formData.email);

      // Register student
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-374bb1bc/register-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          studentData: {
            ...formData,
            dateOfBirth: formatDateForBackend(formData.dateOfBirth)
          }
        })
      });

      const result = await response.json();
      console.log('Registration response:', result);

      if (result.success) {
        // Upload photo if provided
        if (photo) {
          const photoFormData = new FormData();
          photoFormData.append('photo', photo);
          photoFormData.append('userId', result.userId);

          const photoResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-374bb1bc/upload-photo`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`
            },
            body: photoFormData
          });

          const photoResult = await photoResponse.json();
          console.log('Photo upload response:', photoResult);
        }

        // Auto-login after registration
        const loginResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-374bb1bc/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            identifier: formData.email,
            password: formData.password
          })
        });

        const loginResult = await loginResponse.json();
        console.log('Auto-login response:', loginResult);

        if (loginResult.success) {
          onSuccess({
            id: loginResult.user.id,
            role: 'student',
            accessToken: loginResult.accessToken,
            email: loginResult.user.email
          });
        } else {
          setError('Registration successful but auto-login failed. Please login manually.');
        }
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Network error. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Student Registration
            </h1>
            <p className="text-gray-600">
              Join the BVDUET Library System
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Register Your Account</CardTitle>
            <CardDescription>
              Fill in your details to create your library account. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Passport Size Photo *</Label>
                <div className="flex items-center space-x-4">
                  {photoPreview && (
                    <div className="w-24 h-24 border rounded-lg overflow-hidden">
                      <ImageWithFallback
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="photo-upload"
                      required
                    />
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <div className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                        <Upload className="w-4 h-4" />
                        <span>Upload Photo</span>
                      </div>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prn">PRN Number (10 digits) *</Label>
                  <Input
                    id="prn"
                    value={formData.prn}
                    onChange={(e) => handleInputChange('prn', e.target.value)}
                    placeholder="Enter PRN number"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select onValueChange={(value) => handleInputChange('gender', value)} value={formData.gender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {genders.map(gender => (
                        <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Course *</Label>
                  <Select onValueChange={(value) => handleInputChange('course', value)} value={formData.course}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course} value={course}>{course}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Blood Group *</Label>
                  <Select onValueChange={(value) => handleInputChange('bloodGroup', value)} value={formData.bloodGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodGroups.map(bg => (
                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth (DD/MM/YYYY) *</Label>
                  <Input
                    id="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select onValueChange={(value) => handleInputChange('category', value)} value={formData.category}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admittedYear">Admitted Year</Label>
                  <Input
                    id="admittedYear"
                    value={formData.admittedYear}
                    onChange={(e) => handleInputChange('admittedYear', e.target.value)}
                    placeholder="2024"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                    placeholder="Enter mobile number"
                    maxLength={10}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="parentMobile">Parent Mobile Number *</Label>
                  <Input
                    id="parentMobile"
                    value={formData.parentMobile}
                    onChange={(e) => handleInputChange('parentMobile', e.target.value)}
                    placeholder="Enter parent mobile number"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input
                    id="rollNumber"
                    value={formData.rollNumber}
                    onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-2">
                <Label htmlFor="permanentAddress">Permanent Address</Label>
                <Textarea
                  id="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="localAddress">Local Address</Label>
                <Textarea
                  id="localAddress"
                  value={formData.localAddress}
                  onChange={(e) => handleInputChange('localAddress', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}