import React, { useState, useEffect } from 'react';
import { X, Save, User, Upload, CheckCircle } from 'lucide-react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { FamilyMember } from '../../types/family';
import { useAuth } from '../../contexts/AuthContext';

interface AddMemberFormProps {
  member?: FamilyMember | null;
  onClose: () => void;
  onSuccess: () => void;
  availableParents: FamilyMember[];
}

export const AddMemberForm: React.FC<AddMemberFormProps> = ({
  member,
  onClose,
  onSuccess,
  availableParents
}) => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dateOfBirth: '',
    imageUrl: '',
    phone: '',
    address: '',
    occupation: '',
    bio: '',
    parentId: '',
    spouseId: ''
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        email: member.email || '',
        dateOfBirth: member.dateOfBirth || '',
        imageUrl: member.imageUrl || '',
        phone: member.phone || '',
        address: member.address || '',
        occupation: member.occupation || '',
        bio: member.bio || '',
        parentId: member.parentId || '',
        spouseId: member.spouseId || ''
      });
      setImagePreview(member.imageUrl || '');
    }
  }, [member]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB.');
        return;
      }

      setImageFile(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile || !userData) return formData.imageUrl;

    setUploadingImage(true);
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `family-members/${userData.uid}/${timestamp}-${imageFile.name}`;
      const imageRef = ref(storage, fileName);

      // Upload the file
      await uploadBytes(imageRef, imageFile);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteOldImage = async (imageUrl: string) => {
    if (!imageUrl || !imageUrl.includes('firebase')) return;
    
    try {
      // Extract the path from the URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      if (pathMatch) {
        const imagePath = decodeURIComponent(pathMatch[1]);
        const imageRef = ref(storage, imagePath);
        await deleteObject(imageRef);
      }
    } catch (error) {
      console.error('Error deleting old image:', error);
      // Don't throw error as this is not critical
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Name is required.');
      setLoading(false);
      return;
    }

    if (!formData.dateOfBirth) {
      setError('Date of birth is required.');
      setLoading(false);
      return;
    }

    if (!formData.occupation.trim()) {
      setError('Occupation is required.');
      setLoading(false);
      return;
    }

    if (!formData.address.trim()) {
      setError('Address is required.');
      setLoading(false);
      return;
    }

    try {
      let imageUrl = formData.imageUrl;
      
      // Upload new image if selected
      if (imageFile) {
        imageUrl = await uploadImage();
        
        // Delete old image if updating and there was a previous image
        if (member && member.imageUrl && member.imageUrl !== imageUrl) {
          await deleteOldImage(member.imageUrl);
        }
      }

      const memberData = {
        ...formData,
        imageUrl,
        createdBy: userData?.uid || '',
        updatedAt: new Date().toISOString(),
        ...(member ? {} : { createdAt: new Date().toISOString() })
      };

      if (member) {
        await updateDoc(doc(db, 'familyMembers', member.id), memberData);
      } else {
        await addDoc(collection(db, 'familyMembers'), memberData);
      }

      // Show success state
      setSuccess(true);
      
      // Wait a moment to show success, then close and refresh
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error saving family member:', error);
      setError('Failed to save family member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData({ ...formData, imageUrl: '' });
  };

  const availableSpouses = availableParents.filter(p => 
    p.id !== member?.id && 
    p.id !== formData.parentId &&
    !p.spouseId
  );

  // Show success state
  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {member ? 'Member Updated!' : 'Member Added!'}
          </h3>
          <p className="text-gray-600">
            {member 
              ? 'The family member has been successfully updated.' 
              : 'The new family member has been successfully added to your family tree.'
            }
          </p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {member ? 'Edit Family Member' : 'Add New Family Member'}
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={loading || uploadingImage}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Profile Picture
              </label>
              
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex space-x-2">
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors flex items-center space-x-2 disabled:opacity-50">
                      <Upload className="h-4 w-4" />
                      <span>Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        disabled={loading || uploadingImage}
                        className="hidden"
                      />
                    </label>
                    
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={removeImage}
                        disabled={loading || uploadingImage}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: JPG, PNG, GIF (max 5MB)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={loading || uploadingImage}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:bg-gray-100 disabled:opacity-50"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  disabled={loading || uploadingImage}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:bg-gray-100 disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading || uploadingImage}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:bg-gray-100 disabled:opacity-50"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={loading || uploadingImage}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:bg-gray-100 disabled:opacity-50"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-2">
                  Occupation *
                </label>
                <input
                  type="text"
                  id="occupation"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                  disabled={loading || uploadingImage}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:bg-gray-100 disabled:opacity-50"
                  placeholder="Enter occupation"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={loading || uploadingImage}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:bg-gray-100 disabled:opacity-50"
                placeholder="Enter address"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-2">
                  Parent
                </label>
                <select
                  id="parentId"
                  name="parentId"
                  value={formData.parentId}
                  onChange={handleInputChange}
                  disabled={loading || uploadingImage}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:bg-gray-100 disabled:opacity-50"
                >
                  <option value="">Select parent (optional)</option>
                  {availableParents
                    .filter(p => p.id !== member?.id)
                    .map(parent => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="spouseId" className="block text-sm font-medium text-gray-700 mb-2">
                  Spouse
                </label>
                <select
                  id="spouseId"
                  name="spouseId"
                  value={formData.spouseId}
                  onChange={handleInputChange}
                  disabled={loading || uploadingImage}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:bg-gray-100 disabled:opacity-50"
                >
                  <option value="">Select spouse (optional)</option>
                  {availableSpouses.map(spouse => (
                    <option key={spouse.id} value={spouse.id}>
                      {spouse.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Biography
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                disabled={loading || uploadingImage}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-none disabled:bg-gray-100 disabled:opacity-50"
                placeholder="Enter a brief biography..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || uploadingImage}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploadingImage}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {uploadingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Uploading Image...</span>
                  </>
                ) : loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Saving Member...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>{member ? 'Update Member' : 'Add Member'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};