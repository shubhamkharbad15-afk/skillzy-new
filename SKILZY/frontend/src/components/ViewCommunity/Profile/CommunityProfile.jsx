import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Edit3, 
  Save, 
  X, 
  Tag,
  Users,
  Target,
  Megaphone
} from 'lucide-react';

const CommunityProfile = ({ communityData, setCommunityData, isAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(communityData);

  const handleSave = () => {
    setCommunityData(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(communityData);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagChange = (index, value) => {
    const newTags = [...editData.focusTags];
    newTags[index] = value;
    setEditData(prev => ({ ...prev, focusTags: newTags }));
  };

  const addTag = () => {
    setEditData(prev => ({ 
      ...prev, 
      focusTags: [...prev.focusTags, 'New Tag'] 
    }));
  };

  const removeTag = (index) => {
    setEditData(prev => ({ 
      ...prev, 
      focusTags: prev.focusTags.filter((_, i) => i !== index) 
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header with Edit Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Community Profile</h3>
          <p className="text-gray-500">Manage your community information</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Community Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Community Name</label>
              {isEditing ? (
                <Input 
                  value={editData.name} 
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full"
                />
              ) : (
                <p className="text-lg font-semibold">{communityData.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mission Statement</label>
              {isEditing ? (
                <Textarea 
                  value={editData.mission} 
                  onChange={(e) => handleInputChange('mission', e.target.value)}
                  className="w-full h-20"
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300">{communityData.mission}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Slogan</label>
              {isEditing ? (
                <Input 
                  value={editData.slogan} 
                  onChange={(e) => handleInputChange('slogan', e.target.value)}
                  className="w-full"
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300 italic">"{communityData.slogan}"</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Focus & Eligibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              Focus & Eligibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Focus Tags</label>
              {isEditing ? (
                <div className="space-y-2">
                  {editData.focusTags.map((tag, index) => (
                    <div key={index} className="flex gap-2">
                      <Input 
                        value={tag} 
                        onChange={(e) => handleTagChange(index, e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => removeTag(index)}
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button onClick={addTag} variant="outline" size="sm">
                    <Tag className="w-4 h-4 mr-2" />
                    Add Tag
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {communityData.focusTags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Eligibility</label>
              {isEditing ? (
                <Textarea 
                  value={editData.eligibility} 
                  onChange={(e) => handleInputChange('eligibility', e.target.value)}
                  className="w-full h-16"
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300">{communityData.eligibility}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notices & Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-500" />
            Community Notices
          </CardTitle>
          <CardDescription>
            Important announcements and updates for all members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea 
              value={editData.notices} 
              onChange={(e) => handleInputChange('notices', e.target.value)}
              className="w-full h-24"
              placeholder="Enter community notices and announcements..."
            />
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">{communityData.notices}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Community Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Community Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 border-[#5C4E4E]/40">
              <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{communityData.memberCount}</div>
              <div className="text-xs text-gray-500 mt-0.5">Total Members</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 border-[#5C4E4E]/40">
              <div className="text-xs text-gray-400 font-medium">More stats available in the Dashboard tab.</div>
              <div className="text-xs text-gray-500 mt-1">View message counts, event totals, and leaderboard data there.</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityProfile;
