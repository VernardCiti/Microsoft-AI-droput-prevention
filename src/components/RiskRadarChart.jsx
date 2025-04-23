// src/components/RiskRadarChart.jsx
import React, { useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer } from 'recharts';
import './RiskRadarChart.css';

const RiskRadarChart = ({ data }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // If no data, show a message
  if (!data || data.length === 0) {
    return (
      <div className="no-data-message">
        <p>No student data available for visualization</p>
      </div>
    );
  }
  
  // Transform student risk data for the radar chart
  const prepareRadarData = (student) => {
    if (!student || !student.detailedRisks) return [];
    
    return [
      { subject: 'Academic', value: student.detailedRisks.academic || 0 },
      { subject: 'Behavioral', value: student.detailedRisks.behavioral || 0 },
      { subject: 'Attendance', value: student.detailedRisks.attendance || 0 },
      { subject: 'Engagement', value: student.detailedRisks.engagement || 0 },
      { subject: 'Emotional', value: student.detailedRisks.emotional || 0 }
    ];
  };
  
  // Calculate average risk scores
  const calculateAverageRisks = () => {
    const totals = {
      academic: 0,
      behavioral: 0,
      attendance: 0,
      engagement: 0,
      emotional: 0
    };
    
    data.forEach(student => {
      if (student.detailedRisks) {
        Object.keys(totals).forEach(key => {
          totals[key] += student.detailedRisks[key] || 0;
        });
      }
    });
    
    return [
      { subject: 'Academic', value: Math.round(totals.academic / data.length) },
      { subject: 'Behavioral', value: Math.round(totals.behavioral / data.length) },
      { subject: 'Attendance', value: Math.round(totals.attendance / data.length) },
      { subject: 'Engagement', value: Math.round(totals.engagement / data.length) },
      { subject: 'Emotional', value: Math.round(totals.emotional / data.length) }
    ];
  };
  
  // Get high risk students (top 5)
  const getHighRiskStudents = () => {
    return [...data]
      .sort((a, b) => b.RiskScore - a.RiskScore)
      .slice(0, 5);
  };
  
  const averageData = calculateAverageRisks();
  const highRiskStudents = getHighRiskStudents();
  const radarData = selectedStudent ? prepareRadarData(selectedStudent) : averageData;
  
  // Calculate risk level class
  const getRiskClass = (score) => {
    if (score >= 70) return 'high-risk';
    if (score >= 30) return 'medium-risk';
    return 'low-risk';
  };
  
  return (
    <div className="risk-radar-container">
      <div className="radar-header">
        <h3>Student Risk Analysis</h3>
        <div className="radar-selection">
          <span>Selected: </span>
          <select 
            value={selectedStudent ? selectedStudent.StudentID : 'average'} 
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'average') {
                setSelectedStudent(null);
              } else {
                const student = data.find(s => s.StudentID === value);
                setSelectedStudent(student);
              }
            }}
          >
            <option value="average">Class Average</option>
            {data.map(student => (
              <option key={student.StudentID} value={student.StudentID}>
                {student.FirstName} {student.LastName}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="risk-visualization">
        <div className="radar-chart">
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar
                name={selectedStudent ? `${selectedStudent.FirstName} ${selectedStudent.LastName}` : "Class Average"}
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="high-risk-students">
          <h4>High Risk Students</h4>
          <ul className="risk-list">
            {highRiskStudents.map(student => (
              <li 
                key={student.StudentID}
                className={`risk-student ${getRiskClass(student.RiskScore)}`}
                onClick={() => setSelectedStudent(student)}
              >
                <span className="student-name">{student.FirstName} {student.LastName}</span>
                <span className="risk-score">{student.RiskScore}</span>
                <div className="risk-indicators">
                  {student.detailedRisks && student.detailedRisks.academic >= 70 && <span className="risk-flag academic">A</span>}
                  {student.detailedRisks && student.detailedRisks.behavioral >= 70 && <span className="risk-flag behavioral">B</span>}
                  {student.detailedRisks && student.detailedRisks.attendance >= 70 && <span className="risk-flag attendance">At</span>}
                  {student.detailedRisks && student.detailedRisks.engagement >= 70 && <span className="risk-flag engagement">E</span>}
                  {student.detailedRisks && student.detailedRisks.emotional >= 70 && <span className="risk-flag emotional">Em</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {selectedStudent && (
        <div className="student-details">
          <h4>Details for {selectedStudent.FirstName} {selectedStudent.LastName}</h4>
          <div className="risk-breakdown">
            <div className={`overall-risk ${getRiskClass(selectedStudent.RiskScore)}`}>
              <span>Overall Risk: {selectedStudent.RiskScore}</span>
            </div>
            <div className="risk-factors">
              {radarData.map(item => (
                <div key={item.subject} className={`risk-factor ${getRiskClass(item.value)}`}>
                  <span className="factor-name">{item.subject}:</span>
                  <span className="factor-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="student-notes">
            <h5>Notes & Interventions</h5>
            <p>{selectedStudent.Notes || "No notes available for this student."}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskRadarChart;