import React from 'react';
import { Calendar, User, MapPin, Briefcase, Users } from 'lucide-react';
import { FamilyMember } from '../../types/family';

interface MemberCardProps {
  member: FamilyMember;
  onClick: () => void;
  isRoot?: boolean;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, onClick, isRoot = false }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getAge = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'from-blue-100 to-blue-200';
      case 'female':
        return 'from-pink-100 to-pink-200';
      default:
        return 'from-purple-100 to-purple-200';
    }
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'text-blue-600';
      case 'female':
        return 'text-pink-600';
      default:
        return 'text-purple-600';
    }
  };

  const formatGender = (gender: string) => {
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  return (
    <div 
      onClick={onClick}
      className={`
        relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 
        cursor-pointer border-2 border-transparent hover:border-blue-300 
        transform hover:-translate-y-2 hover:scale-105 p-6 min-w-[220px] max-w-[260px]
        ${isRoot ? 'ring-4 ring-blue-400 ring-opacity-30 shadow-2xl' : ''}
        group
      `}
    >
      {/* Profile Section */}
      <div className="flex flex-col items-center text-center mb-4">
        <div className="relative mb-4">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getGenderColor(member.gender)} flex items-center justify-center shadow-lg overflow-hidden ring-4 ring-white`}>
            <User className={`h-10 w-10 ${getGenderIcon(member.gender)}`} />
          </div>
          {isRoot && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-2 py-1 rounded-full shadow-lg font-semibold">
              Root
            </div>
          )}
        </div>
        
        <h3 className="font-bold text-gray-900 mb-2 text-lg leading-tight group-hover:text-blue-600 transition-colors">
          {member.name || 'Unknown Name'}
        </h3>
        
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <Calendar className="h-4 w-4 mr-2 text-blue-500" />
          <span>{formatDate(member.dateOfBirth)}</span>
        </div>
        
        <div className="flex items-center space-x-3 text-sm text-gray-500 font-medium mb-2">
          <span>Age: {getAge(member.dateOfBirth)}</span>
          <span>•</span>
          <div className="flex items-center">
            <Users className={`h-3 w-3 mr-1 ${getGenderIcon(member.gender)}`} />
            <span>{formatGender(member.gender)}</span>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="space-y-2">
        {member.occupation && (
          <div className="flex items-center text-xs text-gray-600">
            <Briefcase className="h-3 w-3 mr-2 text-green-500 flex-shrink-0" />
            <span className="truncate">{member.occupation}</span>
          </div>
        )}
        
        {member.address && (
          <div className="flex items-center text-xs text-gray-600">
            <MapPin className="h-3 w-3 mr-2 text-red-500 flex-shrink-0" />
            <span className="truncate">{member.address}</span>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="mt-4 flex justify-center">
        <div className={`px-3 py-1 bg-gradient-to-r ${getGenderColor(member.gender)} rounded-full border-2 ${member.gender === 'male' ? 'border-blue-200' : member.gender === 'female' ? 'border-pink-200' : 'border-purple-200'}`}>
          <span className={`text-xs font-semibold ${getGenderIcon(member.gender)}`}>
            Family Member
          </span>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};