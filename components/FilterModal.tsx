import React, { useState, useEffect } from 'react';
import { FilterCriteria } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { FilterIcon } from './icons/FilterIcon';
import { MapPinIcon } from './icons/MapPinIcon';
import { UserIcon } from './icons/UserIcon';
import { HospitalIcon } from './icons/HospitalIcon';
import { StethoscopeIcon } from './icons/StethoscopeIcon';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: FilterCriteria) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onSearch }) => {
  const [specialty, setSpecialty] = useState('');
  const [availableNow, setAvailableNow] = useState(false);
  const [location, setLocation] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const handleSearchClick = () => {
    onSearch({ specialty, availableNow, location, doctorName, hospitalName });
  };

  const handleReset = () => {
    setSpecialty('');
    setAvailableNow(false);
    setLocation('');
    setDoctorName('');
    setHospitalName('');
  }

  return (
    <div 
      className={`fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div 
        className={`w-[95%] max-w-md glassmorphism rounded-2xl shadow-2xl transition-transform duration-300 ${isVisible ? 'scale-100' : 'scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center gap-2">
            <FilterIcon className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-bold text-slate-800">Find a Doctor</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-white/50">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          
          {[
            { id: 'doctorName', label: 'Doctor Name', value: doctorName, setter: setDoctorName, placeholder: 'e.g., Dr. Jane Doe', icon: UserIcon },
            { id: 'hospitalName', label: 'Hospital or Clinic', value: hospitalName, setter: setHospitalName, placeholder: 'e.g., City General', icon: HospitalIcon },
            { id: 'location', label: 'Location (City or ZIP)', value: location, setter: setLocation, placeholder: 'Use current location', icon: MapPinIcon },
            { id: 'specialty', label: 'Specialty', value: specialty, setter: setSpecialty, placeholder: 'e.g., Cardiologist', icon: StethoscopeIcon },
          ].map(field => (
            <div key={field.id}>
              <label htmlFor={field.id} className="block text-sm font-semibold text-slate-700 mb-1">
                {field.label}
              </label>
              <div className="relative neumorphic-concave p-1">
                <field.icon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input 
                  type="text" 
                  id={field.id} 
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-transparent border-0 rounded-md focus:outline-none focus:ring-0 text-slate-800 placeholder-slate-400 text-base"
                  placeholder={field.placeholder}
                  style={{ fontSize: '16px' }}
                />
              </div>
               {field.id === 'location' && <p className="text-xs text-slate-500 mt-1">Leave blank to use device location.</p>}
            </div>
          ))}

          <div className="flex items-center pt-2">
            <input 
              id="availableNow" 
              type="checkbox" 
              checked={availableNow}
              onChange={(e) => setAvailableNow(e.target.checked)}
              className="h-5 w-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="availableNow" className="ml-2 block text-sm font-semibold text-slate-800">
              Available Now
            </label>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 p-4 border-t border-white/20 rounded-b-xl">
          <button 
            onClick={handleReset} 
            className="px-5 py-2.5 text-sm font-bold text-slate-700 neumorphic-convex"
          >
            Reset
          </button>
          <button 
            onClick={handleSearchClick}
            className="px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-lg hover:shadow-xl active:shadow-inner transition-all"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
};