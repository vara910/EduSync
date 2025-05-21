import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col, Tabs, Tab } from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const QuizAnalytics = ({ 
  studentProgress, 
  questionStats, 
  studentScores, 
  assessmentData
}) => {
  // Initialize chart data states
  const [progressData, setProgressData] = useState(null);
  const [questionData, setQuestionData] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [timeData, setTimeData] = useState(null);
  
  // Update progress distribution chart
  useEffect(() => {
    if (!studentProgress || Object.keys(studentProgress).length === 0) return;
    
    // Count students in each progress category
    const progressCounts = {
      notStarted: 0,
      inProgress: 0,
      completed: 0
    };
    
    Object.values(studentProgress).forEach(student => {
      if (student.hasCompleted) {
        progressCounts.completed++;
      } else if (student.hasStarted) {
        progressCounts.inProgress++;
      } else {
        progressCounts.notStarted++;
      }
    });
    
    setProgressData({
      labels: ['Not Started', 'In Progress', 'Completed'],
      datasets: [
        {
          data: [
            progressCounts.notStarted,
            progressCounts.inProgress,
            progressCounts.completed
          ],
          backgroundColor: [
            'rgba(108, 117, 125, 0.7)',
            'rgba(13, 110, 253, 0.7)',
            'rgba(25, 135, 84, 0.7)'
          ],
          borderColor: [
            'rgb(108, 117, 125)',
            'rgb(13, 110, 253)',
            'rgb(25, 135, 84)'
          ],
          borderWidth: 1
        }
      ]
    });
  }, [studentProgress]);
  
  // Update question performance chart
  useEffect(() => {
    if (!questionStats || Object.keys(questionStats).length === 0) return;
    
    // Sort questions by index number
    const sortedQuestions = Object.entries(questionStats)
      .sort((a, b) => {
        const aIndex = parseInt(a[0].substring(1));
        const bIndex = parseInt(b[0].substring(1));
        return aIndex - bIndex;
      });
    
    const labels = sortedQuestions.map(([key]) => `Q${key.substring(1)}`);
    const correctRates = sortedQuestions.map(([, stats]) => {
      if (stats.attempts === 0) return 0;
      return (stats.correct / stats.attempts) * 100;
    });
    
    setQuestionData({
      labels,
      datasets: [
        {
          label: 'Success Rate (%)',
          data: correctRates,
          backgroundColor: 'rgba(13, 110, 253, 0.5)',
          borderColor: 'rgb(13, 110, 253)',
          borderWidth: 1
        }
      ]
    });
  }, [questionStats]);
  
  // Update score distribution chart
  useEffect(() => {
    if (!studentScores || Object.keys(studentScores).length === 0) return;
    
    // Group scores into ranges
    const scoreRanges = {
      '0-50': 0,
      '51-60': 0,
      '61-70': 0,
      '71-80': 0,
      '81-90': 0,
      '91-100': 0
    };
    
    Object.values(studentScores).forEach(score => {
      if (score.percentage <= 50) {
        scoreRanges['0-50']++;
      } else if (score.percentage <= 60) {
        scoreRanges['51-60']++;
      } else if (score.percentage <= 70) {
        scoreRanges['61-70']++;
      } else if (score.percentage <= 80) {
        scoreRanges['71-80']++;
      } else if (score.percentage <= 90) {
        scoreRanges['81-90']++;
      } else {
        scoreRanges['91-100']++;
      }
    });
    
    setScoreData({
      labels: Object.keys(scoreRanges),
      datasets: [
        {
          label: 'Number of Students',
          data: Object.values(scoreRanges),
          backgroundColor: [
            'rgba(220, 53, 69, 0.7)',
            'rgba(255, 193, 7, 0.7)',
            'rgba(255, 193, 7, 0.7)',
            'rgba(25, 135, 84, 0.7)',
            'rgba(25, 135, 84, 0.7)',
            'rgba(25, 135, 84, 0.7)'
          ],
          borderColor: [
            'rgb(220, 53, 69)',
            'rgb(255, 193, 7)',
            'rgb(255, 193, 7)',
            'rgb(25, 135, 84)',
            'rgb(25, 135, 84)',
            'rgb(25, 135, 84)'
          ],
          borderWidth: 1
        }
      ]
    });
  }, [studentScores]);
  
  // Update time analysis chart
  useEffect(() => {
    if (!studentScores || Object.keys(studentScores).length === 0) return;
    
    // Get time data from student scores
    const studentNames = [];
    const timeTaken = [];
    
    Object.entries(studentScores).forEach(([studentId, score]) => {
      // Get student name from progress data
      const student = studentProgress[studentId];
      if (student) {
        studentNames.push(student.name || `Student ${studentId.substring(0, 5)}`);
        // Convert seconds to minutes
        timeTaken.push(Math.round(score.timeTaken / 60));
      }
    });
    
    setTimeData({
      labels: studentNames,
      datasets: [
        {
          label: 'Time Taken (minutes)',
          data: timeTaken,
          backgroundColor: 'rgba(105, 85, 230, 0.5)',
          borderColor: 'rgb(105, 85, 230)',
          borderWidth: 1
        }
      ]
    });
  }, [studentScores, studentProgress]);
  
  return (
    <div className="quiz-analytics">
      <h3 className="mb-4">Real-Time Quiz Analytics</h3>
      
      <Tabs defaultActiveKey="progress" className="mb-3">
        <Tab eventKey="progress" title="Student Progress">
          <Card>
            <Card.Body>
              <h5 className="card-title">Student Progress Distribution</h5>
              <p className="text-muted">Shows how many students are at different stages of completion</p>
              
              <div className="chart-container" style={{ height: '300px' }}>
                {progressData ? (
                  <Doughnut
                    data={progressData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <p className="text-muted">Waiting for data...</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="questions" title="Question Analysis">
          <Card>
            <Card.Body>
              <h5 className="card-title">Question Performance Analysis</h5>
              <p className="text-muted">Shows the success rate for each question</p>
              
              <div className="chart-container" style={{ height: '300px' }}>
                {questionData ? (
                  <Bar
                    data={questionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          title: {
                            display: true,
                            text: 'Success Rate (%)'
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <p className="text-muted">Waiting for data...</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="scores" title="Score Distribution">
          <Card>
            <Card.Body>
              <h5 className="card-title">Score Distribution</h5>
              <p className="text-muted">Shows the distribution of student scores by percentage ranges</p>
              
              <div className="chart-container" style={{ height: '300px' }}>
                {scoreData ? (
                  <Bar
                    data={scoreData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            precision: 0
                          },
                          title: {
                            display: true,
                            text: 'Number of Students'
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <p className="text-muted">Waiting for data...</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="time" title="Time Analysis">
          <Card>
            <Card.Body>
              <h5 className="card-title">Time Analysis</h5>
              <p className="text-muted">Shows how much time each student spent on the quiz</p>
              
              <div className="chart-container" style={{ height: '300px' }}>
                {timeData ? (
                  <Bar
                    data={timeData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Time (minutes)'
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <p className="text-muted">Waiting for data...</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

QuizAnalytics.propTypes = {
  studentProgress: PropTypes.object.isRequired,
  questionStats: PropTypes.object.isRequired,
  studentScores: PropTypes.object.isRequired,
  assessmentData: PropTypes.object
};

export default QuizAnalytics;

