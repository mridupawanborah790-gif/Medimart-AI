import React from 'react';
import { Doctor } from '../types';
import { StethoscopeIcon } from './icons/StethoscopeIcon';
import { StarIcon } from './icons/StarIcon';
import { MapPinIcon } from './icons/MapPinIcon';
import { HospitalIcon } from './icons/HospitalIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { DirectionsIcon } from './icons/DirectionsIcon';
import { CalendarIcon } from './icons/CalendarIcon';

interface DoctorCardProps {
  doctor: Doctor;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  return (
    <div className="bg-white/70 rounded-xl p-3 shadow-sm border border-white/50 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start">
        <div>
          <h3 className="font-bold text-md text-slate-800 leading-snug">{doctor.name}</h3>
          <div className="flex items-center text-sm text-slate-600 mt-1">
            <StethoscopeIcon className="w-4 h-4 mr-1.5 text-green-500 flex-shrink-0" />
            <span className="truncate">{doctor.specialty}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0 bg-yellow-100 text-yellow-800 text-sm font-semibold px-2.5 py-1 rounded-full flex-shrink-0 w-fit">
          <StarIcon className="w-4 h-4 text-yellow-500" />
          <span>{doctor.rating.toFixed(1)}</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-200/50 space-y-2 text-sm">
        {[
          { icon: HospitalIcon, value: doctor.hospitalName, color: 'text-purple-500' },
          { icon: MapPinIcon, value: doctor.address, color: 'text-red-500' },
        ].map((item, index) => item.value && (
          <div key={index} className="flex items-start text-slate-600">
            <item.icon className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${item.color}`} />
            <span className="break-words">{item.value}</span>
          </div>
        ))}

        {doctor.phone && (
             <div className="flex items-start text-slate-600">
                <PhoneIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-blue-500" />
                <span className="text-slate-700 font-medium">{doctor.phone}</span>
            </div>
        )}

        <div className="pt-2 flex flex-col xs:flex-row gap-2">
            {doctor.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doctor.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex justify-center items-center px-3 py-2 text-xs font-bold text-slate-700 neumorphic-convex active:scale-95 transition-transform"
                >
                  <DirectionsIcon className="w-4 h-4 mr-1.5" />
                  Directions
                </a>
            )}
            
            {doctor.phone && (
                <a
                  href={`tel:${doctor.phone}`}
                  className="w-full flex justify-center items-center px-3 py-2 text-xs font-bold text-white bg-gradient-to-br from-green-500 to-green-600 rounded-[20px] shadow-lg hover:shadow-xl active:shadow-inner active:scale-95 transition-all"
                >
                  <CalendarIcon className="w-4 h-4 mr-1.5" />
                  Book
                </a>
            )}
        </div>
      </div>
    </div>
  );
};