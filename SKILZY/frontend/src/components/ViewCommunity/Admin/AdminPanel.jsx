import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchWithAuth } from '../../../lib/api';
import { 
  Shield, 
  Users, 
  Calendar, 
  Megaphone, 
  Settings,
  UserCheck,
  UserX,
  Crown,
  AlertTriangle
} from 'lucide-react';

const AdminPanel = ({ communityId, communityData, setCommunityData }) => {
  const [activeTab, setActiveTab] = useState('members');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', time: '', location: '' });
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });

  const [useGlobalFallback, setUseGlobalFallback] = useState({ events: false, announcements: false, requests: false });

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(() => {
      loadPendingRequests();
      loadEvents();
      loadAnnouncements();
    }, 10000);
    return () => clearInterval(interval);
  }, [communityId]);

  const loadAdminData = async () => {
    await loadPendingRequests();
    await loadEvents();
    await loadAnnouncements();
  };

  const loadPendingRequests = async () => {
    try {
      const res = await fetchWithAuth(`/communities/${communityId}/requests`).catch(async (err) => {
        if (String(err?.message || '').includes('status: 404')) {
          setUseGlobalFallback((p) => ({ ...p, requests: true }));
          return await fetchWithAuth(`/requests?community_id=${communityId}`);
        }
        throw err;
      });
      setPendingRequests(Array.isArray(res) ? res : []);
      setError('');
    } catch (_) {
      setPendingRequests([]);
      setError('Failed to load pending requests');
    }
  };

  const loadEvents = async () => {
    try {
      const res = await fetchWithAuth(`/communities/${communityId}/events`).catch(async (err) => {
        if (String(err?.message || '').includes('status: 404')) {
          setUseGlobalFallback((p) => ({ ...p, events: true }));
          return await fetchWithAuth(`/events?community_id=${communityId}`);
        }
        throw err;
      });
      setEvents(Array.isArray(res) ? res : []);
    } catch (_) {
      setEvents([]);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const res = await fetchWithAuth(`/communities/${communityId}/announcements`).catch(async (err) => {
        if (String(err?.message || '').includes('status: 404')) {
          setUseGlobalFallback((p) => ({ ...p, announcements: true }));
          return await fetchWithAuth(`/announcements?community_id=${communityId}`);
        }
        throw err;
      });
      setAnnouncements(Array.isArray(res) ? res : []);
    } catch (_) {
      setAnnouncements([]);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await fetchWithAuth(`/communities/${communityId}/requests/${requestId}/approve`, { method: 'POST' });
      await loadPendingRequests();
    } catch (_) {}
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await fetchWithAuth(`/communities/${communityId}/requests/${requestId}/reject`, { method: 'POST' });
      await loadPendingRequests();
    } catch (_) {}
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.title) return;
    setCreatingEvent(true);
    try {
      // Basic client validation for common schema requirements
      const dateRe = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
      const timeRe = /^\d{2}:\d{2}$/;       // HH:mm
      if (eventForm.date && !dateRe.test(eventForm.date)) {
        setActionError('Invalid date format. Use YYYY-MM-DD.');
        setTimeout(()=> setActionError(''), 2500);
        setCreatingEvent(false);
        return;
      }
      if (eventForm.time && !timeRe.test(eventForm.time)) {
        setActionError('Invalid time format. Use HH:mm (24h).');
        setTimeout(()=> setActionError(''), 2500);
        setCreatingEvent(false);
        return;
      }
      // Build ISO without timezone suffix to satisfy stricter Pydantic schemas
      const isoLocal = (eventForm.date && eventForm.time)
        ? `${eventForm.date}T${eventForm.time}:00`
        : (eventForm.date ? `${eventForm.date}T00:00:00` : undefined);

      // Attempt 1: minimal common schema
      const payloadA = Object.fromEntries(Object.entries({
        community_id: communityId,
        title: eventForm.title,
        description: eventForm.description,
        start_time: isoLocal,
        location: eventForm.location,
      }).filter(([_, v]) => v !== undefined && v !== null && String(v).trim() !== ''));

      try {
        const path = useGlobalFallback.events ? `/events` : `/communities/${communityId}/events`;
        await fetchWithAuth(path, { method: 'POST', body: JSON.stringify(payloadA) });
      } catch (errA) {
        // Attempt 2: split date/time fields if backend rejects start_time
        const payloadB = Object.fromEntries(Object.entries({
          community_id: communityId,
          title: eventForm.title,
          description: eventForm.description,
          date: eventForm.date,
          time: eventForm.time,
          location: eventForm.location,
        }).filter(([_, v]) => v !== undefined && v !== null && String(v).trim() !== ''));
        try {
          const pathB = useGlobalFallback.events ? `/events` : `/communities/${communityId}/events`;
          await fetchWithAuth(pathB, { method: 'POST', body: JSON.stringify(payloadB) });
        } catch (errB) {
          const msg = (errB && errB.message) ? String(errB.message) : 'Schema validation failed';
          setActionError(`Failed to create event: ${msg}. Ensure date=YYYY-MM-DD and time=HH:mm.`);
          setTimeout(()=> setActionError(''), 3500);
          setCreatingEvent(false);
          return;
        }
      }

      setEventForm({ title: '', description: '', date: '', time: '', location: '' });
      setShowEventModal(false);
      await loadEvents();
      window.dispatchEvent(new CustomEvent('dashboard:refresh-challenges'));
    } catch (err) {
      setActionError('Failed to create event. Ensure date=YYYY-MM-DD and time=HH:mm.');
      setTimeout(()=> setActionError(''), 2500);
    }
    setCreatingEvent(false);
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.content) return;
    setCreatingAnnouncement(true);
    try {
      const payload = {
        community_id: communityId,
        title: (announcementForm.title || '').trim() || 'Announcement',
        content: announcementForm.content,
        // extra keys to satisfy varied backends
        announcement: announcementForm.content,
        message: announcementForm.content,
      };

      // Try scoped, then global as fallback
      let createdResp;
      try {
        const annPath = useGlobalFallback.announcements ? `/announcements` : `/communities/${communityId}/announcements`;
        createdResp = await fetchWithAuth(annPath, { method: 'POST', body: JSON.stringify(payload) });
      } catch (errA) {
        if (String(errA?.message || '').includes('status: 404')) {
          createdResp = await fetchWithAuth(`/announcements`, { method: 'POST', body: JSON.stringify(payload) });
        } else {
          throw errA;
        }
      }

      // Normalize response or build a fallback object if backend returns empty
      const created = (() => {
        const src = (createdResp && typeof createdResp === 'object') ? createdResp : {};
        return {
          id: src.id || src.announcement_id || Date.now(),
          community_id: src.community_id || payload.community_id,
          title: src.title || src.subject || payload.title,
          content: src.content || src.announcement || src.message || payload.content,
          created_at: src.created_at || src.date || new Date().toISOString(),
        };
      })();

      // Reset form and close modal
      setAnnouncementForm({ title: '', content: '' });
      setShowAnnouncementModal(false);

      // Refresh lists and notify Dashboard
      await loadAnnouncements();
      window.dispatchEvent(new CustomEvent('dashboard:refresh-notifications'));

      // Optimistic push so joined users see it immediately in Notifications
      const detail = {
        id: `ann-${created.id}`,
        type: 'announcement',
        message: `[Announcement] ${created.title}: ${created.content}`,
        community_id: created.community_id,
        created_at: created.created_at,
      };
      window.dispatchEvent(new CustomEvent('dashboard:push-notification', { detail }));
    } catch (err) {
      setActionError(`Failed to publish announcement${err?.message ? `: ${String(err.message)}` : ''}`);
      setTimeout(()=> setActionError(''), 2500);
    }
    setCreatingAnnouncement(false);
  };

  // old handleCreateEvent removed; using async handleCreateEvent above

  // old handleCreateAnnouncement removed; using async handleCreateAnnouncement above

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-500" />
            Admin Panel
          </h3>
          <p className="text-gray-500">Manage your community settings and members</p>
        </div>
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
          <Crown className="w-3 h-3 mr-1" />
          Admin Access
        </Badge>
      </div>

      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Members Management */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Pending Requests
              </CardTitle>
              <CardDescription>Review and approve membership requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                        {request.avatar}
                      </div>
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
                        <UserCheck className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        onClick={() => handleRejectRequest(request.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-50"
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingRequests.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No pending requests
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Management */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Community Events
              </CardTitle>
              <CardDescription>Manage and create community events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-semibold">Upcoming Events</h4>
                  <p className="text-sm text-gray-500">Create and manage community events</p>
                </div>
                <Button onClick={() => setShowEventModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </div>
              
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-gray-500">
                        {event.date} at {event.time} • {event.attendees} attendees
                      </div>
                    </div>
                    <Badge className={
                      event.status === 'upcoming' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    }>
                      {event.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements Management */}
        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-500" />
                Community Announcements
              </CardTitle>
              <CardDescription>Create and manage community announcements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-semibold">Active Announcements</h4>
                  <p className="text-sm text-gray-500">Send important updates to all members</p>
                </div>
                <Button onClick={() => setShowAnnouncementModal(true)} className="bg-orange-600 hover:bg-orange-700">
                  <Megaphone className="w-4 h-4 mr-2" />
                  Create Announcement
                </Button>
              </div>
              
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-orange-800 dark:text-orange-200">
                          {announcement.title}
                        </div>
                        <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                          {announcement.content}
                        </div>
                        <div className="text-xs text-orange-500 mt-2">
                          Posted on {announcement.date}
                        </div>
                      </div>
                      <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-500" />
                Community Settings
              </CardTitle>
              <CardDescription>Current community configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Community Name</label>
                  <Input value={communityData.name} readOnly className="bg-gray-50 text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Total Members</label>
                  <Input value={communityData.memberCount} readOnly className="bg-gray-50 text-gray-600" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Admin</label>
                <Input value={communityData.adminName} readOnly className="bg-gray-50 text-gray-600" />
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">Community management</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  To update community name, description, or domain, edit it from the Profile tab. Member management is available in the Members tab.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {actionError && (
        <div className="mt-2 px-3 py-2 text-sm rounded border border-red-300 bg-red-100 text-red-700">{actionError}</div>
      )}

      {/* Create Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEventModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 border-[#5C4E4E]/45 w-full max-w-lg p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Create Event</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Event Name</label>
                <Input value={eventForm.title} onChange={(e)=> setEventForm(f=>({...f, title: e.target.value}))} placeholder="Name of event" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea value={eventForm.description} onChange={(e)=> setEventForm(f=>({...f, description: e.target.value}))} placeholder="Describe the event" className="h-24" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <Input type="date" value={eventForm.date} onChange={(e)=> setEventForm(f=>({...f, date: e.target.value}))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <Input type="time" value={eventForm.time} onChange={(e)=> setEventForm(f=>({...f, time: e.target.value}))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <Input value={eventForm.location} onChange={(e)=> setEventForm(f=>({...f, location: e.target.value}))} placeholder="e.g., Zoom / Office" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={()=> setShowEventModal(false)}>Cancel</Button>
                <Button type="submit" disabled={creatingEvent} className="bg-indigo-600 hover:bg-indigo-700">{creatingEvent ? 'Creating...' : 'Create Event'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAnnouncementModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 border-[#5C4E4E]/45 w-full max-w-lg p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Create Announcement</h3>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input value={announcementForm.title} onChange={(e)=> setAnnouncementForm(f=>({...f, title: e.target.value}))} placeholder="Announcement title" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Announcement</label>
                <Textarea value={announcementForm.content} onChange={(e)=> setAnnouncementForm(f=>({...f, content: e.target.value}))} placeholder="Write your announcement here" className="h-32" required />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={()=> setShowAnnouncementModal(false)}>Cancel</Button>
                <Button type="submit" disabled={creatingAnnouncement} className="bg-orange-600 hover:bg-orange-700">{creatingAnnouncement ? 'Publishing...' : 'Publish'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
