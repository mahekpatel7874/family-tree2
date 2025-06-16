import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FamilyMember, TreeNode } from '../../types/family';
import { MemberCard } from './MemberCard';
import { MemberModal } from './MemberModal';
import { AddMemberForm } from './AddMemberForm';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Users, AlertCircle } from 'lucide-react';

export const FamilyTree: React.FC = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { userData, currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchMembers();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchMembers = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setError('');
      const q = query(
        collection(db, 'familyMembers'),
        where('createdBy', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const membersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FamilyMember[];
      
      console.log('Fetched members:', membersData); // Debug log
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching family members:', error);
      setError('Failed to load family members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (): TreeNode[] => {
    if (members.length === 0) return [];

    const memberMap = new Map<string, FamilyMember>();
    members.forEach(member => memberMap.set(member.id, member));

    const roots: TreeNode[] = [];
    const processed = new Set<string>();

    const buildNode = (member: FamilyMember): TreeNode => {
      const children = members
        .filter(m => m.parentId === member.id && !processed.has(m.id))
        .map(child => {
          processed.add(child.id);
          return buildNode(child);
        });

      const spouse = member.spouseId ? memberMap.get(member.spouseId) : undefined;

      return {
        member,
        children,
        spouse
      };
    };

    // Find root members (those without parents)
    const rootMembers = members.filter(member => !member.parentId && !processed.has(member.id));
    
    rootMembers.forEach(rootMember => {
      processed.add(rootMember.id);
      roots.push(buildNode(rootMember));
    });

    // Handle orphaned members (those with parentId that doesn't exist)
    const orphanedMembers = members.filter(member => 
      member.parentId && 
      !memberMap.has(member.parentId) && 
      !processed.has(member.id)
    );

    orphanedMembers.forEach(orphan => {
      processed.add(orphan.id);
      roots.push(buildNode(orphan));
    });

    return roots;
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to delete this family member? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'familyMembers', memberId));
      await fetchMembers();
      setSelectedMember(null);
    } catch (error) {
      console.error('Error deleting family member:', error);
      setError('Failed to delete family member. Please try again.');
    }
  };

  const handleFormSuccess = async () => {
    await fetchMembers();
    setShowAddForm(false);
    setEditingMember(null);
  };

  const renderTreeNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const { member, children, spouse } = node;
    
    return (
      <div key={member.id} className="flex flex-col items-center">
        {/* Member and Spouse Row */}
        <div className="flex items-center justify-center space-x-6 mb-8">
          <MemberCard
            member={member}
            onClick={() => setSelectedMember(member)}
            isRoot={level === 0}
          />
          {spouse && (
            <>
              <div className="flex items-center">
                <div className="w-8 h-0.5 bg-pink-400"></div>
                <div className="w-3 h-3 bg-pink-400 rounded-full mx-1 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <div className="w-8 h-0.5 bg-pink-400"></div>
              </div>
              <MemberCard
                member={spouse}
                onClick={() => setSelectedMember(spouse)}
              />
            </>
          )}
        </div>
        
        {/* Children Connection and Display */}
        {children.length > 0 && (
          <>
            {/* Vertical line down from parent(s) */}
            <div className="w-0.5 h-8 bg-gray-400 mb-4"></div>
            
            {/* Horizontal line connecting children */}
            {children.length > 1 && (
              <div className="relative mb-4">
                <div className="h-0.5 bg-gray-400" style={{ width: `${(children.length - 1) * 280}px` }}></div>
                {children.map((_, index) => (
                  <div 
                    key={index}
                    className="absolute w-0.5 h-4 bg-gray-400 -top-4"
                    style={{ left: `${index * 280}px` }}
                  ></div>
                ))}
              </div>
            )}
            
            {/* Children Row */}
            <div className="flex items-start justify-center space-x-16">
              {children.map((child) => (
                <div key={child.member.id} className="flex flex-col items-center">
                  {children.length === 1 && (
                    <div className="w-0.5 h-4 bg-gray-400 mb-4"></div>
                  )}
                  {renderTreeNode(child, level + 1)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your family tree...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">Please Log In</h2>
          <p className="text-gray-500">You need to be logged in to view your family tree.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Family Tree</h1>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2 shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span>Add Member</span>
            </button>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Family Tree</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchMembers}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const treeRoots = buildTree();
  console.log('Tree roots:', treeRoots); // Debug log

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 rounded-xl p-3 shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Family Tree</h1>
              <p className="text-gray-600">
                {members.length === 0 
                  ? 'Start building your family connections' 
                  : `${members.length} family member${members.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            <span>Add Member</span>
          </button>
        </div>

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Debug: Found {members.length} members, {treeRoots.length} root nodes
            </p>
          </div>
        )}

        {members.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto">
              <Users className="h-20 w-20 text-blue-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">No Family Members Yet</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Start building your family tree by adding the first member. You can add parents, children, and spouses to create your complete family network.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Add First Member
              </button>
            </div>
          </div>
        ) : treeRoots.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto">
              <AlertCircle className="h-20 w-20 text-orange-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Unable to Display Tree</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                There seems to be an issue with the family tree structure. Please check the relationships between family members.
              </p>
              <button
                onClick={fetchMembers}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Refresh Tree
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8 overflow-x-auto">
            <div className="min-w-full">
              <div className="flex flex-col items-center space-y-20 py-8">
                {treeRoots.map((root, index) => (
                  <div key={root.member.id} className="w-full flex justify-center">
                    {index > 0 && <div className="w-full h-px bg-gray-300 mb-20"></div>}
                    {renderTreeNode(root)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedMember && (
        <MemberModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onEdit={setEditingMember}
          onDelete={handleDeleteMember}
        />
      )}

      {(showAddForm || editingMember) && (
        <AddMemberForm
          member={editingMember}
          onClose={() => {
            setShowAddForm(false);
            setEditingMember(null);
          }}
          onSuccess={handleFormSuccess}
          availableParents={members}
        />
      )}
    </div>
  );
};