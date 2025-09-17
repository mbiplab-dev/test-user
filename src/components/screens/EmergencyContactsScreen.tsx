// =============================================================================
// COMPONENT: Emergency Contacts Screen with i18next
// File path: src/components/screens/EmergencyContactsScreen.tsx
// =============================================================================

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, Plus, Edit3, Trash2, Shield, Users, MapPin, Clock, AlertTriangle, Star } from 'lucide-react';
import Header from '../layout/Header';
import { toast } from 'react-hot-toast';

interface EmergencyContact {
  id: number;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  isLocal: boolean;
  lastContacted?: Date;
}

interface EmergencyContactsScreenProps {
  onBack: () => void;
}

const EmergencyContactsScreen: React.FC<EmergencyContactsScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    {
      id: 1,
      name: 'Biplab Mohanty',
      relationship: t('emergencyContacts.brother'),
      phone: '94712837489',
      email: 'biplab@email.com',
      isPrimary: true,
      isLocal: false,
      lastContacted: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: 2,
      name: 'Dr. Prerna Chen',
      relationship: t('emergencyContacts.doctor'),
      phone: '9464723987',
      email: 'dr.chen@hospital.com',
      isPrimary: false,
      isLocal: true,
      lastContacted: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
      id: 3,
      name: 'Travel Support',
      relationship: t('emergencyContacts.travelSupport'),
      phone: '9342423423',
      isPrimary: false,
      isLocal: true
    },
    {
      id: 4,
      name: 'Anushka Roy',
      relationship: t('trip.emergencyContact'),
      phone: '83490231443',
      email: 'anushka@email.com',
      isPrimary: false,
      isLocal: false
    }
  ]);

  const [selectedTab, setSelectedTab] = useState<'personal' | 'official' | 'local'>('personal');

  const handleCall = (contact: EmergencyContact) => {
    // Update last contacted time
    setContacts(prev => prev.map(c => 
      c.id === contact.id 
        ? { ...c, lastContacted: new Date() }
        : c
    ));
    
    // In a real app, this would initiate a call
    window.open(`tel:${contact.phone}`);
    toast.success(t('emergencyContacts.calling', { name: contact.name }));
  };

  const handleEdit = (contact: EmergencyContact) => {
    // In a real app, this would open an edit modal
    if(contact){toast.success(t('emergencyContacts.editFunctionality'));}
  };

  const handleDelete = (contactId: number) => {
    setContacts(prev => prev.filter(c => c.id !== contactId));
    toast.success(t('emergencyContacts.contactRemoved'));
  };

  const handleAddContact = () => {
    // In a real app, this would open an add contact modal
    toast.success(t('emergencyContacts.addContactFunctionality'));
  };

  const getFilteredContacts = () => {
    switch (selectedTab) {
      case 'personal':
        return contacts.filter(c => [t('trip.spouse'), t('trip.emergencyContact'), t('trip.parent'), t('trip.sibling')].includes(c.relationship));
      case 'official':
        return contacts.filter(c => [t('emergencyContacts.doctor'), t('emergencyContacts.travelInsurance'), 'Embassy'].includes(c.relationship));
      case 'local':
        return contacts.filter(c => c.isLocal);
      default:
        return contacts;
    }
  };

  const formatLastContacted = (date?: Date) => {
    if (!date) return t('emergencyContacts.neverContacted');
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return t('emergencyContacts.justNow');
    if (hours < 24) return t('emergencyContacts.hoursAgo', { hours });
    const days = Math.floor(hours / 24);
    return t('emergencyContacts.daysAgo', { days });
  };

  return (
    <div className="space-y-6">
      <Header 
        title={t('emergencyContacts.emergencyContacts')} 
        onBack={onBack}
        rightAction={
          <button 
            onClick={handleAddContact}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
          </button>
        }
      />
      
      <div className="px-4 space-y-6">
        {/* Quick Emergency Numbers */}
        <div className="bg-gradient-to-br from-red-600 via-red-500 to-orange-600 rounded-3xl p-6 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <AlertTriangle className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t('emergencyContacts.quickEmergency')}</h2>
              <p className="font-semibold">{t('emergencyContacts.police')}</p>
              <p className="text-sm text-red-100">999</p>
            </div>
            
            <button 
              onClick={() => window.open('tel:998')}
              className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/30 transition-colors"
            >
              <Plus className="text-white mb-2" size={20} />
              <p className="font-semibold">{t('emergencyContacts.medical')}</p>
              <p className="text-sm text-red-100">998</p>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1">
          {[
            { key: 'personal' as const, label: t('emergencyContacts.personal'), icon: Users },
            { key: 'official' as const, label: t('emergencyContacts.official'), icon: Shield },
            { key: 'local' as const, label: t('emergencyContacts.local'), icon: MapPin }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Contacts List */}
        <div className="space-y-4">
          {getFilteredContacts().map((contact) => (
            <div key={contact.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                    {contact.isPrimary && (
                      <Star className="text-yellow-500 fill-current" size={16} />
                    )}
                    {contact.isLocal && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        {t('emergencyContacts.local')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{contact.relationship}</p>
                  <p className="text-sm font-mono text-gray-500">{contact.phone}</p>
                  {contact.email && (
                    <p className="text-sm text-gray-500">{contact.email}</p>
                  )}
                  <div className="flex items-center space-x-1 mt-2">
                    <Clock size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {t('emergencyContacts.lastContacted', { time: formatLastContacted(contact.lastContacted) })}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(contact)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => handleCall(contact)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Phone size={18} />
                <span>{t('group.call')} {contact.name}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Additional Services */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('emergencyContacts.additionalServices')}</h3>
          <div className="space-y-3">
            {[
              { name: t('emergencyContacts.touristHelpline'), number: '+91 78892347589', description: t('emergencyContacts.touristAssistance') },
              { name: t('emergencyContacts.embassyHotline'), number: '+91 94786236490', description: 'US Embassy, India' },
              { name: t('emergencyContacts.travelInsurance'), number: '+91 99564612519', description: t('emergencyContacts.emergencyTravelSupport') }
            ].map((service, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <p className="text-sm text-gray-600">{service.description}</p>
                  <p className="text-sm font-mono text-gray-500">{service.number}</p>
                </div>
                <button
                  onClick={() => window.open(`tel:${service.number}`)}
                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-colors"
                >
                  <Phone size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Tips */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="text-blue-600" size={20} />
            <h3 className="font-semibold text-blue-800">{t('emergencyContacts.safetyTips')}</h3>
          </div>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• {t('emergencyContacts.tip1')}</p>
            <p>• {t('emergencyContacts.tip2')}</p>
            <p>• {t('emergencyContacts.tip3')}</p>
            <p>• {t('emergencyContacts.tip4')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContactsScreen;