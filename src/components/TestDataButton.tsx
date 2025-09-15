import React from 'react';
import { Button } from './ui/button';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function TestDataButton() {
  const addTestData = async () => {
    const testStudents = [
      {
        email: 'test1@student.com',
        password: 'test123',
        studentData: {
          name: 'John Doe',
          prn: '1234567890',
          gender: 'Male',
          course: 'CSE',
          bloodGroup: 'B+',
          dateOfBirth: new Date('2000-01-15').toISOString(),
          category: 'Open',
          mobile: '9876543210',
          parentMobile: '9876543211',
          admittedYear: '2024',
          rollNumber: 'CSE001',
          permanentAddress: 'Test Address 1',
          localAddress: 'Local Address 1'
        }
      },
      {
        email: 'test2@student.com',
        password: 'test123',
        studentData: {
          name: 'Jane Smith',
          prn: '1234567891',
          gender: 'Female',
          course: 'IT',
          bloodGroup: 'A+',
          dateOfBirth: new Date('2000-05-20').toISOString(),
          category: 'OBC',
          mobile: '9876543212',
          parentMobile: '9876543213',
          admittedYear: '2024',
          rollNumber: 'IT001',
          permanentAddress: 'Test Address 2',
          localAddress: 'Local Address 2'
        }
      },
      {
        email: 'test3@student.com',
        password: 'test123',
        studentData: {
          name: 'Mike Johnson',
          prn: '1234567892',
          gender: 'Male',
          course: 'AIML',
          bloodGroup: 'O+',
          dateOfBirth: new Date('1999-12-10').toISOString(),
          category: 'SC',
          mobile: '9876543214',
          parentMobile: '9876543215',
          admittedYear: '2023',
          rollNumber: 'AIML001',
          permanentAddress: 'Test Address 3',
          localAddress: 'Local Address 3'
        }
      }
    ];

    for (const student of testStudents) {
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-374bb1bc/register-student`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(student)
        });

        const result = await response.json();
        console.log('Test student registration result:', result);
      } catch (error) {
        console.error('Error registering test student:', error);
      }
    }

    alert('Test data added successfully!');
  };

  return (
    <Button onClick={addTestData} variant="outline" size="sm">
      Add Test Data
    </Button>
  );
}