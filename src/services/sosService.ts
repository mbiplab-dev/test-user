// =============================================================================
// SOS SERVICE (Frontend) - Updated with Complete i18n Implementation
// File path: src/services/sosService.ts
// =============================================================================

import authService from './authService';

// Types
interface SOSComplaint {
  _id?: string;
  userId?: string;
  category: string;
  title: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  contactInfo: string;
  alternateContact?: string;
  location: {
    address: string;
    coordinates?: [number, number];
    landmark?: string;
  };
  additionalInfo?: string;
  isEmergencySOS?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  complaintId?: string;
}

interface SubmitComplaintData {
  category: string;
  title: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  contactInfo: string;
  alternateContact?: string;
  location: {
    address: string;
    coordinates?: [number, number];
    landmark?: string;
  };
  additionalInfo?: string;
  isEmergencySOS?: boolean;
  metadata?: any;
}

interface EmergencySOSData {
  description?: string;
  location?: {
    address?: string;
    coordinates?: [number, number];
    landmark?: string;
  };
  metadata?: any;
}

interface ComplaintResponse {
  message: string;
  complaint: SOSComplaint;
}

interface ComplaintsListResponse {
  message: string;
  complaints: SOSComplaint[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ComplaintStats {
  total: number;
  resolved: number;
  emergency: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byUrgency: Record<string, number>;
  averageRating: number;
}

interface ComplaintStatsResponse {
  message: string;
  stats: ComplaintStats;
}

interface Communication {
  from: 'user' | 'officer' | 'system';
  message: string;
  timestamp: string;
  officerId?: string;
}

interface CommunicationResponse {
  message: string;
  communication: Communication;
}

interface FeedbackData {
  rating: number;
  comment?: string;
}

interface FeedbackResponse {
  message: string;
  feedback: {
    rating: number;
    comment?: string;
    submittedAt: string;
  };
}

class SOSService {
  // Submit regular help request
  async submitComplaint(data: SubmitComplaintData): Promise<SOSComplaint> {
    try {
      const response = await authService.apiRequest('/sos/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit complaint');
      }

      const result: ComplaintResponse = await response.json();
      return result.complaint;
    } catch (error) {
      console.error('Submit complaint error:', error);
      throw error;
    }
  }

  // Submit emergency SOS
  async submitEmergencySOS(data: EmergencySOSData = {}): Promise<SOSComplaint> {
    try {
      const response = await authService.apiRequest('/sos/emergency', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit emergency SOS');
      }

      const result: ComplaintResponse = await response.json();
      return result.complaint;
    } catch (error) {
      console.error('Submit emergency SOS error:', error);
      throw error;
    }
  }

  // Get user's complaints
  async getUserComplaints(options: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    urgency?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<ComplaintsListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.status) params.append('status', options.status);
      if (options.category) params.append('category', options.category);
      if (options.urgency) params.append('urgency', options.urgency);
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);

