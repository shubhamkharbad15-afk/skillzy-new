import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchWithAuth } from '../../../lib/api';
import { 
  Search, 
  UserPlus, 
  Shield, 
  CheckCircle, 
  XCircle,
  Crown,
  Star,
  Award
} from 'lucide-react';

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

  // Refresh data every 10 seconds for near real-time updates
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
      // Normalize shape so downstream rendering and actions work reliably
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">{error}</div>
      )}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Admin Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold">Community Members</h3>
          <p className="text-gray-500">{members.length} total members</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadMembers}
            variant="outline"
            className="border-indigo-500 text-indigo-600 hover:bg-indigo-50"
          >
            Refresh
          </Button>
          {isAdmin && (
            <>
              <Button 
                onClick={() => setShowInvitePanel(!showInvitePanel)}
                variant="outline"
                className="border-indigo-500 text-indigo-600 hover:bg-indigo-50"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Members
              </Button>
              <Button 
                onClick={() => setShowRequestsPanel(!showRequestsPanel)}
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <Shield className="w-4 h-4 mr-2" />
                Requests ({pendingRequests.length})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search members by name, role, or skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Invite Panel */}
      {showInvitePanel && isAdmin && (
        <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20">
          <CardHeader>
            <CardTitle className="text-indigo-700 dark:text-indigo-300">Invite New Members</CardTitle>
            <CardDescription>Send invitations to join your community</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Addresses</label>
                <Textarea 
                  placeholder="Enter email addresses separated by commas..."
                  className="h-20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Custom Message (Optional)</label>
                <Textarea 
                  placeholder="Add a personal message to your invitation..."
                  className="h-16"
                />
              </div>
              <div className="flex gap-2">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Send Invitations
                </Button>
                <Button onClick={() => setShowInvitePanel(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests Panel */}
      {showRequestsPanel && isAdmin && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardHeader>
            <CardTitle className="text-orange-700 dark:text-orange-300">Pending Requests</CardTitle>
            <CardDescription>Review and approve membership requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{request.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{request.name}</div>
                      <div className="text-sm text-gray-500">{request.role}</div>
                      <div className="text-xs text-gray-400">{request.email}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleApproveRequest(request.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      onClick={() => handleRejectRequest(request.id)}
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
              {pendingRequests.length === 0 && (
                <p className="text-center text-gray-500 py-4">No pending requests</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                    {member.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold truncate">{member.name || member.email || 'Member'}</h4>
                    {member.isAdmin && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{member.role || 'Member'}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(Array.isArray(member.skills) ? member.skills.slice(0, 2) : []).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {Array.isArray(member.skills) && member.skills.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{member.skills.length - 2}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{member.points} pts</span>
                    <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
                  </div>

                  {Array.isArray(member.achievements) && member.achievements.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Award className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-yellow-600 dark:text-yellow-400">
                        {member.achievements[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {isAdmin && !member.isAdmin && (
                <div className="flex justify-end mt-3">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-red-500 text-red-600 hover:bg-red-50"
                    onClick={() => removeMember(member.id)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No members found matching your search criteria.
        </div>
      )}
    </div>
  );
};

export default MembersList;
