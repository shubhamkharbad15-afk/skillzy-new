import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Settings, 
  MessageSquare, 
  Store,
  TrendingUp,
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center text-white dark:text-slate-900 font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{communityData.name}</h2>
              <p className="text-xs text-gray-500">{communityData.memberCount} members • Admin: {communityData.adminName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button 
                className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-md transition flex items-center gap-1"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash className="w-3.5 h-3.5" /> Delete
              </button>
            )}
            <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Close
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full justify-start rounded-none border-b border-gray-100 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-900/50 px-4 pt-1">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-2 text-xs py-2 px-4 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white font-medium"
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto flex-1">
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowDeleteModal(false)} />
        <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6 shadow-xl space-y-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Community</h3>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Are you sure you want to delete "{communityData.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-50" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            <button
              className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700"
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
              {deleting ? 'Deleting...' : 'Delete Community'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ViewCommunity;
