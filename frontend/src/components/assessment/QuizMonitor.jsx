import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col, ProgressBar, Table, Badge, Alert, Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

// Simple websocket/SignalR client placeholder
// In a real implementation, you would use @microsoft/signalr or a websocket library
class QuizHubConnection {
  constructor(url, token) {
    this.url = url;
    this.token = token;
    this.callbacks = new Map();
    
    // Simulate connection
    this.connect();
  }
  
  connect() {
    console.log(`Connecting to real-time quiz events at ${this.url}`);
    // In a real implementation, you would connect to SignalR or WebSocket here
    
    // For demo, we'll simulate real-time events with setInterval
    this._simulateEvents();
  }
  
  on(eventName, callback) {
    if (!this.callbacks.has(eventName)) {
      this.callbacks.set(eventName, []);
    }
    this.callbacks.get(eventName).push(callback);
  }
  
  disconnect() {
    console.log('Disconnecting from real-time quiz events');
    // Clear simulation interval
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
  }
  
  _simulateEvents() {
    // Generate random events for demonstration purposes
    // In a real implementation, these events would come from the server
    const simulateStartEvents = () => {
      const students = [
        { id: 'student1', name: 'John Doe' },
        { id: 'student2', name: 'Jane Smith' },
        { id: 'student3', name: 'Sam Johnson' },
        { id: 'student4', name: 'Mary Williams' },
        { id: 'student5', name: 'David Brown' }
      ];
      
      let index = 0;
      // Simulate students starting the quiz one by one
      this.simulationInterval = setInterval(() => {
        if (index < students.length) {
          const student = students[index];
          this._triggerEvent('quizStart', {
            eventType: 'QuizStart',
            studentId: student.id,
            studentName: student.name,
            timestamp: new Date().toISOString()
          });
          index++;
        } else {
          // Once all students have started, begin generating answer events
          clearInterval(this.simulationInterval);
          this._simulateAnswerEvents(students);
        }
      }, 3000); // Every 3 seconds a new student starts
    };
    
    const simulateSubmitEvent = (student, scorePercent) => {
      this._triggerEvent('quizSubmit', {
        eventType: 'QuizSubmit',
        studentId: student.id,
        studentName: student.name,
        timestamp: new Date().toISOString(),
        score: Math.floor(scorePercent * 10),
        maxScore: 10,
        totalQuestions: 10,
        correctAnswers: Math.floor(scorePercent * 10),
        totalTimeSeconds: Math.floor(Math.random() * 600) + 300 // 5-15 minutes
      });
    };
    
    this._simulateAnswerEvents = (students) => {
      let answerCounts = {};
      students.forEach(student => {
        answerCounts[student.id] = 0;
      });
      
      // Simulate students answering questions
      this.simulationInterval = setInterval(() => {
        // Randomly pick a student to answer
        const studentIndex = Math.floor(Math.random() * students.length);
        const student = students[studentIndex];
        
        // Only generate new answer if student hasn't finished all questions
        if (answerCounts[student.id] < 10) {
          answerCounts[student.id]++;
          
          this._triggerEvent('quizAnswer', {
            eventType: 'QuizAnswer',
            studentId: student.id,
            studentName: student.name,
            timestamp: new Date().toISOString(),
            questionIndex: answerCounts[student.id],
            isCorrect: Math.random() > 0.3, // 70% chance of correct answer
            timeTakenSeconds: Math.floor(Math.random() * 60) + 10 // 10-70 seconds
          });
          
          // If student finished all questions, submit the quiz
          if (answerCounts[student.id] === 10) {
            // Calculate score based on number of correct answers
            const scorePercent = 0.5 + Math.random() * 0.5; // 50-100%
            setTimeout(() => {
              simulateSubmitEvent(student, scorePercent);
            }, 2000);
          }
        }
        
        // Check if all students have finished
        const allFinished = students.every(s => answerCounts[s.id] === 10);
        if (allFinished) {
          clearInterval(this.simulationInterval);
        }
      }, 2000); // Every 2 seconds a new answer
    };
    
    // Start simulation
    setTimeout(simulateStartEvents, 2000);
  }
  
  _triggerEvent(eventName, data) {
    if (this.callbacks.has(eventName)) {
      this.callbacks.get(eventName).forEach(callback => {
        callback(data);
      });
    }
  }
}

