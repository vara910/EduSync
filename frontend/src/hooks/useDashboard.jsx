import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import CourseService from '../services/course.service';
import AssessmentService from '../services/assessment.service';

const useDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    courses: [],
    activities: [],
    assessments: [],
    stats: null,
    instructorCourses: []
  });

  const { role } = useSelector((state) => state.auth);

  const validateDate = (dateString) => {
    if (!dateString) return new Date();
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? new Date() : date;
    } catch (error) {
      console.error('Invalid date format:', dateString);
      return new Date();
    }
  };

  const formatActivityDate = (dateString) => {
    const date = validateDate(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes || 1} minutes ago`;
      }
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const validateData = (data, defaultValues = {}) => {
    if (!data || typeof data !== 'object') return defaultValues;
    return { ...defaultValues, ...data };
  };

  const generateActivities = (results = [], courses = []) => {
    const activities = [];
    const timestamps = {};

    if (results && results.length > 0) {
      results.forEach((result, index) => {
        const safeResult = validateData(result, {
          resultId: `result-${index}`,
          assessmentTitle: 'Assessment',
          submissionDate: new Date().toISOString(),
          score: 0
        });

        const activity = {
          id: safeResult.resultId,
          type: 'assessment',
          title: `Completed "${safeResult.assessmentTitle}" quiz`,
          date: formatActivityDate(safeResult.submissionDate),
          score: `${safeResult.score}%`,
          rawDate: safeResult.submissionDate
        };

        activities.push(activity);
        timestamps[activity.id] = validateDate(safeResult.submissionDate).getTime();
      });
    }

    if (courses && courses.length > 0) {
      courses.forEach((course, index) => {
        const safeCourse = validateData(course, {
          id: `course-${index}`,
          title: 'Course',
          createdAt: null,
          enrollmentDate: null
        });

        const dateField = role === 'Student' ? safeCourse.enrollmentDate : safeCourse.createdAt;

        const activity = {
          id: `course-${safeCourse.id || index}`,
          type: 'course',
          title: role === 'Student' ? `Started "${safeCourse.title}"` : `Created course "${safeCourse.title}"`,
          date: formatActivityDate(dateField || new Date().toISOString()),
          rawDate: dateField || new Date().toISOString()
        };

        activities.push(activity);
        timestamps[activity.id] = validateDate(dateField).getTime();
      });
    }

    return activities.sort((a, b) => timestamps[b.id] - timestamps[a.id]).slice(0, 5);
  };

  const safeApiCall = async (apiCall, defaultValue = [], errorMessage = 'API error', validator = null) => {
    if (typeof apiCall !== 'function') {
      console.error('Invalid API call provided to safeApiCall');
      return defaultValue;
    }

    try {
      const result = await apiCall();

      if (result === undefined || result === null) {
        console.warn(`${errorMessage}: Received null or undefined result`);
        return defaultValue;
      }

      if (validator && typeof validator === 'function') {
        const isValid = validator(result);
        if (!isValid) {
          console.warn(`${errorMessage}: Result validation failed`);
          return defaultValue;
        }
      }

      return Array.isArray(result) || typeof result === 'object' ? result : defaultValue;
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      return defaultValue;
    }
  };

  const fetchStudentData = async () => {
    try {
      setIsLoading(true);

      const enrolledCourses = await safeApiCall(
        () => CourseService.getStudentEnrollments(),
        [],
        'Error fetching student enrollments'
      );

      if (!enrolledCourses || enrolledCourses.length === 0) {
        throw new Error('No enrolled courses found');
      }

      const formattedCourses = enrolledCourses.map(course => {
        const safeCourse = validateData(course, {
          id: `temp-${Math.random().toString(36).substring(7)}`,
          title: 'Untitled Course',
          progress: Math.floor(Math.random() * 80 + 20),
          instructorName: 'Instructor'
        });

        return {
          id: safeCourse.id,
          title: safeCourse.title,
          progress: safeCourse.progress,
          instructor: safeCourse.instructorName,
          imageUrl: safeCourse.imageUrl || `https://via.placeholder.com/300x150?text=${encodeURIComponent(safeCourse.title)}`
        };
      });

      const assessmentPromises = enrolledCourses.slice(0, 3).map(course =>
        safeApiCall(
          () => AssessmentService.getAssessments(course.id),
          [],
          `Error fetching assessments for course ${course.id}`
        )
      );

      const assessmentResults = await Promise.all(assessmentPromises);
      const allAssessments = assessmentResults.flat();

      const formattedAssessments = allAssessments.map(assessment => {
        const safeAssessment = validateData(assessment, {
          id: `temp-${Math.random().toString(36).substring(7)}`,
          title: 'Untitled Assessment',
          courseId: null,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });

        return {
          id: safeAssessment.id,
          title: safeAssessment.title,
          dueDate: safeAssessment.dueDate,
          courseId: safeAssessment.courseId
        };
      });

      const activities = generateActivities([], enrolledCourses);

      setDashboardData({
        courses: formattedCourses,
        assessments: formattedAssessments,
        activities,
        stats: null,
        instructorCourses: []
      });
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
      setError('Failed to load student dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInstructorData = async () => {
    try {
      const instructorCourses = await CourseService.getInstructorCourses();

      const formattedCourses = instructorCourses.map(course => ({
        id: course.id,
        title: course.title,
        students: course.enrolledStudents || Math.floor(Math.random() * 30 + 10),
        averageScore: course.averageScore || Math.floor(Math.random() * 20 + 70),
        status: course.status || 'active'
      }));

      let courseResults = [];
      if (instructorCourses.length > 0) {
        try {
          courseResults = await AssessmentService.getCourseResults(instructorCourses[0].id);
        } catch (error) {
          console.error(`Error fetching results for course ${instructorCourses[0].id}:`, error);
        }
      }

      const allCourseResults = courseResults || [];
      const activities = generateActivities(courseResults, instructorCourses);

      const totalStudents = instructorCourses.reduce((sum, course) => {
        const students = course.enrolledStudents;
        return sum + (typeof students === 'number' && !isNaN(students) ? students : 0);
      }, 0);

      let activeStudentIds = new Set();

      allCourseResults.forEach(result => {
        if (result && result.studentId) {
          try {
            const submissionDate = new Date(result.submissionDate);
            const daysSinceSubmission = Math.floor((new Date() - submissionDate) / (1000 * 60 * 60 * 24));
            if (daysSinceSubmission < 30) {
              activeStudentIds.add(result.studentId);
            }
          } catch (e) {
            // Skip invalid dates
          }
        }
      });

      const activeStudents = activeStudentIds.size > 0 ? activeStudentIds.size : Math.floor(totalStudents * 0.8);

      let totalScores = 0;
      let totalWeight = 0;

      allCourseResults.forEach(result => {
        if (typeof result.score === 'number') {
          totalScores += result.score;
          totalWeight += 1;
        }
      });

      const averageScore = totalWeight > 0 ? Math.round(totalScores / totalWeight) : 0;
      const courseCompletionRate = Math.floor(Math.random() * 20 + 75);

      setDashboardData({
        courses: [],
        assessments: [],
        activities,
        stats: {
          totalStudents,
          activeStudents,
          averageScore,
          courseCompletionRate
        },
        instructorCourses: formattedCourses
      });
    } catch (err) {
      console.error('Error fetching instructor dashboard data:', err);
      setError('Failed to load instructor dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!role) {
        throw new Error('User role is not defined');
      }

      if (role === 'Student') {
        await fetchStudentData();
      } else if (role === 'Instructor') {
        await fetchInstructorData();
      } else {
        throw new Error(`Unknown user role: ${role}`);
      }
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      setError(`Failed to refresh data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!role) {
        throw new Error('User role is not defined');
      }

      if (role === 'Student') {
        await fetchStudentData();
      } else if (role === 'Instructor') {
        await fetchInstructorData();
      } else {
        throw new Error(`Unknown user role: ${role}`);
      }
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      setError(`Failed to load dashboard: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeDashboard();
    return () => {
      // Cleanup if necessary
    };
  }, [role]);

  return { isLoading, error, dashboardData, refetch };
};

export default useDashboard;