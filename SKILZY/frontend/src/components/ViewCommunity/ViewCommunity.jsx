import React, { useState, useEffect } from 'react';
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
    name: community?.name || 'Community',
    mission: community?.description || '',
    focusTags: community?.domain ? [community.domain] : [],
    eligibility: 'Open to members',
    slogan: community?.domain || '',
    notices: '',
    memberCount: community?.member_count || 0,
    adminName: community?.admin_name || 'Admin',
    domain: community?.domain || '',
    description: community?.description || ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadCommunity = async () => {
      if (!community?.id) return;
      try {
        const detail = await fetchWithAuth(`/communities/${community.id}`);
        if (!detail) return;
        setCommunityData((prev) => ({
          ...prev,
          id: detail.id || community.id,
          name: detail.name || prev.name,
          mission: detail.description || detail.mission || prev.mission,
          description: detail.description || prev.description,
          domain: detail.domain || prev.domain,
          focusTags: detail.domain ? [detail.domain] : prev.focusTags,
          memberCount: detail.member_count ?? prev.memberCount,
          adminName: detail.admin_name || prev.adminName,
          notices: detail.notices || prev.notices,
          slogan: detail.slogan || detail.domain || prev.slogan,
          eligibility: detail.eligibility || prev.eligibility,
        }));
      } catch (_) {}
    };
    loadCommunity();
  }, [community?.id]);

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: TrendingUp },
    { id: 'profile', label: 'About', icon: Settings },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'store', label: 'Store', icon: Store },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Shield }] : [])
  ];

  return (
    <>
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="w-full max-w-6xl bg-[#141111] rounded-xl border border-[#5C4E4E]/55 max-h-[92vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#5C4E4E]/40 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[#D1D0D0] rounded-lg flex items-center justify-center text-black font-bold shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#D1D0D0] leading-tight truncate">{communityData.name}</h2>
              <p className="text-xs text-[#988686] truncate">{communityData.memberCount} members{communityData.domain ? ` · ${communityData.domain}` : ''} · Admin: {communityData.adminName}</p>
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
            <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium border border-[#5C4E4E] rounded-md hover:bg-[#1c1818] transition">
              Close
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full justify-start rounded-none border-b border-[#5C4E4E]/40 bg-black/50 dark:bg-gray-900/50 px-2 sm:px-4 pt-1 overflow-x-auto">
              {tabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-2 text-xs py-2 px-3 sm:px-4 rounded-md data-[state=active]:bg-[#141111] dark:data-[state=active]:bg-gray-800 data-[state=active]:text-[#D1D0D0] dark:data-[state=active]:text-white font-medium whitespace-nowrap"
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab Contents */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
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
                  communityId={communityData.id}
                  isAdmin={isAdmin}
                  onMembersCountChange={(count)=> setCommunityData(prev=>({...prev, memberCount: count}))}
                />
              </TabsContent>

              <TabsContent value="chat">
                <ChatSection 
                  communityId={communityData.id}
                  isAdmin={isAdmin}
                />
              </TabsContent>

              <TabsContent value="store">
                <RewardsStore />
              </TabsContent>

              {isAdmin && (
                <TabsContent value="admin">
                  <AdminPanel 
                    communityId={communityData.id}
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
        <div className="relative bg-[#141111] rounded-xl border border-[#5C4E4E]/55 w-full max-w-md p-6 shadow-xl space-y-3">
          <h3 className="text-base font-bold text-[#D1D0D0]">Delete Community</h3>
          <p className="text-xs text-[#988686]">
            Are you sure you want to delete "{communityData.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button className="px-3 py-1.5 text-xs font-medium border border-[#5C4E4E] rounded-md hover:bg-black" onClick={() => setShowDeleteModal(false)}>Cancel</button>
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