      const response = await authService.apiRequest(`/sos?${params.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get complaints');
      }

      return await response.json();
    } catch (error) {
      console.error('Get user complaints error:', error);
      throw error;
    }
  }

  // Get complaint details
  async getComplaintDetails(complaintId: string): Promise<SOSComplaint> {
    try {
      const response = await authService.apiRequest(`/sos/${complaintId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Complaint not found');
      }

      const result: ComplaintResponse = await response.json();
      return result.complaint;
    } catch (error) {
      console.error('Get complaint details error:', error);
      throw error;
    }
  }

  // Add communication to complaint
  async addCommunication(complaintId: string, message: string): Promise<Communication> {
    try {
      const response = await authService.apiRequest(`/sos/${complaintId}/communication`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add communication');
      }

      const result: CommunicationResponse = await response.json();
      return result.communication;
    } catch (error) {
      console.error('Add communication error:', error);
      throw error;
    }
  }

  // Submit feedback for resolved complaint
  async submitFeedback(complaintId: string, data: FeedbackData): Promise<FeedbackResponse['feedback']> {
    try {
      const response = await authService.apiRequest(`/sos/${complaintId}/feedback`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit feedback');
      }

      const result: FeedbackResponse = await response.json();
      return result.feedback;
    } catch (error) {
      console.error('Submit feedback error:', error);
      throw error;
    }
  }

  // Get user complaint statistics
  async getUserComplaintStats(): Promise<ComplaintStats> {
    try {
      const response = await authService.apiRequest('/sos/stats/user', {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get complaint stats');
      }

      const result: ComplaintStatsResponse = await response.json();
      return result.stats;
    } catch (error) {
      console.error('Get complaint stats error:', error);
      throw error;
    }
  }

  // Cancel complaint
  async cancelComplaint(complaintId: string, reason?: string): Promise<void> {
    try {
      const response = await authService.apiRequest(`/sos/${complaintId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel complaint');
      }
    } catch (error) {
      console.error('Cancel complaint error:', error);
      throw error;
    }
  }

  // Utility method to format complaint data for display
  formatComplaintData(complaint: SOSComplaint): any {
    return {
      ...complaint,
      formattedDate: complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : '',
      formattedTime: complaint.createdAt ? new Date(complaint.createdAt).toLocaleTimeString() : '',
      urgencyColor: this.getUrgencyColor(complaint.urgency),
      statusColor: this.getStatusColor(complaint.status || 'submitted'),
      categoryIcon: this.getCategoryIcon(complaint.category)
    };
  }

  // Get urgency color
  private getUrgencyColor(urgency: string): string {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  // Get status color
  private getStatusColor(status: string): string {
    switch (status) {
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'assigned': return 'text-purple-600 bg-purple-100';
      case 'under_review': return 'text-yellow-600 bg-yellow-100';
      case 'submitted': return 'text-gray-600 bg-gray-100';
      case 'closed': return 'text-gray-500 bg-gray-50';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  // Get category icon
  private getCategoryIcon(category: string): string {
    switch (category) {
      case 'missing_person': return '👤';
      case 'fire_emergency': return '🔥';
      case 'theft_robbery': return '🚨';
      case 'accident': return '🚗';
      case 'medical_help': return '🏥';
      case 'harassment': return '⚠️';
      case 'fraud': return '💳';
      case 'traffic_violation': return '🚦';
      case 'noise_complaint': return '🔊';
      case 'general_help': return '🆘';
      default: return '❓';
    }
  }

  // Quick emergency location detection
  async getCurrentLocation(): Promise<{ address: string; coordinates?: [number, number] }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ address: 'Location not available' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Try to get address from coordinates (you can implement reverse geocoding)
            const address = await this.reverseGeocode(latitude, longitude);
            resolve({
              address: address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              coordinates: [longitude, latitude]
            });
          } catch (error) {
            resolve({
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              coordinates: [longitude, latitude]
            });
          }
        },
        () => {
          resolve({ address: 'Current location' });
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    });
  }

  // Reverse geocoding (placeholder - implement with your preferred service)
  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    // This is a placeholder - implement with Mapbox, Google Maps, or other service
    // For now, return a generic address
    return `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  // Validate complaint data before submission (overloaded for backward compatibility)
  validateComplaintData(data: SubmitComplaintData): { isValid: boolean; errors: string[] };
  validateComplaintData(data: SubmitComplaintData, t: any): { isValid: boolean; errors: string[] };
  validateComplaintData(data: SubmitComplaintData, t?: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.category) {
      errors.push(t ? t('sos.selectCategory') : 'Category is required');
    }

    if (!data.title?.trim()) {
      errors.push(t ? t('trip.validationErrors.nameRequired') : 'Title is required');
    }

    if (!data.description?.trim()) {
      errors.push(t ? `${t('common.description')} ${t('common.required').toLowerCase()}` : 'Description is required');
    }

    if (!data.contactInfo?.trim()) {
      errors.push(t ? `${t('sos.contactInfo')} ${t('common.required').toLowerCase()}` : 'Contact information is required');
    }

    if (!data.location?.address?.trim()) {
      errors.push(t ? `${t('common.location')} ${t('common.required').toLowerCase()}` : 'Location address is required');
    }

    if (data.title && data.title.length > 200) {
      errors.push('Title cannot exceed 200 characters');
    }

    if (data.description && data.description.length > 2000) {
      errors.push('Description cannot exceed 2000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get help category options (with i18n keys)
  getHelpCategories() {
    return [
      {
        id: 'missing_person',
        title: 'Missing Person',
        description: 'Report a missing group member or individual',
        titleKey: 'sosHistory.missingPerson',
        descriptionKey: 'sos.emergencyTypes.missing_person',
        urgency: 'high' as const,
        icon: '👤'
      },
      {
        id: 'fire_emergency',
        title: 'Fire Emergency',
        description: 'Fire incident or smoke detection',
        titleKey: 'sosHistory.fireEmergency',
        descriptionKey: 'sos.emergencyTypes.fire_emergency',
        urgency: 'critical' as const,
        icon: '🔥'
      },
      {
        id: 'theft_robbery',
        title: 'Theft/Robbery',
        description: 'Report stolen items or robbery incident',
        titleKey: 'sosHistory.theftRobbery',
        descriptionKey: 'sos.emergencyTypes.theft_robbery',
        urgency: 'high' as const,
        icon: '🚨'
      },
      {
        id: 'accident',
        title: 'Accident',
        description: 'Traffic accident or injury incident',
        titleKey: 'sosHistory.accident',
        descriptionKey: 'sos.emergencyTypes.accident',
        urgency: 'critical' as const,
        icon: '🚗'
      },
      {
        id: 'medical_help',
        title: 'Medical Help',
        description: 'Non-emergency medical assistance',
        titleKey: 'sosHistory.medicalHelp',
        descriptionKey: 'sos.emergencyTypes.medical',
        urgency: 'medium' as const,
        icon: '🏥'
      },
      {
        id: 'general_help',
        title: 'General Help',
        description: 'Other assistance or information needed',
        titleKey: 'sosHistory.generalHelp',
        descriptionKey: 'sos.emergencyTypes.other',
        urgency: 'low' as const,
        icon: '🆘'
      }
    ];
  }

  // Get translated status text
  getStatusText(status: string, t: any): string {
    switch (status) {
      case 'submitted': return t('sosHistory.submitted');
      case 'under_review': return t('sosHistory.underReview');
      case 'assigned': return t('sosHistory.assigned');
      case 'in_progress': return t('sosHistory.inProgress');
      case 'resolved': return t('sosHistory.resolved');
      case 'closed': return t('sosHistory.closed');
      default: return status;
    }
  }

  // Get translated urgency text
  getUrgencyText(urgency: string, t: any): string {
    switch (urgency) {
      case 'low': return t('sos.urgency.low');
      case 'medium': return t('sos.urgency.medium');
      case 'high': return t('sos.urgency.high');
      case 'critical': return t('sos.urgency.critical');
      default: return urgency;
    }
  }

  // Get translated category text
  getCategoryText(category: string, t: any): string {
    switch (category) {
      case 'missing_person': return t('sosHistory.missingPerson');
      case 'fire_emergency': return t('sosHistory.fireEmergency');
      case 'theft_robbery': return t('sosHistory.theftRobbery');
      case 'accident': return t('sosHistory.accident');
      case 'medical_help': return t('sosHistory.medicalHelp');
      case 'general_help': return t('sosHistory.generalHelp');
      default: return category;
    }
  }

  // Format time with i18n support
  formatRelativeTime(dateString: string, t: any): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffDays === 0) {
      if (diffHours === 0) {
        return t('emergencyContacts.justNow');
      }
      return t('emergencyContacts.hoursAgo', { hours: diffHours });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return t('emergencyContacts.daysAgo', { days: diffDays });
    } else {
      return date.toLocaleDateString();
    }
  }
}

// Create and export a singleton instance
const sosService = new SOSService();
export default sosService;

// Export types
export type {
  SOSComplaint,
  SubmitComplaintData,
  EmergencySOSData,
  ComplaintResponse,
  ComplaintsListResponse,
  ComplaintStats,
  Communication,
  FeedbackData
};