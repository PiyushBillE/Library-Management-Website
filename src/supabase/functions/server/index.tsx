import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Create Supabase clients
const createSupabaseClient = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const createAnonClient = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
);

// Initialize storage bucket
const initializeStorage = async () => {
  const supabase = createSupabaseClient();
  const bucketName = 'make-374bb1bc-student-photos';
  
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log('Creating storage bucket...');
      await supabase.storage.createBucket(bucketName, { public: false });
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

// Initialize storage on startup
initializeStorage();

// Generate unique library number
const generateLibraryNumber = () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(10000 + Math.random() * 90000);
  return `LIB${year}${random}`;
};

// Helper function to authenticate user
const authenticateUser = async (request: Request) => {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return null;
  }
  
  const supabase = createSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    return null;
  }
  
  return user;
};

// Health check endpoint
app.get("/make-server-374bb1bc/health", (c) => {
  return c.json({ status: "ok" });
});

// Student registration endpoint
app.post("/make-server-374bb1bc/register-student", async (c) => {
  try {
    const { email, password, studentData } = await c.req.json();
    
    // Create user account
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name: studentData.name,
        role: 'student',
        prn: studentData.prn
      },
      email_confirm: true
    });
    
    if (error) {
      console.error('Registration error:', error);
      return c.json({ error: `Registration failed: ${error.message}` }, 400);
    }
    
    // Generate library number and store student data
    const libraryNumber = generateLibraryNumber();
    const completeStudentData = {
      ...studentData,
      libraryNumber,
      userId: data.user.id,
      registrationDate: new Date().toISOString()
    };
    
    await kv.set(`student:${data.user.id}`, completeStudentData);
    await kv.set(`student:prn:${studentData.prn}`, data.user.id);
    if (studentData.mobile) {
      await kv.set(`student:phone:${studentData.mobile}`, data.user.id);
    }
    
    return c.json({ 
      success: true, 
      libraryNumber,
      userId: data.user.id
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// Student login endpoint
app.post("/make-server-374bb1bc/login", async (c) => {
  try {
    const { identifier, password } = await c.req.json();
    
    const supabase = createAnonClient();
    let email = identifier;
    
    // If identifier is PRN or phone, find the email
    if (!identifier.includes('@')) {
      let userId;
      
      // Check if it's a PRN (10 digits)
      if (/^\d{10}$/.test(identifier)) {
        userId = await kv.get(`student:prn:${identifier}`);
      } else {
        // Assume it's a phone number
        userId = await kv.get(`student:phone:${identifier}`);
      }
      
      if (!userId) {
        return c.json({ error: 'User not found' }, 404);
      }
      
      const studentData = await kv.get(`student:${userId}`);
      email = studentData?.email;
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    return c.json({ 
      success: true, 
      accessToken: data.session.access_token,
      user: data.user
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Librarian login endpoint
app.post("/make-server-374bb1bc/librarian-login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    // Check librarian credentials
    if (email !== 'BVDOETlibrary2025@gmail.com' || password !== 'lib$8447') {
      return c.json({ error: 'Invalid librarian credentials' }, 401);
    }
    
    return c.json({ 
      success: true, 
      role: 'librarian',
      email
    });
    
  } catch (error) {
    console.error('Librarian login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Get student profile
app.get("/make-server-374bb1bc/student-profile", async (c) => {
  try {
    const user = await authenticateUser(c.req);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const studentData = await kv.get(`student:${user.id}`);
    if (!studentData) {
      return c.json({ error: 'Student data not found' }, 404);
    }
    
    return c.json({ success: true, student: studentData });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Upload student photo
app.post("/make-server-374bb1bc/upload-photo", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('photo') as File;
    const userId = formData.get('userId') as string;
    
    if (!file || !userId) {
      return c.json({ error: 'Missing file or user ID' }, 400);
    }
    
    const supabase = createSupabaseClient();
    const fileName = `${userId}-${Date.now()}.${file.name.split('.').pop()}`;
    
    const { data, error } = await supabase.storage
      .from('make-374bb1bc-student-photos')
      .upload(fileName, file);
    
    if (error) {
      console.error('Upload error:', error);
      return c.json({ error: 'Upload failed' }, 500);
    }
    
    // Get signed URL
    const { data: signedUrl } = await supabase.storage
      .from('make-374bb1bc-student-photos')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry
    
    // Update student data with photo URL
    const studentData = await kv.get(`student:${userId}`);
    if (studentData) {
      studentData.photoUrl = signedUrl.signedUrl;
      await kv.set(`student:${userId}`, studentData);
    }
    
    return c.json({ 
      success: true, 
      photoUrl: signedUrl.signedUrl 
    });
    
  } catch (error) {
    console.error('Photo upload error:', error);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

// Get all students (for librarian)
app.get("/make-server-374bb1bc/students", async (c) => {
  try {
    const students = await kv.getByPrefix('student:');
    console.log('Raw students data:', students.length);
    
    // Filter out the lookup keys (prn, phone mappings)
    const studentRecords = students.filter(student => 
      student && typeof student === 'object' && student.libraryNumber
    );
    
    console.log('Filtered student records:', studentRecords.length);
    console.log('Sample student record:', studentRecords[0]);
    
    return c.json({ success: true, students: studentRecords });
    
  } catch (error) {
    console.error('Students fetch error:', error);
    return c.json({ error: 'Failed to fetch students' }, 500);
  }
});

// Update student data (for librarian)
app.put("/make-server-374bb1bc/student/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const updatedData = await c.req.json();
    
    const existingData = await kv.get(`student:${userId}`);
    if (!existingData) {
      return c.json({ error: 'Student not found' }, 404);
    }
    
    const mergedData = { ...existingData, ...updatedData };
    await kv.set(`student:${userId}`, mergedData);
    
    return c.json({ success: true, student: mergedData });
    
  } catch (error) {
    console.error('Student update error:', error);
    return c.json({ error: 'Failed to update student' }, 500);
  }
});

// Delete student (for librarian)
app.delete("/make-server-374bb1bc/student/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    
    const studentData = await kv.get(`student:${userId}`);
    if (!studentData) {
      return c.json({ error: 'Student not found' }, 404);
    }
    
    // Delete all related keys
    await kv.del(`student:${userId}`);
    await kv.del(`student:prn:${studentData.prn}`);
    await kv.del(`student:phone:${studentData.mobile}`);
    
    return c.json({ success: true });
    
  } catch (error) {
    console.error('Student delete error:', error);
    return c.json({ error: 'Failed to delete student' }, 500);
  }
});

// Get dashboard statistics
app.get("/make-server-374bb1bc/dashboard-stats", async (c) => {
  try {
    const students = await kv.getByPrefix('student:');
    const studentRecords = students.filter(student => 
      student && typeof student === 'object' && student.libraryNumber
    );
    
    // Calculate course distribution
    const courseDistribution: Record<string, number> = {};
    studentRecords.forEach(student => {
      const course = student.course;
      if (course) {
        courseDistribution[course] = (courseDistribution[course] || 0) + 1;
      }
    });
    
    console.log('Student records found:', studentRecords.length);
    console.log('Sample courses:', studentRecords.slice(0, 5).map(s => s.course));
    console.log('Course distribution:', courseDistribution);
    
    // Calculate new registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newRegistrations = studentRecords.filter(student => 
      new Date(student.registrationDate) > thirtyDaysAgo
    ).length;
    
    return c.json({ 
      success: true, 
      stats: {
        totalStudents: studentRecords.length,
        newRegistrations,
        courseDistribution
      }
    });
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return c.json({ error: 'Failed to fetch dashboard stats' }, 500);
  }
});

Deno.serve(app.fetch);