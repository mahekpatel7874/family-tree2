export interface FamilyMember {
  id: string;
  name: string;
  email?: string;
  dateOfBirth: string;
  imageUrl?: string;
  phone?: string;
  address?: string;
  occupation?: string;
  bio?: string;
  parentId?: string;
  spouseId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin: boolean;
  familyMemberId?: string;
}

export interface TreeNode {
  member: FamilyMember;
  children: TreeNode[];
  spouse?: FamilyMember;
}