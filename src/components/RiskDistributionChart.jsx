import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './RiskDistributionChart.css';

const RiskDistributionChart = ({ overallDistribution, categoryDistributions }) => {
  const [activeTab, setActiveTab] = useState('overall');
  
  // Colors for risk levels
  const COLORS = {
    high: '#e74c3c',
    medium: '#f39c12',
    low: '#2ecc71'
  };
  
  // Preprocessing data for the overall distribution
  const prepareOverallData = () => {
    // Convert the overall distribution to an array format for the charts
    return [
      {
        name: 'High Risk',
        value: overallDistribution.high,
        color: COLORS.high
      },
      {
        name: 'Medium Risk',
        value: overallDistribution.medium,
        color: COLORS.medium
      },
      {
        name: 'Low Risk',
        value: overallDistribution.low,
        color: COLORS.low
      }
    ];
  };
  
  // Prepare data for grade distribution
  const prepareGradeData = () => {
    return Object.entries(categoryDistributions.gradeDistribution).map(([grade, counts]) => ({
      name: grade,
      high: counts.high,
      medium: counts.medium,
      low: counts.low
    }));
  };
  
  // Prepare data for school distribution
  const prepareSchoolData = () => {
    return Object.entries(categoryDistributions.schoolDistribution).map(([school, counts]) => ({
      name: school,
      high: counts.high,
      medium: counts.medium,
      low: counts.low
    }));
  };
  
  // Prepare data for attendance risk
  const prepareAttendanceData = () => {
    const { attendanceRiskDistribution } = categoryDistributions;
    return [
      {
        name: 'High Risk (0-70% attendance)',
        value: attendanceRiskDistribution.high,
        color: COLORS.high
      },
      {
        name: 'Medium Risk (70-90% attendance)',
        value: attendanceRiskDistribution.medium,
        color: COLORS.medium
      },
      {
        name: 'Low Risk (90-100% attendance)',
        value: attendanceRiskDistribution.low,
        color: COLORS.low
      }
    ];
  };
  
  // Prepare data for academic risk (assignments)
  const prepareAcademicData = () => {
    const { academicRiskDistribution } = categoryDistributions;
    return [
      {
        name: 'High Risk (<70% completed)',
        value: academicRiskDistribution.high,
        color: COLORS.high
      },
      {
        name: 'Medium Risk (70-90% completed)',
        value: academicRiskDistribution.medium,
        color: COLORS.medium
      },
      {
        name: 'Low Risk (90-100% completed)',
        value: academicRiskDistribution.low,
        color: COLORS.low
      }
    ];
  };
  
  // Prepare data for engagement risk
  const prepareEngagementData = () => {
    const { engagementRiskDistribution } = categoryDistributions;
    return [
      {
        name: 'High Risk (<30% engagement)',
        value: engagementRiskDistribution.high,
        color: COLORS.high
      },
      {
        name: 'Medium Risk (30-70% engagement)',
        value: engagementRiskDistribution.medium,
        color: COLORS.medium
      },
      {
        name: 'Low Risk (70-100% engagement)',
        value: engagementRiskDistribution.low,
        color: COLORS.low
      }
    ];
  };
  
  const overallData = prepareOverallData();
  const gradeData = prepareGradeData();
  const schoolData = prepareSchoolData();
  const attendanceData = prepareAttendanceData();
  const academicData = prepareAcademicData();
  const engagementData = prepareEngagementData();
  
  // Custom tooltip for the charts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${payload[0].name}: ${payload[0].value}`}</p>
          {payload[0].payload.percentage && (
            <p className="percentage">{`${payload[0].payload.percentage.toFixed(1)}%`}</p>
          )}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="risk-distribution-container">
      <div className="distribution-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overall' ? 'active' : ''}`}
          onClick={() => setActiveTab('overall')}
        >
          Overall Risk
        </button>
        <button 
          className={`tab-btn ${activeTab === 'grade' ? 'active' : ''}`}
          onClick={() => setActiveTab('grade')}
        >
          By Grade
        </button>
        <button 
          className={`tab-btn ${activeTab === 'school' ? 'active' : ''}`}
          onClick={() => setActiveTab('school')}
        >
          By School
        </button>
        <button 
          className={`tab-btn ${activeTab === 'category' ? 'active' : ''}`}
          onClick={() => setActiveTab('category')}
        >
          By Risk Category
        </button>
      </div>
      
      <div className="distribution-content">
        {activeTab === 'overall' && (
          <div className="overall-distribution">
            <h3>Overall Student Risk Distribution</h3>
            <div className="chart-container">
              <div className="pie-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={overallData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {overallData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="summary-stats">
                <div className="stat-card high">
                  <h4>High Risk Students</h4>
                  <div className="stat-value">{overallDistribution.high}</div>
                  <div className="stat-percentage">
                    {((overallDistribution.high / (overallDistribution.high + overallDistribution.medium + overallDistribution.low)) * 100).toFixed(1)}%
                  </div>
                </div>
                
                <div className="stat-card medium">
                  <h4>Medium Risk Students</h4>
                  <div className="stat-value">{overallDistribution.medium}</div>
                  <div className="stat-percentage">
                    {((overallDistribution.medium / (overallDistribution.high + overallDistribution.medium + overallDistribution.low)) * 100).toFixed(1)}%
                  </div>
                </div>
                
                <div className="stat-card low">
                  <h4>Low Risk Students</h4>
                  <div className="stat-value">{overallDistribution.low}</div>
                  <div className="stat-percentage">
                    {((overallDistribution.low / (overallDistribution.high + overallDistribution.medium + overallDistribution.low)) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'grade' && (
          <div className="grade-distribution">
            <h3>Risk Distribution by Grade Level</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={gradeData}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Number of Students', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="high" name="High Risk" stackId="a" fill={COLORS.high} />
                <Bar dataKey="medium" name="Medium Risk" stackId="a" fill={COLORS.medium} />
                <Bar dataKey="low" name="Low Risk" stackId="a" fill={COLORS.low} />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="distribution-insights">
              <h4>Grade Level Risk Insights:</h4>
              <ul>
                {gradeData.map(grade => (
                  <li key={grade.name}>
                    <strong>{grade.name}:</strong> {grade.high + grade.medium + grade.low} total students,
                    with {grade.high} high risk ({((grade.high / (grade.high + grade.medium + grade.low)) * 100).toFixed(1)}%),
                    {grade.medium} medium risk, and {grade.low} low risk students.
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {activeTab === 'school' && (
          <div className="school-distribution">
            <h3>Risk Distribution by School</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={schoolData}
                margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Number of Students', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="high" name="High Risk" stackId="a" fill={COLORS.high} />
                <Bar dataKey="medium" name="Medium Risk" stackId="a" fill={COLORS.medium} />
                <Bar dataKey="low" name="Low Risk" stackId="a" fill={COLORS.low} />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="distribution-insights">
              <h4>School Risk Insights:</h4>
              <ul>
                {schoolData.map(school => (
                  <li key={school.name}>
                    <strong>{school.name}:</strong> {school.high + school.medium + school.low} total students,
                    with a {((school.high / (school.high + school.medium + school.low)) * 100).toFixed(1)}% high risk rate.
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {activeTab === 'category' && (
          <div className="category-distribution">
            <h3>Distribution by Risk Category</h3>
            
            <div className="risk-categories">
              <div className="risk-category">
                <h4>Attendance Risk</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="risk-category">
                <h4>Academic Risk (Assignments)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={academicData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {academicData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="risk-category">
                <h4>Engagement Risk</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={engagementData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="category-insights">
              <h4>Key Insights:</h4>
              <ul>
                <li><strong>Attendance Risk:</strong> {attendanceData[0].value} students with attendance below 70%</li>
                <li><strong>Academic Risk:</strong> {academicData[0].value} students with less than 70% of assignments completed</li>
                <li><strong>Engagement Risk:</strong> {engagementData[0].value} students with low engagement scores</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskDistributionChart;