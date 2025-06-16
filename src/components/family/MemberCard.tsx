import React from 'react';
import { Calendar, User } from 'lucide-react';
import { FamilyMember } from '../../types/family';

interface MemberCardProps {
  member: FamilyMember;
  onClick: () => void;
  isRoot?: boolean;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, onClick, isRoot = false }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getAge = (dateString: string) => {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div 
      onClick={onClick}
      className={`
        relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 
        cursor-pointer border-2 border-transparent hover:border-blue-200 
        transform hover:-translate-y-1 p-4 min-w-[200px] max-w-[240px]
        ${isRoot ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
      `}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-3 shadow-inner">
          {member.imageUrl ? (
            <img 
              src={member.imageUrl} 
              alt={member.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-blue-600" />
          )}
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-1 text-sm leading-tight">
          {member.name}
        </h3>
        
        <div className="flex items-center text-xs text-gray-600 mb-2">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{formatDate(member.dateOfBirth)}</span>
        </div>
        
        <div className="text-xs text-gray-500">
          Age: {getAge(member.dateOfBirth)}
        </div>
        
        {member.occupation && (
          <div className="mt-2 px-2 py-1 bg-blue-50 rounded-full">
            <span className="text-xs text-blue-700 font-medium">
              {member.occupation}
            </span>
          </div>
        )}
      </div>
      
      {isRoot && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-md">
          Root
        </div>
      )}
    </div>
  );
};