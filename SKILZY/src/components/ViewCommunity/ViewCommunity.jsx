import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Calendar, 
  Award, 
  Settings, 
  MessageSquare, 
  Store,
  TrendingUp,
  UserPlus,
  Shield,
  Trash
} from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';
import WeeklyDashboard from './Dashboard/WeeklyDashboard';
import CommunityProfile from './Profile/CommunityProfile';
import MembersList from './Members/MembersList';
import ChatSection from './Chat/ChatSection';
import RewardsStore from './Store/RewardsStore';
import AdminPanel from './Admin/AdminPanel';

const ViewCommunity = ({ community, onClose, isAdmin = false }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [communityData, setCommunityData] = useState({
    id: community?.id,
    name: community?.name || 'Community Name',
    mission: 'Connecting professionals through meaningful collaboration',
    focusTags: ['Technology', 'Innovation', 'Networking'],
    eligibility: 'Open to all professionals',
    slogan: 'Building the future together',
    notices: 'Welcome to our community!',
    memberCount: community?.member_count || 0,
    adminName: community?.admin_name || 'Admin'
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: Settings },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'store', label: 'Store', icon: Store },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Shield }] : [])
  ];

  return (
    <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-7xl mx-4 bg-white dark:bg-gray-800 rounded-lg max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{communityData.name}</h2>
              <p className="text-sm text-gray-500">{communityData.memberCount} members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button 
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash className="w-4 h-4 mr-2" /> Delete
              </Button>
            )}
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start rounded-none border-0 bg-transparent">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab Contents */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <TabsContent value="dashboard">
                <WeeklyDashboard communityData={communityData} />
              </TabsContent>

              <TabsContent value="profile">
                <CommunityProfile 
                  communityData={communityData} 
                  setCommunityData={setCommunityData}
                  isAdmin={isAdmin}
                />
              </TabsContent>

              <TabsContent value="members">
                <MembersList 
                  communityId={community?.id}
                  isAdmin={isAdmin}
                  onMembersCountChange={(count)=> setCommunityData(prev=>({...prev, memberCount: count}))}
                />
              </TabsContent>

              <TabsContent value="chat">
                <ChatSection 
                  communityId={community?.id}
                  isAdmin={isAdmin}
                />
              </TabsContent>

              <TabsContent value="store">
                <RewardsStore />
              </TabsContent>

              {isAdmin && (
                <TabsContent value="admin">
                  <AdminPanel 
                    communityId={community?.id}
                    communityData={communityData}
                    setCommunityData={setCommunityData}
                  />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
    {/* Delete Community Modal */}
    {showDeleteModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
        <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6 shadow-xl">
          <h3 className="text-xl font-semibold mb-2">Delete Community</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            This action cannot be undone. Are you sure you want to delete "{communityData.name}"?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleting}
              onClick={async () => {
                try {
                  setDeleting(true);
                  await fetchWithAuth(`/communities/${communityData.id}`, { method: 'DELETE' });
                  window.dispatchEvent(new CustomEvent('dashboard:refresh-communities', { detail: { id: communityData.id } }));
                  setShowDeleteModal(false);
                  onClose?.();
                } catch (_) {
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ViewCommunity;
