// Mock data for student dashboard
export const mockCourses = [
  {
    id: 1,
    title: 'Introduction to Web Development',
    progress: 75,
    instructor: 'John Doe',
    imageUrl: 'https://via.placeholder.com/300x150?text=Web+Dev',
  },
  {
    id: 2,
    title: 'Advanced JavaScript Concepts',
    progress: 45,
    instructor: 'Jane Smith',
    imageUrl: 'https://via.placeholder.com/300x150?text=JavaScript',
  },
  {
    id: 3,
    title: 'React Framework Deep Dive',
    progress: 20,
    instructor: 'Mark Wilson',
    imageUrl: 'https://via.placeholder.com/300x150?text=React',
  },
  {
    id: 4,
    title: 'Database Design Fundamentals',
    progress: 90,
    instructor: 'Sarah Johnson',
    imageUrl: 'https://via.placeholder.com/300x150?text=Database',
  },
];

export const mockActivities = [
  {
    id: 1,
    type: 'assessment',
    title: 'Completed "JavaScript Basics" quiz',
    date: '2 hours ago',
    score: '85%',
  },
  {
    id: 2,
    type: 'course',
    title: 'Started "React Framework Deep Dive"',
    date: '1 day ago',
  },
  {
    id: 3,
    type: 'assessment',
    title: 'Completed "HTML Fundamentals" quiz',
    date: '3 days ago',
    score: '92%',
  },
  {
    id: 4,
    type: 'forum',
    title: 'Posted a question in "JavaScript Basics" forum',
    date: '4 days ago',
  },
];

export const mockAssessments = [
  {
    id: 1,
    title: 'React Component Lifecycle',
    course: 'React Framework Deep Dive',
    dueDate: '2025-05-16',
    status: 'upcoming',
  },
  {
    id: 2,
    title: 'Advanced CSS Techniques',
    course: 'Introduction to Web Development',
    dueDate: '2025-05-20',
    status: 'upcoming',
  },
  {
    id: 3,
    title: 'Database Normalization',
    course: 'Database Design Fundamentals',
    dueDate: '2025-05-25',
    status: 'upcoming',
  },
];

// Instructor-specific mock data
export const mockStudentStats = {
  totalStudents: 124,
  activeStudents: 98,
  averageScore: 82,
  courseCompletionRate: 68,
};

export const mockInstructorCourses = [
  {
    id: 101,
    title: 'Advanced JavaScript Techniques',
    students: 45,
    averageScore: 76,
    status: 'active',
  },
  {
    id: 102,
    title: 'Frontend Development with React',
    students: 32,
    averageScore: 81,
    status: 'active',
  },
  {
    id: 103,
    title: 'Responsive Web Design',
    students: 28,
    averageScore: 88,
    status: 'active',
  },
];

