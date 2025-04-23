import React, { useState, useCallback } from 'react';
import './StudentTable.css';
import CopilotDialog from './CopilotDialog';

const StudentTable = ({ students, columns }) => {
  // Add this state for tracking copilot dialog
  const [copilotStudent, setCopilotStudent] = useState(null);
  
  const [sortField, setSortField] = useState('RiskScore');
  const [sortDirection, setSortDirection] = useState('desc');
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [filterText, setFilterText] = useState('');

  // Add this handler for the copilot button
  const handleCopilotAssistant = useCallback((student) => {
    setCopilotStudent(student);
  }, []);

  // Add this handler to close the copilot dialog
  const handleCloseCopilot = useCallback(() => {
    setCopilotStudent(null);
  }, []);

  // Handle column sorting
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // Toggle expanded student row
  const toggleExpandedStudent = useCallback((studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  }, [expandedStudent]);

  // Format cell values appropriately based on column type
  const formatCellValue = useCallback((student, column) => {
    const value = student[column.key];
    
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    if (column.key === 'RiskScore') {
      return (
        <div className="risk-score-wrapper">
          <div
            className={`risk-score-indicator ${getRiskLevelClass(value)}`}
            style={{ width: `${value}%` }}
          ></div>
          <span className="risk-score-text">{value}</span>
        </div>
      );
    } else if (column.key === 'LastActivity' || column.key === 'EnrollmentDate' || value instanceof Date) {
      return formatDate(value);
    } else {
      return String(value); // Convert any value to string to be safe
    }
  }, []);
  
  // Format date nicely - handle both Date objects and date strings
  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    
    let date;
    if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      try {
        date = new Date(dateValue);
        // Check if date is valid
        if (isNaN(date.getTime())) {
          return String(dateValue);
        }
      } catch (e) {
        return String(dateValue);
      }
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Get risk level class based on score
  const getRiskLevelClass = (score) => {
    if (score >= 70) return 'high-risk';
    if (score >= 30) return 'medium-risk';
    return 'low-risk';
  };

  // Filter and sort students
  const sortedAndFilteredStudents = useCallback(() => {
    // First, filter based on search text
    const filtered = students.filter(student => {
      if (!filterText) return true;
      
      const searchText = filterText.toLowerCase();
      return (
        (student.FirstName && student.FirstName.toLowerCase().includes(searchText)) ||
        (student.LastName && student.LastName.toLowerCase().includes(searchText)) ||
        (student.Name && student.Name.toLowerCase().includes(searchText)) ||
        (student.Grade && student.Grade.toString().includes(searchText)) ||
        (student.RiskScore && student.RiskScore.toString().includes(searchText))
      );
    });

    // Then sort
    return [...filtered].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [students, sortField, sortDirection, filterText]);

  // Handle button actions
  const handleViewStudent = useCallback((student) => {
    toggleExpandedStudent(student.StudentID);
  }, [toggleExpandedStudent]);

  const handleContactStudent = useCallback((student) => {
    alert(`Contacting ${student.Name || `${student.FirstName} ${student.LastName}`}`);
    // Implement your contact functionality here
  }, []);

  const handleCreatePlan = useCallback((student) => {
    alert(`Creating intervention plan for ${student.Name || `${student.FirstName} ${student.LastName}`}`);
    // Implement your plan creation functionality here
  }, []);

  const handleScheduleMeeting = useCallback((student) => {
    alert(`Scheduling meeting with ${student.Name || `${student.FirstName} ${student.LastName}`}`);
    // Implement your meeting scheduling functionality here
  }, []);

  return (
    <div className="student-table-container">
      <div className="table-controls">
        <div className="table-filter">
          <input
            type="text"
            placeholder="Search students..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
      </div>
      
      <table className="student-table">
        <thead>
          <tr>
            {columns.map(column => (
              <th
                key={column.key}
                onClick={() => handleSort(column.key)}
                className={sortField === column.key ? `sorting-${sortDirection}` : ''}
              >
                {column.label}
                {sortField === column.key && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
            ))}
            <th className="action-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedAndFilteredStudents().map(student => (
            <React.Fragment key={student.StudentID}>
              <tr
                className={`student-row ${getRiskLevelClass(student.RiskScore)}-row`}
              >
                {columns.map(column => (
                  <td key={`${student.StudentID}-${column.key}`}>
                    {formatCellValue(student, column)}
                  </td>
                ))}
                <td className="action-buttons">
                  <button 
                    className="action-btn view-btn"
                    onClick={() => handleViewStudent(student)}
                  >
                    {expandedStudent === student.StudentID ? 'Hide Details' : 'View'}
                  </button>
                  <button 
                    className="action-btn contact-btn"
                    onClick={() => handleContactStudent(student)}
                  >
                    Contact
                  </button>
                  {/* Add the Copilot button */}
                  <button 
                    className="action-btn copilot-btn"
                    onClick={() => handleCopilotAssistant(student)}
                  >
                    Copilot
                  </button>
                </td>
              </tr>
              {expandedStudent === student.StudentID && (
                <tr className="expanded-row">
                  <td colSpan={columns.length + 1}>
                    <div className="student-details">
                      <div className="details-section">
                        <h4>Risk Breakdown</h4>
                        <div className="risk-breakdown">
                          {student.detailedRisks && Object.entries(student.detailedRisks).map(([category, score]) => (
                            <div key={category} className="risk-category">
                              <span className="category-name">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                              <div className="category-score-wrapper">
                                <div
                                  className={`category-score-indicator ${getRiskLevelClass(score)}`}
                                  style={{ width: `${score}%` }}
                                ></div>
                                <span className="category-score-text">{score}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    
                      <div className="details-section">
                        <h4>Latest Feedback</h4>
                        <p className="feedback-text">{student.lastFeedback || student.LastFeedback || 'No feedback recorded'}</p>
                      </div>
                    
                      <div className="details-section">
                        <h4>Counselor Notes</h4>
                        <p className="counselor-notes">{student.Notes || student.counselorNotes || 'No notes recorded'}</p>
                      </div>
                    
                      <div className="action-buttons expanded-actions">
                        <button 
                          className="action-btn contact"
                          onClick={() => handleContactStudent(student)}
                        >
                          Contact Student
                        </button>
                        <button 
                          className="action-btn plan"
                          onClick={() => handleCreatePlan(student)}
                        >
                          Create Intervention Plan
                        </button>
                        <button 
                          className="action-btn schedule"
                          onClick={() => handleScheduleMeeting(student)}
                        >
                          Schedule Meeting
                        </button>
                        <button 
                          className="action-btn copilott"
                          onClick={() => handleCopilotAssistant(student)}
                        >
                          Copilot Assistant
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
          {sortedAndFilteredStudents().length === 0 && (
            <tr className="no-results">
              <td colSpan={columns.length + 1}>No students match your search criteria</td>
            </tr>
          )}
        </tbody>
      </table>
      
      {/* Render the CopilotDialog when a student is selected */}
      {copilotStudent && (
        <CopilotDialog 
          student={copilotStudent}
          onClose={handleCloseCopilot}
          resources={[]} // Replace with your actual resources data when available
        />
      )}
    </div>
  );
};

export default StudentTable;