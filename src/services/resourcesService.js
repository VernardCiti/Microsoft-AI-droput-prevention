// src/services/resourcesService.js
import { collection, getDocs, addDoc, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

// Resource categories aligned with risk categories
export const RESOURCE_CATEGORIES = [
  'academic',
  'attendance',
  'behavioral',
  'emotional',
  'engagement'
];

export const useResourcesService = () => {
  // Fetch all available resources
  const getAllResources = async () => {
    try {
      const resourcesSnapshot = await getDocs(collection(db, 'resources'));
      return resourcesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching resources:', error);
      return [];
    }
  };

  // Fetch resources by category
  const getResourcesByCategory = async (category) => {
    try {
      const q = query(
        collection(db, 'resources'),
        where('category', '==', category)
      );
      
      const resourcesSnapshot = await getDocs(q);
      return resourcesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error fetching ${category} resources:`, error);
      return [];
    }
  };

  // Get resources recommended for a student
  const getStudentResources = async (studentId) => {
    try {
      const q = query(
        collection(db, 'student_resources'),
        where('studentId', '==', studentId)
      );
      
      const resourcesSnapshot = await getDocs(q);
      const recommendationData = resourcesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // If we have recommendations, fetch the full resource details
      if (recommendationData.length > 0) {
        const resourceIds = recommendationData.map(rec => rec.resourceId);
        const resources = [];
        
        // Fetch each resource individually
        for (const resourceId of resourceIds) {
          const resourceDoc = await doc(db, 'resources', resourceId);
          const resourceData = await resourceDoc.data();
          
          if (resourceData) {
            resources.push({
              id: resourceId,
              ...resourceData,
              assignedDate: recommendationData.find(rec => rec.resourceId === resourceId)?.assignedDate
            });
          }
        }
        
        return resources;
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching student resources:`, error);
      return [];
    }
  };

  // Assign a resource to a student
  const assignResourceToStudent = async (studentId, resourceId, notes = '') => {
    try {
      const timestamp = new Date();
      
      await addDoc(collection(db, 'student_resources'), {
        studentId,
        resourceId,
        assignedDate: timestamp,
        notes,
        status: 'assigned'
      });
      
      return {
        success: true,
        message: 'Resource assigned successfully'
      };
    } catch (error) {
      console.error('Error assigning resource:', error);
      return {
        success: false,
        message: 'Failed to assign resource'
      };
    }
  };

  // Update a student's resource status
  const updateResourceStatus = async (assignmentId, newStatus, notes = '') => {
    try {
      const assignmentDoc = doc(db, 'student_resources', assignmentId);
      
      await updateDoc(assignmentDoc, {
        status: newStatus,
        notes: notes,
        updatedAt: new Date()
      });
      
      return {
        success: true,
        message: 'Resource status updated'
      };
    } catch (error) {
      console.error('Error updating resource status:', error);
      return {
        success: false,
        message: 'Failed to update resource status'
      };
    }
  };

  // Generate resource recommendations based on risk factors
  const generateRecommendations = async (student) => {
    try {
      // Extract risk factors from student data
      const risks = student.detailedRisks || {};
      
      // Sort risks by severity
      const sortedRisks = Object.entries(risks)
        .sort(([_, valueA], [__, valueB]) => valueB - valueA)
        .filter(([_, value]) => value > 30); // Only consider medium to high risks
      
      // Get top 2 risk categories
      const topRiskCategories = sortedRisks.slice(0, 2).map(([category]) => category);
      
      // Fetch resources for these categories
      const recommendedResources = [];
      for (const category of topRiskCategories) {
        const categoryResources = await getResourcesByCategory(category);
        recommendedResources.push(...categoryResources.slice(0, 3)); // Get top 3 resources per category
      }
      
      return recommendedResources;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  };

  // Mock resources for development and testing
  const getMockResources = () => {
    return [
      {
        id: 'r1',
        name: 'Academic Support Program',
        category: 'academic',
        type: 'Program',
        description: 'Structured academic support with tutoring and study skills',
        effectiveness: 85
      },
      {
        id: 'r2',
        name: 'Attendance Improvement Plan',
        category: 'attendance',
        type: 'Plan',
        description: 'Structured approach to improving attendance patterns',
        effectiveness: 70
      },
      {
        id: 'r3',
        name: 'Behavioral Counseling',
        category: 'behavioral',
        type: 'Service',
        description: 'One-on-one counseling for behavioral management',
        effectiveness: 75
      },
      {
        id: 'r4',
        name: 'Emotional Wellness Workshop',
        category: 'emotional',
        type: 'Workshop',
        description: 'Group sessions focused on emotional regulation and wellness',
        effectiveness: 80
      },
      {
        id: 'r5',
        name: 'Engagement Through Projects',
        category: 'engagement',
        type: 'Program',
        description: 'Project-based learning to increase student engagement',
        effectiveness: 90
      },
      {
        id: 'r6',
        name: 'Peer Tutoring',
        category: 'academic',
        type: 'Service',
        description: 'Connect with peer tutors for academic support',
        effectiveness: 85
      },
      {
        id: 'r7',
        name: 'Morning Check-in Program',
        category: 'attendance',
        type: 'Program',
        description: 'Daily morning check-ins to improve attendance',
        effectiveness: 75
      },
      {
        id: 'r8',
        name: 'Mindfulness Training',
        category: 'emotional',
        type: 'Workshop',
        description: 'Learn mindfulness techniques for emotional regulation',
        effectiveness: 70
      },
      {
        id: 'r9',
        name: 'Interest-Based Learning',
        category: 'engagement',
        type: 'Program',
        description: 'Customized learning based on student interests',
        effectiveness: 85
      },
      {
        id: 'r10',
        name: 'Social Skills Group',
        category: 'behavioral',
        type: 'Group',
        description: 'Peer group for developing social and behavioral skills',
        effectiveness: 80
      }
    ];
  };

  return {
    getAllResources,
    getResourcesByCategory,
    getStudentResources,
    assignResourceToStudent,
    updateResourceStatus,
    generateRecommendations,
    getMockResources
  };
};

export default useResourcesService;