const QuizMonitor = ({ assessmentId }) => {
  const { user } = useSelector(state => state.auth);
  const [connection, setConnection] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Student progress tracking
  const [activeStudents, setActiveStudents] = useState([]);
  const [studentProgress, setStudentProgress] = useState({});
  const [completedStudents, setCompletedStudents] = useState([]);
  const [studentScores, setStudentScores] = useState({});
  
  // Statistics
  const [participationRate, setParticipationRate] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [questionStats, setQuestionStats] = useState({});
  
  // Load assessment details
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/assessments/${assessmentId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setAssessment(response.data);
        
        // Also fetch enrolled students for this course
        const enrolledResponse = await axios.get(
          `${API_BASE_URL}/api/courses/${response.data.courseId}/students`, 
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        // Initialize progress tracking structures
        const initialProgress = {};
        enrolledResponse.data.forEach(student => {
          initialProgress[student.userId] = {
            studentId: student.userId,
            name: student.name,
            questionsAnswered: 0,
            correctAnswers: 0,
            hasStarted: false,
            hasCompleted: false,
            lastActivity: null
          };
        });
        setStudentProgress(initialProgress);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching assessment:', err);
        setError('Failed to load assessment details.');
        setIsLoading(false);
      }
    };
    
    fetchAssessment();
  }, [assessmentId]);
  
  // Connect to real-time events
  useEffect(() => {
    if (!assessment) return;
    
    const hubConnection = new QuizHubConnection(
      `${API_BASE_URL}/quizHub`,
      localStorage.getItem('token')
    );
    
    setConnection(hubConnection);
    
    return () => {
      if (hubConnection) {
        hubConnection.disconnect();
      }
    };
  }, [assessment]);
  
  // Handle quiz start events
  const handleQuizStart = useCallback((data) => {
    console.log('Quiz start event:', data);
    
    setActiveStudents(prev => {
      if (!prev.includes(data.studentId)) {
        return [...prev, data.studentId];
      }
      return prev;
    });
    
    setStudentProgress(prev => ({
      ...prev,
      [data.studentId]: {
        ...prev[data.studentId],
        hasStarted: true,
        lastActivity: new Date(data.timestamp)
      }
    }));
    
    // Update participation rate
    setParticipationRate(prev => {
      const totalStudents = Object.keys(studentProgress).length;
      if (totalStudents === 0) return 0;
      const activeCount = activeStudents.length + 1;
      return Math.round((activeCount / totalStudents) * 100);
    });
  }, [activeStudents, studentProgress]);
  
  // Handle quiz answer events
  const handleQuizAnswer = useCallback((data) => {
    console.log('Quiz answer event:', data);
    
    setStudentProgress(prev => {
      const studentData = prev[data.studentId] || {
        studentId: data.studentId,
        name: data.studentName,
        questionsAnswered: 0,
        correctAnswers: 0,
        hasStarted: true,
        hasCompleted: false
      };
      
      return {
        ...prev,
        [data.studentId]: {
          ...studentData,
          questionsAnswered: studentData.questionsAnswered + 1,
          correctAnswers: data.isCorrect ? studentData.correctAnswers + 1 : studentData.correctAnswers,
          lastActivity: new Date(data.timestamp)
        }
      };
    });
    
    // Track question statistics
    setQuestionStats(prev => {
      const questionKey = `q${data.questionIndex}`;
      const current = prev[questionKey] || { attempts: 0, correct: 0 };
      
      return {
        ...prev,
        [questionKey]: {
          attempts: current.attempts + 1,
          correct: data.isCorrect ? current.correct + 1 : current.correct
        }
      };
    });
  }, []);
  
  // Handle quiz submission events
  const handleQuizSubmit = useCallback((data) => {
    console.log('Quiz submit event:', data);
    
    setCompletedStudents(prev => {
      if (!prev.includes(data.studentId)) {
        return [...prev, data.studentId];
      }
      return prev;
    });
    
    setStudentProgress(prev => ({
      ...prev,
      [data.studentId]: {
        ...prev[data.studentId],
        hasCompleted: true,
        questionsAnswered: data.totalQuestions,
        correctAnswers: data.correctAnswers,
        lastActivity: new Date(data.timestamp)
      }
    }));
    
    setStudentScores(prev => ({
      ...prev,
      [data.studentId]: {
        score: data.score,
        maxScore: data.maxScore,
        percentage: (data.score / data.maxScore) * 100,
        timeTaken: data.totalTimeSeconds
      }
    }));
    
    // Update completion rate
    setCompletionRate(prev => {
      const totalStudents = Object.keys(studentProgress).length;
      if (totalStudents === 0) return 0;
      const completedCount = completedStudents.length + 1;
      return Math.round((completedCount / totalStudents) * 100);
    });
    
    // Update average score
    setAverageScore(prev => {
      const scores = Object.values(studentScores);
      const newScores = [...scores, { percentage: (data.score / data.maxScore) * 100 }];
      const sum = newScores.reduce((acc, curr) => acc + curr.percentage, 0);
      return Math.round(sum / newScores.length);
    });
  }, [completedStudents, studentProgress, studentScores]);
  
  // Setup event handlers
  useEffect(() => {
    if (!connection) return;
    
    connection.on('quizStart', handleQuizStart);
    connection.on('quizAnswer', handleQuizAnswer);
    connection.on('quizSubmit', handleQuizSubmit);
    
    return () => {
      connection.disconnect();
    };
  }, [connection, handleQuizStart, handleQuizAnswer, handleQuizSubmit]);
  
  // Helper to render student progress bar
  const renderStudentProgress = (progress) => {
    if (!assessment) return null;
    
    const questionCount = 10; // Assuming 10 questions for demo
    const percentage = Math.round((progress.questionsAnswered / questionCount) * 100);
    
    return (
      <ProgressBar now={percentage} label={`${percentage}%`} />
    );
  };
  
  // Helper to get status badge
  const getStatusBadge = (progress) => {
    if (progress.hasCompleted) {
      return <Badge bg="success">Completed</Badge>;
    }
    if (progress.hasStarted) {
      return <Badge bg="primary">In Progress</Badge>;
    }
    return <Badge bg="secondary">Not Started</Badge>;
  };
  
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="danger">{error}</Alert>
    );
  }
  
  return (
    <div className="quiz-monitor">
      <h2 className="mb-4">Quiz Monitoring - {assessment?.title}</h2>
      
      <Row className="mb-4">
        <Col md={4}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Participation</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-column align-items-center">
                <div className="participation-chart mb-3">
                  <div className="progress-circle" style={{ 
                    background: `radial-gradient(white 50%, transparent 51%

