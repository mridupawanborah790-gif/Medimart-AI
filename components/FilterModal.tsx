import React, { useState, useEffect } from 'react';
import { FilterCriteria } from '../types';
import { CloseIcon } from './icons/CloseIcon';
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
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-sm rounded-3xl border border-slate-100 bg-white/95 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.55)] backdrop-blur-xl transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600/80">Medimart AI</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Find a Doctor</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 pb-6">
          
          {[
            { id: 'doctorName', label: 'Doctor Name', value: doctorName, setter: setDoctorName, placeholder: 'e.g., Dr. Jane Doe', icon: UserIcon },
            { id: 'hospitalName', label: 'Hospital or Clinic', value: hospitalName, setter: setHospitalName, placeholder: 'e.g., City General', icon: HospitalIcon },
            { id: 'location', label: 'Location (City or ZIP)', value: location, setter: setLocation, placeholder: 'Use current location', icon: MapPinIcon },
            { id: 'specialty', label: 'Specialty', value: specialty, setter: setSpecialty, placeholder: 'e.g., Cardiologist', icon: StethoscopeIcon },
          ].map(field => (
            <div key={field.id}>
              <label htmlFor={field.id} className="mb-1.5 block text-sm font-medium text-slate-700">
                {field.label}
              </label>
              <div className="relative">
                <field.icon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"/>
                <input 
                  type="text" 
                  id={field.id} 
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-base text-slate-800 placeholder-slate-400 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_8px_20px_-18px_rgba(15,23,42,0.55)] transition-all focus:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  placeholder={field.placeholder}
                  style={{ fontSize: '16px' }}
                />
              </div>
               {field.id === 'location' && <p className="mt-1.5 text-xs text-slate-500">Leave blank to use your current location.</p>}
            </div>
          ))}

          <label htmlFor="availableNow" className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <input 
              id="availableNow" 
              type="checkbox" 
              checked={availableNow}
              onChange={(e) => setAvailableNow(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-slate-800">
              Available Now
            </span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button 
              onClick={handleReset} 
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Reset
            </button>
            <button 
              onClick={handleSearchClick}
              className="rounded-full bg-emerald-500 px-8 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-12px_rgba(16,185,129,0.9)] transition-all hover:bg-emerald-600 active:scale-[0.99]"
            >
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
