import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchWithAuth } from '../../../lib/api';
import { 
  Search, 
  UserPlus, 
  Shield, 
  CheckCircle, 
  XCircle,
  Crown,
  Award
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const MembersList = ({ communityId, isAdmin, onMembersCountChange }) => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [showRequestsPanel, setShowRequestsPanel] = useState(false);
  const [members, setMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMembers();
    if (isAdmin) {
      loadPendingRequests();
    }
  }, [communityId, isAdmin]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadMembers();
      if (isAdmin) {
        loadPendingRequests();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [communityId, isAdmin]);

  const loadMembers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(`/communities/${communityId}/members`);
      const rows = Array.isArray(res) ? res : (res?.items || res?.data || []);
      const normalized = rows.map((m) => {
        const id = m.id ?? m.user_id ?? m.member_id ?? m._id ?? `${m.email || 'member'}-${Math.random().toString(36).slice(2)}`;
        const name = m.name || m.full_name || [m.first_name, m.last_name].filter(Boolean).join(' ').trim() || m.email || 'Member';
        return {
          id,
          name,
          email: m.email || '',
          role: m.role || m.title || 'Member',
          skills: Array.isArray(m.skills) ? m.skills : [],
          achievements: Array.isArray(m.achievements) ? m.achievements : [],
          avatar: m.avatar || (name ? name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase() : 'MB'),
          isAdmin: Boolean(m.is_admin || m.isAdmin),
          joinDate: m.joinDate || m.join_date || m.created_at || new Date().toISOString(),
          points: Number(m.points || 0)
        };
      });
      setMembers(normalized);
      onMembersCountChange && onMembersCountChange(normalized.length);
    } catch (err) {
      setError('Failed to load members');
      setMembers([]);
      onMembersCountChange && onMembersCountChange(0);
    }
    setLoading(false);
  };

  const loadPendingRequests = async () => {
    try {
      const res = await fetchWithAuth(`/communities/${communityId}/requests`);
      setPendingRequests(Array.isArray(res) ? res : []);
    } catch (_) {
      setPendingRequests([]);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await fetchWithAuth(`/communities/${communityId}/requests/${requestId}/approve`, { method: 'POST' });
      await loadPendingRequests();
      await loadMembers();
    } catch (_) {}
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await fetchWithAuth(`/communities/${communityId}/requests/${requestId}/reject`, { method: 'POST' });
      await loadPendingRequests();
    } catch (_) {}
  };

  const filteredMembers = members.filter(member => {
    const term = (searchTerm || '').toLowerCase();
    const name = (member.name || member.email || '').toLowerCase();
    const role = (member.role || '').toLowerCase();
    const skills = Array.isArray(member.skills) ? member.skills : [];
    return (
      name.includes(term) ||
      role.includes(term) ||
      skills.some(skill => String(skill).toLowerCase().includes(term))
    );
  });

  const removeMember = async (memberId) => {
    try {
      await fetchWithAuth(`/communities/${communityId}/members/${memberId}`, { method: 'DELETE' });
      await loadMembers();
    } catch (_) {
      setError('Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Community Members</h3>
          <p className="text-xs text-gray-500">{members.length} registered members</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadMembers} className="btn-outline">
            Refresh
          </button>
          {isAdmin && (
            <>
              <button onClick={() => setShowInvitePanel(!showInvitePanel)} className="btn-outline">
                <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Invite
              </button>
              <button onClick={() => setShowRequestsPanel(!showRequestsPanel)} className="btn-outline">
                <Shield className="w-3.5 h-3.5 mr-1.5 text-amber-600" /> Requests ({pendingRequests.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-gray-400 w-3.5 h-3.5" />
        <input
          placeholder="Search members by name, role, or skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-clean pl-9"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">{error}</div>
      )}

      {/* Pending Requests */}
      {showRequestsPanel && isAdmin && (
        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg space-y-3">
          <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Pending Join Requests</h4>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-slate-800 text-white text-xs">{request.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-xs text-gray-900 dark:text-white">{request.name}</div>
                    <div className="text-[11px] text-gray-500">{request.email}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApproveRequest(request.id)} className="px-2.5 py-1 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800">
                    Approve
                  </button>
                  <button onClick={() => handleRejectRequest(request.id)} className="px-2.5 py-1 text-xs font-medium border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {pendingRequests.length === 0 && (
              <p className="text-xs text-gray-500 py-2 text-center">No pending requests</p>
            )}
          </div>
        </div>
      )}

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredMembers.map((member) => (
          <div key={member.id} className="bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 rounded-lg p-4 flex flex-col justify-between">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10 border border-gray-200 dark:border-gray-700 shrink-0">
                <AvatarFallback className="bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-gray-200 text-xs font-bold">
                  {member.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4 className="font-semibold text-xs text-gray-900 dark:text-white truncate">{member.name}</h4>
                  {member.isAdmin && (
                    <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mb-2 truncate">{member.role}</p>
                
                {Array.isArray(member.skills) && member.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {member.skills.slice(0, 3).map((skill, index) => (
                      <span key={index} className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-700/80 flex items-center justify-between text-[11px] text-gray-400 mt-2">
              <span className="font-mono">{member.points} pts</span>
              {isAdmin && !member.isAdmin && (
                <button 
                  onClick={() => removeMember(member.id)}
                  className="text-red-600 dark:text-red-400 hover:underline font-medium"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-8 text-xs text-gray-500">
          No members found matching your search.
        </div>
      )}
    </div>
  );
};

export default MembersList;
