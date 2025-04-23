// src/views/Dashboard.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAzure } from '../hooks/useAzure';
import RiskRadarChart from '../components/RiskRadarChart';
import LoadingSpinner from '../components/LoadingSpinner';
import StudentTable from '../components/StudentTable';
import RiskDistributionChart from '../components/RiskDistributionChart';
import DashboardAgent from '../components/DashboardAgent';
import './Dashboard.css';

const Dashboard = () => {
  const { analyzeSentiment } = useAzure();
  const [processedData, setProcessedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(true);
  const [activeView, setActiveView] = useState('radar');
  const [filterLevel, setFilterLevel] = useState('all');
  const [selectedStudentForAgent, setSelectedStudentForAgent] = useState(null);

  const handleStudentSelect = (student) => {
    setSelectedStudentForAgent(student);
  };

  const generateMockData = () => {
    const schools = ['Washington High', 'Lincoln Academy', 'Roosevelt Middle', 'Jefferson Elementary'];
    const counselors = ['Dr. Smith', 'Ms. Johnson', 'Mr. Davis', 'Dr. Wilson', 'Ms. Brown'];
    const grades = ['9th', '10th', '11th', '12th'];
    
    return Array(20).fill().map((_, i) => {
      const riskScore = Math.floor(Math.random() * 100);
      const attendancePercent = Math.floor(Math.random() * 40) + 60;
      const assignmentsSubmitted = Math.floor(Math.random() * 40) + 60;
      const engagementScore = Math.floor(Math.random() * 100);
      
      const detailedRisks = {
        academic: Math.floor(Math.random() * 100),
        behavioral: Math.floor(Math.random() * 100),
        attendance: 100 - attendancePercent,
        engagement: 100 - engagementScore,
        emotional: Math.floor(Math.random() * 100)
      };
      
      const today = new Date();
      const lastLoginDays = Math.floor(Math.random() * 14);
      const lastLogin = new Date(today);
      lastLogin.setDate(today.getDate() - lastLoginDays);
      
      return {
        StudentID: `S${1000 + i}`,
        Name: `Student ${i+1}`,
        Grade: grades[Math.floor(Math.random() * grades.length)],
        School: schools[Math.floor(Math.random() * schools.length)],
        Counselor: counselors[Math.floor(Math.random() * counselors.length)],
        AssignmentsSubmitted: assignmentsSubmitted,
        Attendance: attendancePercent,
        EngagementScore: engagementScore,
        LastLoginDate: lastLogin,
        RiskScore: riskScore,
        detailedRisks: detailedRisks,
        lastFeedback: generateRandomFeedback(riskScore),
        interventions: Math.floor(Math.random() * 5),
        counselorNotes: riskScore > 70 ? "Requires immediate attention" : 
                        riskScore > 30 ? "Monitor progress" : "On track"
      };
    });
  };
  
  const generateRandomFeedback = (riskScore) => {
    const highRiskFeedback = [
      "I'm really struggling with all my classes. I don't think I can pass this semester.",
      "I haven't been able to focus on schoolwork. Everything feels overwhelming.",
      "School is the last thing on my mind right now with everything else going on.",
      "I don't see the point in trying anymore. Nothing seems to work out."
    ];
    
    const mediumRiskFeedback = [
      "Math class is challenging, but I'm trying to keep up.",
      "I missed some assignments due to being sick, but I'm catching up now.",
      "Some days are better than others. I'm managing, but it's not easy.",
      "I'm a bit behind in my reading, but I understand the main concepts."
    ];
    
    const lowRiskFeedback = [
      "I'm feeling good about my progress this semester.",
      "The group project is going really well. Our team works great together.",
      "I've been keeping up with all my assignments and feel prepared for the test.",
      "Class discussions have been helpful. I'm understanding the material well."
    ];
    
    if (riskScore > 70) {
      return highRiskFeedback[Math.floor(Math.random() * highRiskFeedback.length)];
    } else if (riskScore > 30) {
      return mediumRiskFeedback[Math.floor(Math.random() * mediumRiskFeedback.length)];
    } else {
      return lowRiskFeedback[Math.floor(Math.random() * lowRiskFeedback.length)];
    }
  };

  const processRealData = useCallback(async (students) => {
    setLoading(true);
    
    try {
      const results = [];
      const BATCH_SIZE = 5;
      const BATCH_DELAY = 30000;
      
      for (let i = 0; i < students.length; i += BATCH_SIZE) {
        const batch = students.slice(i, i + BATCH_SIZE);
        
        const batchResults = await Promise.all(
          batch.map(async student => {
            const feedback = student.lastFeedback || '';
            const analysis = await analyzeSentiment(feedback);
            
            const attendanceRisk = student.Attendance ? 100 - student.Attendance : Math.floor(Math.random() * 100);
            const academicRisk = student.AssignmentsSubmitted ? 100 - student.AssignmentsSubmitted : Math.floor(Math.random() * 100);
            const engagementRisk = student.EngagementScore ? 100 - student.EngagementScore : Math.floor(Math.random() * 100);
            const emotionalRisk = analysis?.documents[0]?.confidenceScores?.negative * 100 || Math.floor(Math.random() * 100);
            const behavioralRisk = Math.floor(Math.random() * 100);
            
            const detailedRisks = {
              academic: academicRisk,
              behavioral: behavioralRisk,
              attendance: attendanceRisk,
              engagement: engagementRisk,
              emotional: emotionalRisk
            };
            
            const weights = { academic: 0.25, behavioral: 0.2, attendance: 0.2, engagement: 0.15, emotional: 0.2 };
            let weightedSum = 0;
            let weightTotal = 0;
            
            Object.keys(weights).forEach(key => {
              if (detailedRisks[key] !== undefined) {
                weightedSum += detailedRisks[key] * weights[key];
                weightTotal += weights[key];
              }
            });
            
            const overallRiskScore = weightTotal > 0 ? weightedSum / weightTotal : emotionalRisk;
            
            return {
              ...student,
              RiskScore: Math.round(overallRiskScore),
              detailedRisks,
              sentimentScore: emotionalRisk
            };
          })
        );
        
        results.push(...batchResults);
        
        if (i + BATCH_SIZE < students.length) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }
      
      setProcessedData(results);
    } catch (error) {
      console.error("Processing failed:", error);
      setProcessedData(generateMockData());
    } finally {
      setLoading(false);
    }
  }, [analyzeSentiment]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'students'));
        const studentData = querySnapshot.docs.map(doc => {
          return { id: doc.id, ...doc.data() };
        });
        
        if (useMockData) {
          setProcessedData(generateMockData());
        } else {
          await processRealData(studentData);
        }
        
      } catch (error) {
        console.error('[ERROR] Data fetch failed:', error);
        setProcessedData(generateMockData());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [useMockData, processRealData]);
  
  const filteredData = processedData.filter(student => {
    if (filterLevel === 'all') return true;
    if (filterLevel === 'high') return student.RiskScore >= 70;
    if (filterLevel === 'medium') return student.RiskScore >= 30 && student.RiskScore < 70;
    if (filterLevel === 'low') return student.RiskScore < 30;
    return true;
  });
  
  const riskDistribution = {
    high: processedData.filter(s => s.RiskScore >= 70).length,
    medium: processedData.filter(s => s.RiskScore >= 30 && s.RiskScore < 70).length,
    low: processedData.filter(s => s.RiskScore < 30).length
  };

  const calculateCategoryRiskDistribution = () => {
    const schoolDistribution = {};
    const gradeDistribution = {};
    const attendanceRiskDistribution = {high: 0, medium: 0, low: 0};
    const academicRiskDistribution = {high: 0, medium: 0, low: 0};
    const engagementRiskDistribution = {high: 0, medium: 0, low: 0};
    
    processedData.forEach(student => {
      const school = student.School || 'Unknown';
      if (!schoolDistribution[school]) {
        schoolDistribution[school] = {high: 0, medium: 0, low: 0};
      }
      
      if (student.RiskScore >= 70) schoolDistribution[school].high++;
      else if (student.RiskScore >= 30) schoolDistribution[school].medium++;
      else schoolDistribution[school].low++;
      
      const grade = student.Grade || 'Unknown';
      if (!gradeDistribution[grade]) {
        gradeDistribution[grade] = {high: 0, medium: 0, low: 0};
      }
      
      if (student.RiskScore >= 70) gradeDistribution[grade].high++;
      else if (student.RiskScore >= 30) gradeDistribution[grade].medium++;
      else gradeDistribution[grade].low++;
      
      const attendanceRisk = 100 - (student.Attendance || 0);
      if (attendanceRisk >= 70) attendanceRiskDistribution.high++;
      else if (attendanceRisk >= 30) attendanceRiskDistribution.medium++;
      else attendanceRiskDistribution.low++;
      
      const academicRisk = 100 - (student.AssignmentsSubmitted || 0);
      if (academicRisk >= 70) academicRiskDistribution.high++;
      else if (academicRisk >= 30) academicRiskDistribution.medium++;
      else academicRiskDistribution.low++;
      
      const engagementRisk = 100 - (student.EngagementScore || 0);
      if (engagementRisk >= 70) engagementRiskDistribution.high++;
      else if (engagementRisk >= 30) engagementRiskDistribution.medium++;
      else engagementRiskDistribution.low++;
    });
    
    return {
      schoolDistribution,
      gradeDistribution,
      attendanceRiskDistribution,
      academicRiskDistribution,
      engagementRiskDistribution
    };
  };

  const distributionData = calculateCategoryRiskDistribution();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Student Risk Dashboard</h1>
          <p className="subtitle">Real-time risk assessment and intervention management</p>
        </div>
        
        <div className="header-right">
          <div className="risk-summary">
            <div className="risk-count high">
              <span className="count">{riskDistribution.high}</span>
              <span className="label">High Risk</span>
            </div>
            <div className="risk-count medium">
              <span className="count">{riskDistribution.medium}</span>
              <span className="label">Medium Risk</span>
            </div>
            <div className="risk-count low">
              <span className="count">{riskDistribution.low}</span>
              <span className="label">Low Risk</span>
            </div>
          </div>
          
          <div className="demo-controls">
            <button 
              onClick={() => setUseMockData(!useMockData)}
              className={`mock-toggle ${useMockData ? 'active' : ''}`}
            >
              {useMockData ? "🔄 Switch to Live Data" : "💡 Use Demo Mode"}
            </button>
          </div>
        </div>
      </div>
      
      <div className="dashboard-filters">
        <div className="view-toggle">
          <button 
            className={`view-btn ${activeView === 'radar' ? 'active' : ''}`}
            onClick={() => setActiveView('radar')}
          >
            Radar View
          </button>
          <button 
            className={`view-btn ${activeView === 'table' ? 'active' : ''}`}
            onClick={() => setActiveView('table')}
          >
            Table View
          </button>
          <button 
            className={`view-btn ${activeView === 'distribution' ? 'active' : ''}`}
            onClick={() => setActiveView('distribution')}
          >
            Distribution View
          </button>
        </div>
        
        <div className="risk-filter">
          <span>Filter by Risk: </span>
          <select 
            value={filterLevel} 
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <option value="all">All Students</option>
            <option value="high">High Risk Only</option>
            <option value="medium">Medium Risk Only</option>
            <option value="low">Low Risk Only</option>
          </select>
        </div>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading-container">
            <LoadingSpinner />
            <p className="loading-text">Analyzing Student Data...</p>
            <p className="loading-subtext">Processing risk factors and sentiment analysis</p>
          </div>
        ) : (
          <>
            {activeView === 'radar' && (
              <div className="radar-view">
                <RiskRadarChart data={filteredData} />
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-color high-risk"></span>
                    High Risk (70-100%)
                  </div>
                  <div className="legend-item">
                    <span className="legend-color medium-risk"></span>
                    Medium Risk (30-69%)
                  </div>
                  <div className="legend-item">
                    <span className="legend-color low-risk"></span>
                    Low Risk (0-29%)
                  </div>
                </div>
              </div>
            )}
            
            {activeView === 'table' && (
              <div className="table-view">
                <StudentTable 
                  students={filteredData} 
                  columns={[
                    { key: 'Name', label: 'Student Name' },
                    { key: 'Grade', label: 'Grade' },
                    { key: 'School', label: 'School' },
                    { key: 'Counselor', label: 'Counselor' },
                    { key: 'RiskScore', label: 'Risk Score', type: 'risk' },
                    { key: 'Attendance', label: 'Attendance %' },
                    { key: 'AssignmentsSubmitted', label: 'Assignments %' },
                    { key: 'EngagementScore', label: 'Engagement' },
                    { key: 'LastLoginDate', label: 'Last Login', type: 'date' },
                  ]}
                  onStudentSelect={handleStudentSelect}
                />
              </div>
            )}
            
            {activeView === 'distribution' && (
              <div className="distribution-view">
                <RiskDistributionChart 
                  overallDistribution={riskDistribution}
                  categoryDistributions={distributionData}
                />
              </div>
            )}
          </>
        )}
      </div>

      <DashboardAgent 
        students={processedData} 
        selectedStudent={selectedStudentForAgent} 
      />
      
      <div className="dashboard-footer">
        <p>Last updated: {new Date().toLocaleString()}</p>
        <button className="refresh-btn" onClick={() => {
          setLoading(true);
          setTimeout(() => {
            setProcessedData(generateMockData());
            setLoading(false);
          }, 1500);
        }}>Refresh Data</button>
      </div>
    </div>
  );
};

export default Dashboard;