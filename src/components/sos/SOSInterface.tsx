import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  UserX,
  Flame,
  ShieldAlert,
  Car,
  HeartHandshake,
  Send,
  Clock,
} from "lucide-react";
import { toast } from "react-hot-toast";
import type { SOSState } from "../../types";
import Header from "../layout/Header";
import sosService, { type SOSComplaint } from "../../services/sosService";

interface SOSInterfaceProps {
  sosState: SOSState;
  swipeProgress: number;
  currentLocation: string;
  onSwipeStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onClose: () => void;
  sosMapContainer: React.RefObject<HTMLDivElement | null>;
}

interface HelpRequest {
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: string;
  contactInfo: string;
  additionalInfo?: string;
}

const SOSInterface: React.FC<SOSInterfaceProps> = ({
  sosState,
  swipeProgress,
  currentLocation,
  onSwipeStart,
  sosMapContainer,
}) => {
  const { t } = useTranslation();
  const [showHelpForm, setShowHelpForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentComplaints, setRecentComplaints] = useState<SOSComplaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);
  const [currentLocationData, setCurrentLocationData] = useState<{
    address: string;
    coordinates?: [number, number];
  }>({ address: currentLocation });

  const [helpRequest, setHelpRequest] = useState<HelpRequest>({
    category: '',
    urgency: 'medium',
    title: '',
    description: '',
    location: currentLocation,
    contactInfo: '',
    additionalInfo: ''
  });

  // Load current location and recent complaints on mount
  useEffect(() => {
    loadCurrentLocation();
    loadRecentComplaints();
  }, []);

  const loadCurrentLocation = async () => {
    try {
      const location = await sosService.getCurrentLocation();
      setCurrentLocationData(location);
      setHelpRequest(prev => ({ ...prev, location: location.address }));
    } catch (error) {
      console.error('Failed to get current location:', error);
    }
  };

  const loadRecentComplaints = async () => {
    try {
      setIsLoadingComplaints(true);
      const response = await sosService.getUserComplaints({ 
        limit: 5,
        page: 1
      });
      setRecentComplaints(response.complaints);
    } catch (error) {
      console.error('Failed to load recent complaints:', error);
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  // Get help categories with localized titles and descriptions
  const getLocalizedHelpCategories = () => {
    return sosService.getHelpCategories().map(category => {
      // Map category IDs to the correct JSON keys
      const getCategoryTitleKey = (id: string) => {
        switch (id) {
          case 'missing_person': return 'sosHistory.missingPerson';
          case 'fire_emergency': return 'sosHistory.fireEmergency';
          case 'theft_robbery': return 'sosHistory.theftRobbery';
          case 'accident': return 'sosHistory.accident';
          case 'medical_help': return 'sosHistory.medicalHelp';
          case 'general_help': return 'sosHistory.generalHelp';
          default: return '';
        }
      };

      return {
        ...category,
        localizedTitle: t(getCategoryTitleKey(category.id), category.title),
        localizedDescription: category.description, // Use default description since emergencyTypes don't exist in JSON
        icon: category.id === 'missing_person' ? UserX :
              category.id === 'fire_emergency' ? Flame :
              category.id === 'theft_robbery' ? ShieldAlert :
              category.id === 'accident' ? Car :
              category.id === 'medical_help' ? HeartHandshake :
              AlertTriangle,
        color: category.urgency === 'critical' ? 'bg-red-500' :
               category.urgency === 'high' ? 'bg-orange-500' :
               category.urgency === 'medium' ? 'bg-green-500' :
               'bg-gray-500'
      };
    });
  };

  const helpCategories = getLocalizedHelpCategories();

  const handleCategorySelect = (category: typeof helpCategories[0]) => {
    setSelectedCategory(category.id);
    setHelpRequest(prev => ({
      ...prev,
      category: category.id,
      title: category.localizedTitle,
      urgency: category.urgency
    }));
    setShowHelpForm(true);
  };

  const handleSubmitHelp = async () => {
    try {
      // Validate form data
      const validation = sosService.validateComplaintData({
        category: helpRequest.category,
        title: helpRequest.title,
        description: helpRequest.description,
        urgency: helpRequest.urgency,
        contactInfo: helpRequest.contactInfo,
        location: {
          address: helpRequest.location,
          coordinates: currentLocationData.coordinates
        },
        additionalInfo: helpRequest.additionalInfo
      }, t);

      if (!validation.isValid) {
        validation.errors.forEach(error => toast.error(error));
        return;
      }

      setIsSubmitting(true);

      // Submit the complaint
      await sosService.submitComplaint({
        category: helpRequest.category,
        title: helpRequest.title,
        description: helpRequest.description,
        urgency: helpRequest.urgency,
        contactInfo: helpRequest.contactInfo,
        location: {
          address: helpRequest.location,
          coordinates: currentLocationData.coordinates
        },
        additionalInfo: helpRequest.additionalInfo,
        isEmergencySOS: false
      });

      toast.success(t('success.helpRequestSubmitted'));
      
      // Reset form and go back to main view
      setShowHelpForm(false);
      setHelpRequest({
        category: '',
        urgency: 'medium',
        title: '',
        description: '',
        location: currentLocationData.address,
        contactInfo: '',
        additionalInfo: ''
      });
      
      // Reload recent complaints
      await loadRecentComplaints();

    } catch (error: any) {
      console.error('Submit help request error:', error);
      toast.error(error.message || t('errors.failedToSubmitHelp'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmergencySOS = async () => {
    try {
      setIsSubmitting(true);
      
      const emergencyData = {
        description: t('sos.emergencySOSDescription'),
        location: {
          address: currentLocationData.address,
          coordinates: currentLocationData.coordinates
        }
      };

      await sosService.submitEmergencySOS(emergencyData);
      
      toast.success(t('success.emergencySOSActivated'));
      
      // Reload recent complaints
      await loadRecentComplaints();
      
    } catch (error: any) {
      console.error('Emergency SOS error:', error);
      toast.error(error.message || t('errors.failedToActivateSOS'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof HelpRequest, value: string) => {
    setHelpRequest(prev => ({ ...prev, [field]: value }));
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return sosService.getStatusText(status, t);
  };

  const formatRelativeTime = (dateString: string) => {
    return sosService.formatRelativeTime(dateString, t);
  };

  if (sosState === "inactive") return null;

  return (
    <div className="h-full w-full bg-gray-50 flex flex-col">
      {/* Header */}
      <Header 
        title={t('sos.helpEmergency')}
        rightAction={
          showHelpForm ? (
            <button
              onClick={() => setShowHelpForm(false)}
              className="text-blue-600 font-medium"
            >
              {t('common.cancel')}
            </button>
          ) : null
        }
      />

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 py-4">
        {!showHelpForm ? (
          <>
            {/* Help Categories */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {t('sos.whatHelpNeeded')}
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                {t('sos.selectCategory')}
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {helpCategories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      disabled={isSubmitting}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="text-center">
                        <div className={`${category.color} p-3 rounded-xl mx-auto mb-3 group-hover:scale-110 transition-transform w-fit`}>
                          <IconComponent size={24} className="text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">
                          {category.localizedTitle}
                        </h3>
                        <p className="text-xs text-gray-500 leading-tight">
                          {category.localizedDescription}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Location Info */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <MapPin size={20} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{t('sos.currentLocation')}</h3>
                  <p className="text-sm text-gray-600">{currentLocationData.address}</p>
                </div>
                <button
                  onClick={loadCurrentLocation}
                  className="text-blue-600 text-sm font-medium"
                  disabled={isSubmitting}
                >
                  {t('common.update')}
                </button>
              </div>
            </div>

            {/* Recent Help Requests */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">{t('sos.recentHelpRequests')}</h3>
              {isLoadingComplaints ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">{t('common.loading')}</p>
                </div>
              ) : recentComplaints.length > 0 ? (
                <div className="space-y-3">
                  {recentComplaints.slice(0, 3).map((complaint) => (
                    <div key={complaint._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${complaint.status === 'resolved' ? 'bg-green-500' : complaint.status === 'in_progress' ? 'bg-blue-500' : 'bg-yellow-500'}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{complaint.title}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(complaint.status || 'submitted')}`}>
                              {getStatusText(complaint.status || 'submitted')}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center">
                              <Clock size={12} className="mr-1" />
                              {complaint.createdAt ? formatRelativeTime(complaint.createdAt) : t('sos.recently')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentComplaints.length > 3 && (
                    <button className="w-full text-center text-blue-600 text-sm font-medium py-2">
                      {t('sos.viewAllRequests')}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">{t('sos.noRecentRequests')}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Help Request Form */}
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`${helpCategories.find(c => c.id === selectedCategory)?.color} p-2 rounded-lg`}>
                  {React.createElement(helpCategories.find(c => c.id === selectedCategory)?.icon || AlertTriangle, { 
                    size: 20, 
                    className: "text-white" 
                  })}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{helpRequest.title}</h2>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(helpRequest.urgency)}`}>
                    {t(`sos.urgency.${helpRequest.urgency}`)} {t('sos.priority')}
                  </span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('sos.urgencyLevel')} *
                  </label>
                  <select
                    value={helpRequest.urgency}
                    onChange={(e) => handleInputChange('urgency', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  >
                    <option value="low">{t('sos.urgency.low')}</option>
                    <option value="medium">{t('sos.urgency.medium')}</option>
                    <option value="high">{t('sos.urgency.high')}</option>
                    <option value="critical">{t('sos.urgency.critical')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common.description')} *
                  </label>
                  <textarea
                    value={helpRequest.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder={t('sos.describeSituation')}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('sos.contactInfo')} *
                  </label>
                  <input
                    type="text"
                    value={helpRequest.contactInfo}
                    onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                    placeholder={t('sos.contactPlaceholder')}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common.location')}
                  </label>
                  <input
                    type="text"
                    value={helpRequest.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('sos.additionalInfo')}
                  </label>
                  <textarea
                    value={helpRequest.additionalInfo || ''}
                    onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                    placeholder={t('sos.additionalDetails')}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20 resize-none"
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  onClick={handleSubmitHelp}
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-4 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('sos.submitting')}</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>{t('sos.submitHelpRequest')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Emergency SOS Slider - Always at bottom */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-red-200">
          <div className="text-center mb-4">
            <h3 className="font-bold text-red-800 mb-1">{t('sos.criticalEmergency')}</h3>
            <p className="text-sm text-red-600">
              {t('sos.emergencySliderMessage')}
            </p>
          </div>

          {/* SOS States */}
          {sosState === "swipe" && (
            <div className="relative h-16 bg-red-600 rounded-full flex items-center px-2 overflow-hidden">
              {/* Slider button */}
              <div
                className="relative w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform duration-150 ease-out"
                style={{
                  transform: `translateX(${Math.min(
                    (swipeProgress / 100) * 280,
                    280
                  )}px) scale(${swipeProgress > 80 ? 1.1 : 1})`,
                }}
                onMouseDown={(e) => !isSubmitting && onSwipeStart(e)}
                onTouchStart={(e) => !isSubmitting && onSwipeStart(e)}
              >
                {swipeProgress > 80 ? (
                  <CheckCircle className="text-red-600" size={24} />
                ) : (
                  <ArrowRight className="text-red-600" size={24} />
                )}
              </div>

              {/* Text overlay */}
              {swipeProgress < 50 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  <span className="text-white font-medium text-sm ml-8">
                    {isSubmitting ? t('sos.processing') : t('sos.slideToCall')}
                  </span>
                </div>
              )}
              {swipeProgress >= 50 && swipeProgress < 90 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  <span className="text-white font-medium text-sm">
                    {t('sos.keepSliding')}
                  </span>
                </div>
              )}
            </div>
          )}

          {sosState === "sending" && (
            <div className="text-center py-6">
              <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-bold text-red-800 mb-2">
                {t('sos.callingEmergencyServices')}
              </h3>
              <p className="text-red-600 text-sm">
                {t('sos.connectingToResponders')}
              </p>
            </div>
          )}

          {sosState === "sent" && (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-green-800 mb-2">
                {t('sos.emergencyServicesContacted')}
              </h3>
              <p className="text-green-600 text-sm">
                {t('sos.helpOnTheWay')}
              </p>
              <button
                onClick={handleEmergencySOS}
                disabled={isSubmitting}
                className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {isSubmitting ? t('sos.logging') : t('sos.logEmergencyReport')}
              </button>
            </div>
          )}

          {sosState === "waiting" && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-bold text-red-800 mb-2">{t('sos.emergencyActive')}</h3>
                <p className="text-sm text-red-600 mb-4">
                  {t('sos.respondersEnRoute')}
                </p>
              </div>

              <div className="w-full h-48 rounded-xl overflow-hidden shadow-lg">
                <div ref={sosMapContainer} className="w-full h-full" />
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-sm font-medium text-gray-900">{t('sos.police')}</span>
                  </div>
                  <p className="text-xs text-gray-600">{t('sos.minAway', { minutes: 6 })}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium text-gray-900">{t('sos.medical')}</span>
                  </div>
                  <p className="text-xs text-gray-600">{t('sos.minAway', { minutes: 8 })}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span className="text-sm font-medium text-gray-900">{t('sos.contacts')}</span>
                  </div>
                  <p className="text-xs text-gray-600">{t('sos.notified')}</p>
                </div>
              </div>
              
              <button
                onClick={handleEmergencySOS}
                disabled={isSubmitting}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? t('sos.logging') : t('sos.logEmergencyDetails')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SOSInterface;