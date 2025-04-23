// src/views/StudentPortal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAzure } from '../hooks/useAzure';
import LoadingSpinner from '../components/LoadingSpinner';
import ProgressChart from '../components/ProgressChart';
import AssignmentList from '../components/AssignmentList';
import ResourcePanel from '../components/ResourcePanel';
import './StudentPortal.css';

const StudentPortal = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const { analyzeSentiment } = useAzure();
  
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Redirect to login if not authenticated
        navigate('/login');
        return;
      }
      
      // Fetch student data
      fetchStudentData(user.uid);
    });
    
    return () => unsubscribe();
  }, [auth, navigate]);
  
  const fetchStudentData = async (userId) => {
    try {
      console.log('[Student Portal] Fetching student data...');
      setLoading(true);
      
      // Get student document from Firestore
      const studentRef = doc(db, 'students', userId);
      const studentDoc = await getDoc(studentRef);
      
      if (!studentDoc.exists()) {
        console.error('Student data not found');
        // Use mock data for demo/development
        const mockData = generateMockStudentData();
        setStudentData(mockData);
        await analyzeStudentRisk(mockData);
      } else {
        const data = { id: studentDoc.id, ...studentDoc.data() };
        setStudentData(data);
        await analyzeStudentRisk(data);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      // Use mock data as fallback
      const mockData = generateMockStudentData();
      setStudentData(mockData);
      await analyzeStudentRisk(mockData);
    } finally {
      setLoading(false);
    }
  };
  
  const analyzeStudentRisk = async (data) => {
    try {
      console.log('[Student Portal] Analyzing risk factors...');
      
      // If there's existing feedback, analyze it
      const feedback = data.lastFeedback || '';
      const sentimentResult = await analyzeSentiment(feedback);
      
      // Calculate risk scores based on available data
      const attendanceRisk = data.Attendance ? 100 - data.Attendance : 50;
      const academicRisk = data.AssignmentsSubmitted ? 100 - data.AssignmentsSubmitted : 50;
      const engagementRisk = data.EngagementScore ? 100 - data.EngagementScore : 50;
      const emotionalRisk = sentimentResult?.documents?.[0]?.confidenceScores?.negative * 100 || 30;
      
      // Create comprehensive risk analysis
      const analysis = {
        overall: Math.round((attendanceRisk * 0.25 + academicRisk * 0.35 + engagementRisk * 0.2 + emotionalRisk * 0.2)),
        academic: academicRisk,
        attendance: attendanceRisk,
        engagement: engagementRisk,
        emotional: emotionalRisk,
        recommendations: generateRecommendations(academicRisk, attendanceRisk, engagementRisk, emotionalRisk)
      };
      
      setRiskAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing risk:', error);
      
      // Fallback to basic risk calculation
      const fallbackAnalysis = {
        overall: 35,
        academic: 40,
        attendance: 25,
        engagement: 30,
        emotional: 45,
        recommendations: [
          'Keep up with your daily assignments',
          'Connect with your advisor this week',
          'Consider joining a study group for difficult subjects'
        ]
      };
      
      setRiskAnalysis(fallbackAnalysis);
    }
  };
  
  const generateRecommendations = (academic, attendance, engagement, emotional) => {
    const recommendations = [];
    
    if (academic > 70) {
      recommendations.push('Schedule an urgent meeting with your academic advisor');
      recommendations.push('Join the tutoring sessions on Tuesdays and Thursdays');
    } else if (academic > 30) {
      recommendations.push('Review your assignment calendar and create a study plan');
      recommendations.push('Consider attending office hours for difficult subjects');
    }
    
    if (attendance > 70) {
      recommendations.push('Your attendance needs immediate attention - contact your counselor');
      recommendations.push('Set up daily reminders for your classes');
    } else if (attendance > 30) {
      recommendations.push('Try to improve your attendance this week');
    }
    
    if (engagement > 50) {
      recommendations.push('Try to participate more actively in class discussions');
    }
    
    if (emotional > 60) {
      recommendations.push('Consider scheduling time with the school counselor');
      recommendations.push('Take advantage of wellness resources in the Support tab');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('You\'re doing great! Keep up the good work');
    }
    
    return recommendations;
  };
  
  const generateMockStudentData = () => {
    const today = new Date();
    const assignmentDue = new Date(today);
    assignmentDue.setDate(today.getDate() + 3);
    
    return {
      StudentID: 'S1025',
      Name: 'Alex Johnson',
      Grade: '11th',
      School: 'Washington High',
      Counselor: 'Dr. Smith',
      AssignmentsSubmitted: 85,
      Attendance: 92,
      EngagementScore: 78,
      LastLoginDate: new Date(),
      currentCourses: [
        { id: 'c1', name: 'Algebra II', grade: 'B+', teacher: 'Ms. Anderson' },
        { id: 'c2', name: 'English Literature', grade: 'A-', teacher: 'Mr. Patel' },
        { id: 'c3', name: 'Chemistry', grade: 'C+', teacher: 'Dr. Nguyen' },
        { id: 'c4', name: 'World History', grade: 'B', teacher: 'Ms. Rodriguez' }
      ],
      upcomingAssignments: [
        { id: 'a1', title: 'Algebra Problem Set', course: 'Algebra II', dueDate: assignmentDue, status: 'pending' },
        { id: 'a2', title: 'Literary Analysis Essay', course: 'English Literature', dueDate: new Date(today.setDate(today.getDate() + 5)), status: 'pending' },
        { id: 'a3', title: 'Lab Report: Titration', course: 'Chemistry', dueDate: new Date(today.setDate(today.getDate() + 2)), status: 'pending' }
      ],
      lastFeedback: "I'm struggling a bit with Chemistry, but overall keeping up with my assignments. English is going really well."
    };
  };
  
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    
    try {
      // Analyze the new feedback
      const sentimentResult = await analyzeSentiment(feedback);
      const emotionalRisk = sentimentResult?.documents?.[0]?.confidenceScores?.negative * 100 || 30;
      
      // Update risk analysis with new emotional risk
      setRiskAnalysis(prev => ({
        ...prev,
        emotional: emotionalRisk,
        overall: Math.round((prev.attendance * 0.25 + prev.academic * 0.35 + prev.engagement * 0.2 + emotionalRisk * 0.2))
      }));
      
      // In a real app, would save to Firebase here
      console.log('[Student Portal] Feedback submitted:', feedback);
      
      // Clear the input
      setFeedback('');
      alert('Your feedback has been submitted. Thank you!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('There was an error submitting your feedback. Please try again.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };
  
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigate('/login');
      })
      .catch((error) => {
        console.error('Logout failed:', error);
      });
  };
  
  if (loading) {
    return (
      <div className="student-loading">
        <LoadingSpinner />
        <p>Loading your personal dashboard...</p>
      </div>
    );
  }
  
  const getRiskLevel = (score) => {
    if (score >= 70) return 'high-risk';
    if (score >= 30) return 'medium-risk';
    return 'low-risk';
  };
  
  const getRiskLabel = (score) => {
    if (score >= 70) return 'High';
    if (score >= 30) return 'Medium';
    return 'Low';
  };

  return (
    <div className="student-portal">
      <header className="student-header">
        <div className="student-info">
          <h1>Hello, {studentData.Name}</h1>
          <p>{studentData.Grade} Grade • {studentData.School}</p>
        </div>
        
        <div className="portal-actions">
          <button className="logout-btn" onClick={handleLogout}>Log Out</button>
        </div>
      </header>
      
      <nav className="student-nav">
        <button 
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`nav-tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          My Courses
        </button>
        <button 
          className={`nav-tab ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          Assignments
        </button>
        <button 
          className={`nav-tab ${activeTab === 'support' ? 'active' : ''}`}
          onClick={() => setActiveTab('support')}
        >
          Support Resources
        </button>
      </nav>
      
      <main className="student-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="progress-section">
              <h2>Your Progress</h2>
              
              <div className="progress-metrics">
                <div className="metric">
                  <span className="metric-label">Attendance</span>
                  <div className="metric-value">{studentData.Attendance}%</div>
                  <div className={`risk-indicator ${getRiskLevel(riskAnalysis.attendance)}`}>
                    {getRiskLabel(riskAnalysis.attendance)} Risk
                  </div>
                </div>
                
                <div className="metric">
                  <span className="metric-label">Assignments</span>
                  <div className="metric-value">{studentData.AssignmentsSubmitted}%</div>
                  <div className={`risk-indicator ${getRiskLevel(riskAnalysis.academic)}`}>
                    {getRiskLabel(riskAnalysis.academic)} Risk
                  </div>
                </div>
                
                <div className="metric">
                  <span className="metric-label">Engagement</span>
                  <div className="metric-value">{studentData.EngagementScore}%</div>
                  <div className={`risk-indicator ${getRiskLevel(riskAnalysis.engagement)}`}>
                    {getRiskLabel(riskAnalysis.engagement)} Risk
                  </div>
                </div>
              </div>
              
              <div className="progress-chart">
                <ProgressChart 
                  data={[
                    { name: 'Academic', value: 100 - riskAnalysis.academic },
                    { name: 'Attendance', value: 100 - riskAnalysis.attendance },
                    { name: 'Engagement', value: 100 - riskAnalysis.engagement },
                    { name: 'Emotional', value: 100 - riskAnalysis.emotional }
                  ]}
                />
              </div>
            </div>
            
            <div className="recommendations-section">
              <h2>Personalized Recommendations</h2>
              <ul className="recommendations-list">
                {riskAnalysis.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
            
            <div className="feedback-section">
              <h2>How are you feeling about your progress?</h2>
              <form onSubmit={handleFeedbackSubmit}>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share how you're feeling about your classes, workload, or any challenges you're facing..."
                  rows={4}
                  required
                />
                <button 
                  type="submit" 
                  disabled={feedbackSubmitting}
                  className="feedback-submit"
                >
                  {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </div>
          </div>
        )}
        
        {activeTab === 'courses' && (
          <div className="courses-tab">
            <h2>My Courses</h2>
            <div className="courses-list">
              {studentData.currentCourses.map(course => (
                <div className="course-card" key={course.id}>
                  <div className="course-header">
                    <h3>{course.name}</h3>
                    <span className="course-grade">{course.grade}</span>
                  </div>
                  <div className="course-details">
                    <p><strong>Teacher:</strong> {course.teacher}</p>
                    <p><strong>Upcoming:</strong> {
                      studentData.upcomingAssignments.filter(a => a.course === course.name).length
                    } assignments</p>
                  </div>
                  <button className="course-action">View Details</button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'assignments' && (
          <div className="assignments-tab">
            <h2>Upcoming Assignments</h2>
            <AssignmentList 
              assignments={studentData.upcomingAssignments}
              onStatusChange={(id, newStatus) => {
                console.log(`Assignment ${id} status changed to ${newStatus}`);
                // Would update Firebase in a real implementation
              }}
            />
          </div>
        )}
        
        {activeTab === 'support' && (
          <div className="support-tab">
            <h2>Support Resources</h2>
            <ResourcePanel 
              counselor={studentData.Counselor}
              resources={[
                {
                  title: 'Academic Support',
                  items: [
                    { name: 'Tutoring Center', link: '/resources/tutoring' },
                    { name: 'Study Skills Workshop', link: '/resources/study-skills' },
                    { name: 'Academic Counseling', link: '/resources/academic-counseling' }
                  ]
                },
                {
                  title: 'Wellness Resources',
                  items: [
                    { name: 'Mindfulness Sessions', link: '/resources/mindfulness' },
                    { name: 'Student Support Group', link: '/resources/support-group' },
                    { name: 'Stress Management Tips', link: '/resources/stress-management' }
                  ]
                }
              ]}
            />
          </div>
        )}
      </main>
      
      <footer className="student-footer">
        <p>Last login: {studentData.LastLoginDate.toLocaleString()}</p>
        <p>If you need assistance, contact your counselor: {studentData.Counselor}</p>
      </footer>
    </div>
  );
};

export default StudentPortal;