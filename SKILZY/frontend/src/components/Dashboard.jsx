import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ViewCommunity from './ViewCommunity/ViewCommunity';
import { fetchWithAuth } from '../lib/api';
import { 
  Users, 
  Calendar, 
  Search, 
  Plus, 
  Bell, 
  Settings, 
  Target,
  TrendingUp,
  MapPin,
  Loader2,
  Shield,
  Check,
  X,
  UserCheck,
  UserPlus,
  Clock,
  Menu
} from "lucide-react";
import { User as UserIcon } from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFinding, setIsFinding] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [matches, setMatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkillFilter, setSelectedSkillFilter] = useState("");
  
  const [challenges, setChallenges] = useState([]);
  const [joiningId, setJoiningId] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState({ open: false, message: '' });
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [challengesError, setChallengesError] = useState("");
  const [selectedChallengeModal, setSelectedChallengeModal] = useState(null);
  
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");
  const [selectedEventModal, setSelectedEventModal] = useState(null);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "Online",
    community_id: ""
  });
  const [eventSaving, setEventSaving] = useState(false);

  const [notificationsData, setNotificationsData] = useState([]);

  const [requests, setRequests] = useState([]);
  const [connections, setConnections] = useState([]);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    profileVisibility: "public"
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");

  const [networkSummary, setNetworkSummary] = useState({ connections: 0, communities: 0, eventsAttended: 0, challengesJoined: 0 });
  const [displayName, setDisplayName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [selectedUserModal, setSelectedUserModal] = useState(null);

  // Tag-pill state for profile editing (replaces comma-string inputs)
  const [skillTags, setSkillTags] = useState([]);
  const [interestTags, setInterestTags] = useState([]);
  const [currentSkillInput, setCurrentSkillInput] = useState('');
  const [currentInterestInput, setCurrentInterestInput] = useState('');

  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [allCommunities, setAllCommunities] = useState([]);
  const [showJoinCommunity, setShowJoinCommunity] = useState(false);
  const [communitySearch, setCommunitySearch] = useState("");
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChallengeForm, setAdminChallengeForm] = useState({ title: "", description: "", difficulty: "Medium", points: 150 });
  const [adminEventForm, setAdminEventForm] = useState({ title: "", description: "", date: "", time: "", location: "Online" });
  const [adminNotifForm, setAdminNotifForm] = useState({ message: "", target_user: "", broadcast: true });
  const [adminActionStatus, setAdminActionStatus] = useState("");

  const [communityForm, setCommunityForm] = useState({
    name: "",
    domain: "",
    description: "",
    profile_pic: ""
  });
  const [profileForm, setProfileForm] = useState({
    title: "",
    company: "",
    location: "",
    bio: "",
    careerGoals: "",
    skills: "",
    interests: "",
    avatar_url: "",
  });

  const calculateProfileCompletion = () => {
    if (!profile) return 30;
    let filled = 0;
    const fields = ['title', 'company', 'location', 'bio', 'careerGoals', 'avatar_url'];
    fields.forEach(f => { if (profile[f] && String(profile[f]).trim()) filled++; });
    if (Array.isArray(profile.skills) && profile.skills.length > 0) filled += 2;
    if (Array.isArray(profile.interests) && profile.interests.length > 0) filled += 2;
    return Math.min(100, Math.round((filled / 10) * 100));
  };

  const quickAccessItems = [
    { id: 1, title: "Find Buddies", description: "Semantic skill match", icon: Search, tab: "find-match" },
    { id: 2, title: "Connections", description: "Network requests", icon: UserCheck, tab: "connections" },
    { id: 3, title: "Communities", description: "Developer hubs", icon: Users, tab: "communities" },
    { id: 4, title: "Challenges", description: "Coding sprints", icon: Target, tab: "challenges" },
    { id: 5, title: "Events", description: "Live workshops", icon: Calendar, tab: "events" },
  ];

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "find-match", label: "Find Buddies", icon: Search },
    { id: "connections", label: "Connections", icon: UserCheck },
    { id: "communities", label: "My Communities", icon: Users },
    { id: "challenges", label: "Challenges", icon: Target },
    { id: "events", label: "Events", icon: Calendar },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "settings", label: "Settings", icon: Settings },
    ...(isAdmin ? [{ id: "admin", label: "Admin Panel", icon: Shield }] : [])
  ];

  useEffect(() => {
    loadUserName();
    startNotificationsSocket();
    
    const handleRefreshChallenges = () => loadChallenges();
    const handleRefreshNotifications = () => loadNotifications();
    const handleRefreshCommunities = (evt) => {
      const deletedId = evt?.detail?.id;
      if (deletedId !== undefined && deletedId !== null) {
        const idStr = String(deletedId);
        setCommunities((prev) => prev.filter(c => String(c.id) !== idStr));
        setAllCommunities((prev) => prev.filter(c => String(c.id) !== idStr));
        if (selectedCommunity && String(selectedCommunity.id) === idStr) {
          setSelectedCommunity(null);
        }
      }
      loadCommunities();
      loadAllCommunities();
    };
    
    const handlePushNotification = (e) => {
      const n = e?.detail;
      if (!n) return;
      setNotificationsData((prev) => [n, ...prev]);
    };

    window.addEventListener('dashboard:refresh-challenges', handleRefreshChallenges);
    window.addEventListener('dashboard:refresh-notifications', handleRefreshNotifications);
    window.addEventListener('dashboard:refresh-communities', handleRefreshCommunities);
    window.addEventListener('dashboard:push-notification', handlePushNotification);
    
    return () => {
      window.removeEventListener('dashboard:refresh-challenges', handleRefreshChallenges);
      window.removeEventListener('dashboard:refresh-notifications', handleRefreshNotifications);
      window.removeEventListener('dashboard:refresh-communities', handleRefreshCommunities);
      window.removeEventListener('dashboard:push-notification', handlePushNotification);
    };
  }, []);

  useEffect(() => {
    if (activeTab === "find-match") {
      handleFindMatch();
    } else if (activeTab === "connections") {
      loadConnections();
      loadRequests();
    } else if (activeTab === "challenges") {
      loadChallenges();
    } else if (activeTab === "events") {
      loadEvents();
    } else if (activeTab === "notifications") {
      loadNotifications();
      loadRequests();
    } else if (activeTab === "settings") {
      loadSettings();
    } else if (activeTab === "profile") {
      loadUserName();
    } else if (activeTab === "dashboard") {
      loadNetworkSummary();
      loadUserName();
      loadNotifications();
      loadRequests();
      loadConnections();
      loadCommunities();
      loadEvents();
      loadChallenges();
      handleFindMatch();
    } else if (activeTab === "communities") {
      loadCommunities();
      loadAllCommunities();
    }
  }, [activeTab]);

  const loadNetworkSummary = async () => {
    try {
      const res = await fetchWithAuth("/network/summary");
      if (res) setNetworkSummary(res);
    } catch (_) {}
  };

  const loadEvents = async () => {
    setEventsLoading(true);
    setEventsError("");
    try {
      const res = await fetchWithAuth('/events');
      setEvents(Array.isArray(res) ? res : []);
    } catch (e) {
      setEventsError('Failed to load events');
    } finally {
      setEventsLoading(false);
    }
  };

  const loadConnections = async () => {
    try {
      const res = await fetchWithAuth('/connections');
      setConnections(Array.isArray(res) ? res : []);
    } catch (_) {}
  };

  const loadCommunities = async () => {
    try {
      const res = await fetchWithAuth('/communities');
      setCommunities(Array.isArray(res) ? res : []);
    } catch (_) {}
  };

  const loadAllCommunities = async () => {
    try {
      const res = await fetchWithAuth('/communities/all');
      setAllCommunities(Array.isArray(res) ? res : []);
    } catch (_) {}
  };

  const joinCommunity = async (communityId) => {
    try {
      await fetchWithAuth(`/communities/${communityId}/join`, { method: 'POST' });
      setJoinSuccess({ open: true, message: 'Joined community successfully' });
      setTimeout(() => setJoinSuccess({ open: false, message: '' }), 2000);
      await loadCommunities();
      await loadAllCommunities();
    } catch (_) {}
  };

  const leaveCommunity = async (communityId) => {
    try {
      await fetchWithAuth(`/communities/${communityId}/leave`, { method: 'POST' });
      setJoinSuccess({ open: true, message: 'Left community' });
      setTimeout(() => setJoinSuccess({ open: false, message: '' }), 2000);
      await loadCommunities();
      await loadAllCommunities();
    } catch (_) {}
  };

  const loadUserName = async () => {
    try {
      const res = await fetchWithAuth('/users/me');
      const name = [res?.first_name, res?.last_name].filter(Boolean).join(' ').trim() || (res?.email || 'User');
      const email = res?.email || '';
      setDisplayName(name);
      setUserEmail(email);
      setProfile(res);
      
      const savedAvatar = sessionStorage.getItem(`avatar_${email}`);
      const skillsArr = Array.isArray(res?.skills) ? res.skills : [];
      const interestsArr = Array.isArray(res?.interests) ? res.interests : [];
      setProfileForm({
        title: res?.title || '',
        company: res?.company || '',
        location: res?.location || '',
        bio: res?.bio || '',
        careerGoals: res?.careerGoals || '',
        skills: skillsArr.join(', '),
        interests: interestsArr.join(', '),
        avatar_url: savedAvatar || res?.avatar_url || '',
      });
      setSkillTags(skillsArr);
      setInterestTags(interestsArr);
      sessionStorage.setItem('userName', name);
      
      const adminCheck = await fetchWithAuth('/auth/is-admin');
      setIsAdmin(adminCheck.isAdmin);
    } catch (_) {
      const cached = sessionStorage.getItem('userName');
      if (cached) setDisplayName(cached);
    }
  };

  const saveProfileEdits = async (e) => {
    e?.preventDefault?.();
    try {
      setProfileSaving(true);
      setProfileMessage("");
      const payload = {
        title: profileForm.title || '',
        company: profileForm.company || '',
        location: profileForm.location || '',
        bio: profileForm.bio || '',
        careerGoals: profileForm.careerGoals || '',
        skills: skillTags,
        interests: interestTags,
        avatar_url: profileForm.avatar_url || undefined,
      };
      const updated = await fetchWithAuth('/users/me/profile', { method: 'POST', body: JSON.stringify(payload) });
      setProfile(updated);
      setProfileMessage('Profile updated');
      setTimeout(()=> setProfileMessage(""), 2500);
      loadUserName();
    } catch (_) {
      setProfileMessage('Failed to save profile');
      setTimeout(()=> setProfileMessage(""), 2500);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleFindMatch = async (skillOverride) => {
    setIsFinding(true);
    setMatchError("");
    try {
      let url = `/api/search`;
      if (searchQuery.trim()) {
        url += `?query=${encodeURIComponent(searchQuery.trim())}`;
      }
      const res = await fetchWithAuth(url);
      let results = Array.isArray(res) ? res : [];
      const filter = skillOverride !== undefined ? skillOverride : selectedSkillFilter;
      
      if (filter) {
        results = results.filter(r => (r.skills || []).some(s => s.toLowerCase().includes(String(filter).toLowerCase())));
      }
      
      setMatches(results);
    } catch (err) {
      setMatchError("Failed to fetch matches. Please try again.");
    } finally {
      setIsFinding(false);
    }
  };

  const handleConnect = async (targetUser) => {
    try {
      const res = await fetchWithAuth("/connections/request", {
        method: "POST",
        body: JSON.stringify({ target_user_id: targetUser.id, target_email: targetUser.email })
      });
      if (res?.status === "ok" || res?.status === "already_requested") {
        setMatches((prev) => prev.map((m) => m.id === targetUser.id ? { ...m, connectionStatus: 'requested_sent', requestId: res.request_id } : m));
        setJoinSuccess({ open: true, message: `Request sent to ${targetUser.name}` });
        setTimeout(() => setJoinSuccess({ open: false, message: '' }), 2000);
      }
    } catch (err) {
      setMatchError("Could not send request.");
    }
  };

  const cancelRequest = async (requestId, targetEmail) => {
    try {
      await fetchWithAuth("/connections/cancel", {
        method: "POST",
        body: JSON.stringify({ request_id: requestId, target_email: targetEmail })
      });
      setMatches((prev) => prev.map((m) => m.requestId === requestId || m.email === targetEmail ? { ...m, connectionStatus: 'none', requestId: null } : m));
      loadRequests();
    } catch (_) {}
  };

  const loadChallenges = async () => {
    setChallengesLoading(true);
    setChallengesError("");
    try {
      const res = await fetchWithAuth("/challenges");
      const items = Array.isArray(res) ? res : [];
      setChallenges(items);
    } catch (err) {
      setChallengesError("Failed to load challenges.");
    } finally {
      setChallengesLoading(false);
    }
  };

  const joinChallenge = async (challengeId) => {
    try {
      setJoiningId(challengeId);
      await fetchWithAuth(`/challenges/${challengeId}/join`, { method: 'POST' });
      setJoinSuccess({ open: true, message: 'Joined challenge' });
      setTimeout(() => setJoinSuccess({ open: false, message: '' }), 2000);
      await loadChallenges();
      if (selectedChallengeModal && selectedChallengeModal.id === challengeId) {
        openChallengeModal(challengeId);
      }
    } catch (_) {
    } finally {
      setJoiningId(null);
    }
  };

  const leaveChallenge = async (challengeId) => {
    try {
      setJoiningId(challengeId);
      await fetchWithAuth(`/challenges/${challengeId}/leave`, { method: 'POST' });
      setJoinSuccess({ open: true, message: 'Left challenge' });
      setTimeout(() => setJoinSuccess({ open: false, message: '' }), 2000);
      await loadChallenges();
      if (selectedChallengeModal && selectedChallengeModal.id === challengeId) {
        openChallengeModal(challengeId);
      }
    } catch (_) {
    } finally {
      setJoiningId(null);
    }
  };

  const openChallengeModal = async (challengeId) => {
    try {
      const detail = await fetchWithAuth(`/challenges/${challengeId}`);
      setSelectedChallengeModal(detail);
    } catch (_) {}
  };

  const joinEvent = async (eventId) => {
    try {
      setJoiningId(eventId);
      await fetchWithAuth(`/events/${eventId}/join`, { method: 'POST' });
      setJoinSuccess({ open: true, message: 'Joined event' });
      setTimeout(() => setJoinSuccess({ open: false, message: '' }), 2000);
      await loadEvents();
      if (selectedEventModal && selectedEventModal.id === eventId) {
        openEventModal(eventId);
      }
    } catch (_) {
    } finally {
      setJoiningId(null);
    }
  };

  const leaveEvent = async (eventId) => {
    try {
      setJoiningId(eventId);
      await fetchWithAuth(`/events/${eventId}/leave`, { method: 'POST' });
      setJoinSuccess({ open: true, message: 'Left event' });
      setTimeout(() => setJoinSuccess({ open: false, message: '' }), 2000);
      await loadEvents();
      if (selectedEventModal && selectedEventModal.id === eventId) {
        openEventModal(eventId);
      }
    } catch (_) {
    } finally {
      setJoiningId(null);
    }
  };

  const openEventModal = async (eventId) => {
    try {
      const detail = await fetchWithAuth(`/events/${eventId}`);
      setSelectedEventModal(detail);
    } catch (_) {}
  };

  const createEvent = async (e) => {
    e.preventDefault();
    setEventSaving(true);
    try {
      await fetchWithAuth('/events', {
        method: 'POST',
        body: JSON.stringify(eventForm)
      });
      setShowCreateEventModal(false);
      setEventForm({ title: "", description: "", date: "", time: "", location: "Online", community_id: "" });
      setJoinSuccess({ open: true, message: 'Event created' });
      setTimeout(() => setJoinSuccess({ open: false, message: '' }), 2000);
      loadEvents();
    } catch (_) {
    } finally {
      setEventSaving(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetchWithAuth("/notifications");
      setNotificationsData(Array.isArray(res) ? res : []);
    } catch (_) {}
  };

  const markNotificationRead = async (id) => {
    try {
      await fetchWithAuth(`/notifications/${id}/read`, { method: 'POST' });
      setNotificationsData((prev) => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (_) {}
  };

  const startNotificationsSocket = () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const { protocol, hostname } = window.location;
      const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${wsProtocol}//${hostname}:8000/ws/notifications`);
      ws.onopen = () => { ws.send(JSON.stringify({ token })); };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.message) {
            setNotificationsData((prev) => [{ id: `ws-${Date.now()}`, read: false, ...data }, ...prev]);
            if (data.type === 'connection_response' && data.status === 'accepted') loadConnections();
            if (data.type === 'broadcast') loadEvents();
          }
        } catch {}
      };
    } catch {}
  };

  const loadRequests = async () => {
    try {
      const res = await fetchWithAuth('/connections/requests');
      setRequests(Array.isArray(res) ? res : []);
    } catch (_) {}
  };

  const respondRequest = async (requestId, action) => {
    try {
      await fetchWithAuth('/connections/respond', { method: 'POST', body: JSON.stringify({ request_id: requestId, action }) });
      setRequests((prev) => prev.filter(r => r.id !== requestId));
      setNotificationsData((prev) => prev.filter(n => n.request_id !== requestId));
      if (action === 'accept') {
        await loadConnections();
        setJoinSuccess({ open: true, message: 'Connection accepted' });
        setTimeout(() => setJoinSuccess({ open: false, message: '' }), 2000);
      }
    } catch (_) {}
  };

  const loadSettings = async () => {
    try {
      const res = await fetchWithAuth("/users/me/settings");
      if (res) {
        setSettings((prev) => ({
          ...prev,
          emailNotifications: res.emailNotifications ?? prev.emailNotifications,
          pushNotifications: res.pushNotifications ?? prev.pushNotifications,
          profileVisibility: res.profileVisibility ?? prev.profileVisibility
        }));
      }
    } catch (_) {}
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMessage("");
    try {
      await fetchWithAuth("/users/me/settings", {
        method: "POST",
        body: JSON.stringify(settings)
      });
      setSettingsMessage("Settings saved");
    } catch (err) {
      setSettingsMessage("Failed to save settings");
    } finally {
      setSettingsSaving(false);
      setTimeout(() => setSettingsMessage(""), 2000);
    }
  };

  const handleAdminCreateChallenge = async (e) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/admin/challenges', { method: 'POST', body: JSON.stringify(adminChallengeForm) });
      setAdminActionStatus("Challenge created");
      setAdminChallengeForm({ title: "", description: "", difficulty: "Medium", points: 150 });
      setTimeout(() => setAdminActionStatus(""), 3000);
      loadChallenges();
    } catch (_) {
      setAdminActionStatus("Failed to create challenge");
    }
  };

  const handleAdminCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/admin/events', { method: 'POST', body: JSON.stringify(adminEventForm) });
      setAdminActionStatus("Event created");
      setAdminEventForm({ title: "", description: "", date: "", time: "", location: "Online" });
      setTimeout(() => setAdminActionStatus(""), 3000);
      loadEvents();
    } catch (_) {
      setAdminActionStatus("Failed to create event");
    }
  };

  const handleAdminSendNotification = async (e) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/admin/notifications', { method: 'POST', body: JSON.stringify(adminNotifForm) });
      setAdminActionStatus("Notification broadcasted");
      setAdminNotifForm({ message: "", target_user: "", broadcast: true });
      setTimeout(() => setAdminActionStatus(""), 3000);
    } catch (_) {
      setAdminActionStatus("Failed to broadcast notification");
    }
  };

  const unreadNotifCount = notificationsData.filter(n => !n.read).length;
  const incomingRequests = requests.filter(r => r.direction === 'incoming' || !r.direction);
  const skillFilterOptions = [...new Set([
    ...(Array.isArray(profile?.skills) ? profile.skills : []),
    ...matches.flatMap((m) => (Array.isArray(m.skills) ? m.skills : [])),
  ])].slice(0, 16);
  const filteredCommunities = communities.filter((c) => {
    const q = communitySearch.trim().toLowerCase();
    if (!q) return true;
    return [c.name, c.domain, c.description].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
  });
  const filteredAllCommunities = allCommunities.filter((c) => {
    const q = communitySearch.trim().toLowerCase();
    if (!q) return true;
    return [c.name, c.domain, c.description].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-black text-[#D1D0D0] font-sans antialiased">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Clean Editorial Header */}
      <header className="border-b border-[#5C4E4E]/55 bg-black/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 -ml-1.5 text-[#988686] hover:text-[#D1D0D0] transition-colors"
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-[#D1D0D0] rounded-lg flex items-center justify-center text-black font-black text-sm">
              S
            </div>
            <span className="text-lg font-bold tracking-tight text-black dark:text-white">Skillzy</span>
          </div>
          
          <div className="flex items-center space-x-4 md:space-x-6">
            <div className="hidden lg:flex items-center space-x-4 text-xs text-[#988686] font-medium">
              <span>Connections: <strong className="text-[#D1D0D0]">{networkSummary.connections}</strong></span>
              <span className="text-gray-300 dark:text-[#D1D0D0]">Â·</span>
              <span>Communities: <strong className="text-[#D1D0D0]">{networkSummary.communities}</strong></span>
              <span className="text-gray-300 dark:text-[#D1D0D0]">Â·</span>
              <span>Events: <strong className="text-[#D1D0D0]">{networkSummary.eventsAttended}</strong></span>
            </div>
            
            <button 
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 text-[#988686] hover:text-[#D1D0D0] dark:hover:text-gray-100 transition"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#5C4E4E] rounded-full" />
              )}
            </button>

            <div className="flex items-center gap-2.5 pl-4 border-l border-[#5C4E4E]/55">
              <Avatar className="w-8 h-8 border border-[#5C4E4E]/55 cursor-pointer" onClick={() => setActiveTab('profile')}>
                {profileForm.avatar_url ? (<AvatarImage src={profileForm.avatar_url} />) : (
                  <AvatarFallback className="bg-[#5C4E4E]/40 bg-[#5C4E4E]/50 text-[#D1D0D0] text-[#D1D0D0] text-xs font-semibold">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-[#D1D0D0] leading-none">{displayName}</p>
                <p className="text-[11px] text-[#988686] mt-0.5 truncate max-w-[120px]">{userEmail}</p>
              </div>
              <button 
                onClick={() => { localStorage.removeItem('authToken'); sessionStorage.removeItem('authToken'); window.location.href = '/login'; }}
                className="hidden sm:block px-2.5 py-1 text-xs font-medium text-[#988686] hover:text-red-600 dark:text-[#988686] dark:hover:text-red-400 transition"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto relative">
        {/* Sidebar — responsive: hidden on mobile, shown as overlay; always visible md+ */}
        <aside className={`
          fixed md:static top-0 left-0 h-full md:h-auto z-30 md:z-auto
          w-60 md:w-56
          border-r border-[#5C4E4E]/55
          bg-[#0a0909]
          md:min-h-[calc(100vh-57px)]
          p-3
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0'}
          pt-16 md:pt-3
        `}>
          {/* Mobile close + sign out */}
          <div className="md:hidden flex items-center justify-between mb-3 px-1">
            <button
              className="p-1 text-[#988686] hover:text-[#D1D0D0]"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => { localStorage.removeItem('authToken'); sessionStorage.removeItem('authToken'); window.location.href = '/login'; }}
              className="px-2.5 py-1 text-xs font-medium text-red-600"
            >
              Sign out
            </button>
          </div>

          <nav className="space-y-0.5">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                  className={isActive ? 'nav-item-active w-full' : 'nav-item w-full'}
                >
                  <div className="flex items-center space-x-2.5">
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-black dark:text-[#D1D0D0]' : 'text-[#988686]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === "notifications" && unreadNotifCount > 0 && (
                    <span className="bg-[#5C4E4E]/45 text-[#D1D0D0] dark:bg-[#5C4E4E]/45 text-[#D1D0D0] text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {unreadNotifCount}
                    </span>
                  )}
                  {item.id === "connections" && requests.filter(r => r.direction === 'incoming' || !r.direction).length > 0 && (
                    <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {requests.filter(r => r.direction === 'incoming' || !r.direction).length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 min-w-0">
          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Editorial Welcome Section */}
              <div className="bg-[#141111] text-[#D1D0D0] rounded-lg p-6 md:p-8 border border-[#5C4E4E]/55 border-[#5C4E4E]/45">
                <div className="max-w-3xl">
                  <span className="text-[11px] font-mono tracking-wider uppercase text-[#988686] mb-2 block">
                    Skillzy Workspace
                  </span>
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
                    Welcome back, {displayName}.
                  </h1>
                  <p className="text-[#988686] text-xs md:text-sm leading-relaxed mb-6">
                    Connect with peer engineers, tackle active challenges, and collaborate within skill-focused communities.
                  </p>
                  
                  {/* Subtle Profile Completion Bar */}
                  <div className="bg-[#0a0909]/90 border border-[#5C4E4E]/80 border-[#5C4E4E]/45 rounded-lg p-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex justify-between text-xs font-medium text-[#988686] mb-1.5">
                        <span>Profile Completion</span>
                        <span className="font-mono">{calculateProfileCompletion()}%</span>
                      </div>
                      <div className="w-full bg-[#5C4E4E]/50 rounded-full h-1.5">
                        <div className="bg-[#D1D0D0] h-1.5 rounded-full transition-all duration-300" style={{ width: `${calculateProfileCompletion()}%` }} />
                      </div>
                    </div>
                    {calculateProfileCompletion() < 100 && (
                      <button onClick={() => setActiveTab('profile')} className="px-3 py-1.5 text-xs font-semibold bg-[#D1D0D0] text-black hover:bg-[#e8e7e7] rounded-md transition shrink-0">
                        Complete Profile
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid - Restrained Minimal Cards */}
              <div>
                <h3 className="text-xs font-bold text-[#988686] uppercase tracking-wider mb-3">
                  Quick Navigation
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {quickAccessItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.tab)}
                      className="flex items-center space-x-2.5 px-4 py-3 bg-[#141111] border border-[#5C4E4E]/55/60 border-[#5C4E4E]/45/60 rounded-md hover:bg-[#1c1818] transition text-left"
                    >
                      <item.icon className="w-4 h-4 text-[#988686] shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-xs text-[#D1D0D0]">{item.title}</p>
                        <p className="text-[10px] text-[#988686]">{item.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Two Column Layout for Recommended Skill Matches & Activity */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Recommended Skill Matches */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#D1D0D0]">Discovery</h2>
                      <p className="text-xs text-[#988686]">People matched to your skills and interests</p>
                    </div>
                    <button onClick={() => setActiveTab('find-match')} className="text-xs font-semibold text-[#D1D0D0] hover:underline">
                      Explore All
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    {matches.slice(0, 4).map((user) => (
                      <div key={user.id} className="bg-[#141111] border border-[#5C4E4E]/55 rounded-lg p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start space-x-3 mb-3">
                            <Avatar className="w-10 h-10 border border-[#5C4E4E]/55">
                              {user.avatar_url ? (<AvatarImage src={user.avatar_url} />) : (
                                <AvatarFallback className="bg-[#D1D0D0] bg-[#5C4E4E]/50 text-[#D1D0D0] text-[#D1D0D0] text-xs font-bold">
                                  {user.avatar}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-xs truncate text-[#D1D0D0]">{user.name}</h4>
                                <span className="text-[11px] font-mono font-semibold text-[#988686] dark:text-[#988686] bg-[#5C4E4E]/40 px-1.5 py-0.5 rounded">
                                  {user.matchScore}% match
                                </span>
                              </div>
                              <p className="text-[11px] text-[#988686] truncate">{user.title}</p>
                              <p className="text-[10px] text-[#988686] flex items-center mt-0.5"><MapPin className="w-3 h-3 mr-0.5 text-[#988686]" /> {user.location}</p>
                            </div>
                          </div>

                          {user.skills && user.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {user.skills.slice(0, 3).map(s => (
                                <span key={s} className="text-[10px] bg-[#5C4E4E]/40/70 text-[#D1D0D0] px-2 py-0.5 rounded font-medium">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-[#5C4E4E]/40">
                          <button onClick={() => setSelectedUserModal(user)} className="flex-1 px-2.5 py-1 text-xs font-medium border border-[#5C4E4E] rounded-md hover:bg-[#1c1818] transition">
                            View Profile
                          </button>
                          {user.connectionStatus === 'connected' ? (
                            <span className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-md">Connected</span>
                          ) : user.connectionStatus === 'requested_sent' ? (
                            <span className="px-2.5 py-1 text-[11px] font-semibold text-[#D1D0D0] bg-amber-50 dark:bg-amber-950/40 rounded-md">Pending</span>
                          ) : (
                            <button onClick={() => handleConnect(user)} className="px-3 py-1 text-xs font-semibold bg-[#D1D0D0] text-black rounded-md hover:bg-[#e8e7e7] transition">
                              Connect
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {matches.length === 0 && (
                      <div className="col-span-full p-6 text-center text-xs text-[#988686] bg-[#141111] rounded-lg border border-[#5C4E4E]/55">
                        No matches yet. Complete your profile skills, then open Find Buddies.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Network + Communities */}
                <div className="space-y-4">
                  <div className="bg-[#141111] border border-[#5C4E4E]/55 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#988686]">Network</h3>
                      <button onClick={() => setActiveTab('connections')} className="text-[11px] font-medium text-[#D1D0D0] hover:underline">View all</button>
                    </div>
                    {incomingRequests.length > 0 && (
                      <div className="mb-3 space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#D1D0D0]">Incoming requests</p>
                        {incomingRequests.slice(0, 2).map((r) => (
                          <div key={r.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-[#5C4E4E]/30 border border-[#5C4E4E]/55">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">{r.otherUser?.name || r.from}</p>
                              <p className="text-[10px] text-[#988686] truncate">{r.otherUser?.title || 'Wants to connect'}</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => respondRequest(r.id, 'accept')} className="px-2 py-1 text-[10px] font-semibold bg-[#D1D0D0] text-black rounded">Accept</button>
                              <button onClick={() => respondRequest(r.id, 'reject')} className="px-2 py-1 text-[10px] font-medium border border-[#5C4E4E] rounded">Decline</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="space-y-2">
                      {connections.slice(0, 3).map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-2 rounded-md hover:bg-[#1c1818] transition">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <Avatar className="w-7 h-7">
                              {c.avatar_url ? (<AvatarImage src={c.avatar_url} />) : (
                                <AvatarFallback className="bg-[#5C4E4E]/40 bg-[#5C4E4E]/50 text-[#D1D0D0] text-[10px] font-bold">
                                  {c.avatar || (c.name || 'U').slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate leading-tight">{c.name}</p>
                              <p className="text-[10px] text-[#988686] truncate">{c.title || c.email}</p>
                            </div>
                          </div>
                          <button onClick={() => setSelectedUserModal(c)} className="text-[11px] text-[#D1D0D0] font-medium hover:underline shrink-0">
                            View
                          </button>
                        </div>
                      ))}
                      {connections.length === 0 && incomingRequests.length === 0 && (
                        <p className="text-xs text-[#988686] py-3 text-center">No connections yet. Find buddies to start.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#141111] border border-[#5C4E4E]/55 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#988686]">Communities</h3>
                      <span className="text-xs font-mono text-[#988686]">{communities.length}</span>
                    </div>
                    <div className="space-y-2">
                      {communities.slice(0, 3).map((comm) => (
                        <div key={comm.id} className="flex items-center justify-between p-2 rounded-md hover:bg-[#1c1818] transition">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{comm.name}</p>
                            <p className="text-[10px] text-[#988686]">{comm.member_count} members â€¢ {comm.domain}</p>
                          </div>
                          <button onClick={() => setSelectedCommunity(comm)} className="px-2.5 py-1 text-[11px] font-medium border border-[#5C4E4E] rounded-md hover:bg-[#1c1818] transition">
                            Open
                          </button>
                        </div>
                      ))}
                      {communities.length === 0 && (
                        <p className="text-xs text-[#988686] py-3 text-center">Not in any community yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning + Activity */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#D1D0D0]">Learning</h2>
                      <p className="text-xs text-[#988686]">Events and challenges from your network</p>
                    </div>
                    <button onClick={() => setActiveTab('events')} className="text-xs font-semibold text-[#D1D0D0] hover:underline">Events</button>
                  </div>
                  <div className="space-y-2">
                    {events.slice(0, 3).map((e) => (
                      <div key={e.id} className="bg-[#141111] border border-[#5C4E4E]/55 rounded-lg p-3.5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#D1D0D0] truncate">{e.title}</p>
                          <p className="text-[11px] text-[#988686] mt-0.5">{e.date || 'TBA'}{e.time ? ` Â· ${e.time}` : ''} Â· {e.attendees_count || 0} attending</p>
                        </div>
                        <button onClick={() => openEventModal(e.id)} className="text-[11px] font-medium text-[#D1D0D0] hover:underline shrink-0">Details</button>
                      </div>
                    ))}
                    {challenges.filter(c => c.is_joined).slice(0, 2).map((c) => (
                      <div key={c.id} className="bg-[#141111] border border-[#5C4E4E]/55 rounded-lg p-3.5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#D1D0D0] truncate">{c.title}</p>
                          <p className="text-[11px] text-[#988686] mt-0.5">Challenge Â· {c.difficulty || 'Medium'} Â· {c.points || 150} pts</p>
                        </div>
                        <button onClick={() => openChallengeModal(c.id)} className="text-[11px] font-medium text-[#D1D0D0] hover:underline shrink-0">Open</button>
                      </div>
                    ))}
                    {events.length === 0 && challenges.filter(c => c.is_joined).length === 0 && (
                      <div className="p-5 text-center text-xs text-[#988686] bg-[#141111] rounded-lg border border-[#5C4E4E]/55">
                        No upcoming events or joined challenges yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#D1D0D0]">Activity</h2>
                      <p className="text-xs text-[#988686]">Recent system notifications</p>
                    </div>
                    <button onClick={() => setActiveTab('notifications')} className="text-xs font-semibold text-[#D1D0D0] hover:underline">All</button>
                  </div>
                  <div className="bg-[#141111] border border-[#5C4E4E]/55 rounded-lg divide-y divide-[#5C4E4E]/40">
                    {notificationsData.slice(0, 5).map((n) => (
                      <div key={n.id} className={`px-4 py-3 ${n.read ? '' : 'bg-[#1c1818]/80'}`}>
                        <p className="text-xs text-[#D1D0D0] font-medium leading-snug">{n.message}</p>
                        {n.created_at && (
                          <span className="text-[10px] text-[#988686] font-mono mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
                        )}
                      </div>
                    ))}
                    {notificationsData.length === 0 && (
                      <div className="p-5 text-center text-xs text-[#988686]">No recent activity yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FIND BUDDIES TAB */}
          {activeTab === "find-match" && (
            <div className="space-y-6">
              <div className="bg-[#141111] p-5 rounded-lg border border-[#5C4E4E]/55 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#D1D0D0]">Find Skill Buddies</h2>
                    <p className="text-xs text-[#988686] mt-0.5">Semantic match across real user profiles</p>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#988686]" />
                      <input 
                        type="text" 
                        placeholder="Search by skill, name, title..." 
                        className="input-clean pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleFindMatch(); }}
                      />
                    </div>
                    <button onClick={handleFindMatch} disabled={isFinding} className="btn-primary shrink-0">
                      {isFinding ? (<Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />) : null} Search
                    </button>
                  </div>
                </div>

                {skillFilterOptions.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#988686] mb-2">Filter by skill</p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setSelectedSkillFilter(""); handleFindMatch(""); }}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition ${!selectedSkillFilter ? 'bg-[#D1D0D0] text-black border-[#D1D0D0]' : 'bg-[#0a0909] text-[#988686] border-[#5C4E4E]/55 hover:bg-black'}`}
                      >
                        All
                      </button>
                      {skillFilterOptions.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => {
                            const next = selectedSkillFilter === skill ? "" : skill;
                            setSelectedSkillFilter(next);
                            handleFindMatch(next);
                          }}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition ${selectedSkillFilter === skill ? 'bg-[#D1D0D0] text-black border-[#D1D0D0]' : 'bg-[#0a0909] text-[#988686] border-[#5C4E4E]/55 hover:bg-black'}`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {matchError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-xs">{matchError}</div>
              )}

              {isFinding ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#988686] space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#988686] dark:text-[#988686]" />
                  <p className="text-xs font-medium">Matching vector embeddings...</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matches.map((user) => (
                    <div key={user.id} className="bg-[#141111] border border-[#5C4E4E]/55 rounded-lg p-4 flex flex-col justify-between hover:border-[#5C4E4E] dark:hover:border-gray-600 transition">
                      <div>
                        <div className="flex items-start space-x-3 mb-3">
                          <Avatar className="w-12 h-12 border border-[#5C4E4E]/55">
                            {user.avatar_url ? (<AvatarImage src={user.avatar_url} />) : (
                              <AvatarFallback className="bg-[#D1D0D0] bg-[#5C4E4E]/50 text-[#D1D0D0] text-[#D1D0D0] text-sm font-bold">
                                {user.avatar}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-sm truncate">{user.name}</h4>
                              <span className="text-[10px] font-mono font-bold text-[#988686] dark:text-[#988686] bg-[#5C4E4E]/40 px-1.5 py-0.5 rounded">
                                {user.matchScore}%
                              </span>
                            </div>
                            <p className="text-xs text-[#988686] truncate">{user.title}</p>
                            <p className="text-[11px] text-[#988686] flex items-center mt-0.5"><MapPin className="w-3 h-3 mr-0.5 text-[#988686]" />{user.location || 'Remote'}</p>
                          </div>
                        </div>

                        {user.bio && (
                          <p className="text-xs text-[#988686] line-clamp-2 mb-3 italic">"{user.bio}"</p>
                        )}

                        {user.skills && user.skills.length > 0 && (
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-1">
                              {user.skills.map((skill) => (
                                <span key={skill} className="text-[10px] bg-[#5C4E4E]/40/70 text-[#D1D0D0] px-2 py-0.5 rounded font-medium">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#5C4E4E]/40 flex gap-2">
                        <button onClick={() => setSelectedUserModal(user)} className="flex-1 px-3 py-1.5 text-xs font-medium border border-[#5C4E4E] rounded-md hover:bg-[#1c1818] transition">
                          Profile
                        </button>
                        {user.connectionStatus === 'connected' ? (
                          <span className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-md">Connected</span>
                        ) : user.connectionStatus === 'requested_sent' ? (
                          <button onClick={() => cancelRequest(user.requestId, user.email)} className="px-3 py-1.5 text-xs font-medium text-amber-700 border border-amber-300 rounded-md hover:bg-amber-50 transition">
                            Cancel Request
                          </button>
                        ) : user.connectionStatus === 'requested_received' ? (
                          <button onClick={() => respondRequest(user.requestId, 'accept')} className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition">
                            Accept
                          </button>
                        ) : (
                          <button onClick={() => handleConnect(user)} className="px-3 py-1.5 text-xs font-semibold bg-[#D1D0D0] text-black rounded-md hover:bg-[#e8e7e7] transition flex items-center justify-center">
                            <UserPlus className="w-3.5 h-3.5 mr-1" /> Connect
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {matches.length === 0 && (
                    <div className="col-span-full py-12 text-center text-xs text-[#988686] bg-[#141111] rounded-lg border border-[#5C4E4E]/55">
                      No profiles found matching search query.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CONNECTIONS TAB */}
          {activeTab === "connections" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#D1D0D0]">Connections</h2>
                <p className="text-xs text-[#988686]">Incoming requests & verified skill connections</p>
              </div>

              {/* Pending Received Requests */}
              <div className="bg-[#141111] border border-[#5C4E4E]/55 rounded-lg p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#988686] mb-3">
                  Incoming Connection Requests ({incomingRequests.length})
                </h3>
                <div className="space-y-2">
                  {incomingRequests.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-[#1c1818] rounded-lg border border-[#5C4E4E]/45">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-[#5C4E4E] text-white font-bold text-xs">
                            {r.otherUser?.avatar || (r.from || 'U').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-xs">{r.otherUser?.name || r.from}</h4>
                          <p className="text-[11px] text-[#988686]">{r.otherUser?.title || r.from}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => respondRequest(r.id, 'accept')} className="px-3 py-1 text-xs font-semibold bg-[#D1D0D0] text-black rounded-md hover:bg-[#e8e7e7] transition">
                          Accept
                        </button>
                        <button onClick={() => respondRequest(r.id, 'reject')} className="px-3 py-1 text-xs font-medium border border-[#5C4E4E] text-[#D1D0D0] rounded-md hover:bg-[#1c1818] transition">
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                  {incomingRequests.length === 0 && (
                    <p className="text-xs text-[#988686] py-3 text-center">No incoming connection requests.</p>
                  )}
                </div>
              </div>

              {/* Connected Buddies */}
              <div className="bg-[#141111] border border-[#5C4E4E]/55 rounded-lg p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#988686] mb-3">
                  Connected Peers ({connections.length})
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {connections.map((c) => (
                    <div key={c.id} className="p-3 bg-[#1c1818] rounded-lg border border-[#5C4E4E]/45 flex items-start space-x-3">
                      <Avatar className="w-10 h-10 border border-[#5C4E4E]/55">
                        {c.avatar_url ? (<AvatarImage src={c.avatar_url} />) : (
                          <AvatarFallback className="bg-[#5C4E4E]/40 bg-[#5C4E4E]/50 text-[#D1D0D0] text-xs font-bold">
                            {c.avatar || (c.name || 'U').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-xs truncate">{c.name}</h4>
                        <p className="text-[11px] text-[#988686] truncate">{c.title || c.email}</p>
                        <button onClick={() => setSelectedUserModal(c)} className="mt-2 text-[11px] font-medium text-[#D1D0D0] hover:underline">
                          View Profile
                        </button>
                      </div>
                    </div>
                  ))}
                  {connections.length === 0 && (
                    <div className="col-span-full py-6 text-center text-xs text-[#988686]">
                      No active connections found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CHALLENGES TAB */}
          {activeTab === "challenges" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#D1D0D0]">Active Challenges</h2>
                  <p className="text-xs text-[#988686]">Developer sprints & problem solving</p>
                </div>
                <button onClick={loadChallenges} className="btn-outline">Refresh</button>
              </div>

              {challengesLoading ? (
                <div className="flex items-center justify-center py-16 text-[#988686] text-xs">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin text-[#988686]" /> Loading challenges...
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {challenges.map((c) => (
                    <div key={c.id} className="bg-[#141111] border border-[#5C4E4E]/55 rounded-lg p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-semibold bg-[#5C4E4E]/40 px-2 py-0.5 rounded text-[#D1D0D0]">
                            {c.difficulty || 'Medium'}
                          </span>
                          <span className="text-xs font-mono font-medium text-[#988686]">{c.points || 150} pts</span>
                        </div>
                        <h3 className="font-bold text-sm mb-1 text-[#D1D0D0]">{c.title}</h3>
                        <p className="text-xs text-[#988686] line-clamp-2 mb-4">{c.description}</p>
                      </div>

                      <div className="pt-3 border-t border-[#5C4E4E]/40">
                        <div className="flex items-center justify-between text-xs text-[#988686] mb-3">
                          <span>{c.participant_count || 0} participants</span>
                          <span>{c.creator_name || 'Admin'}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openChallengeModal(c.id)} className="flex-1 px-3 py-1.5 text-xs font-medium border border-[#5C4E4E] rounded-md hover:bg-[#1c1818] transition">
                            Details
                          </button>
                          {c.is_joined ? (
                            <button onClick={() => leaveChallenge(c.id)} disabled={joiningId === c.id} className="px-3 py-1.5 text-xs font-medium border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition">
                              Leave
                            </button>
                          ) : (
                            <button onClick={() => joinChallenge(c.id)} disabled={joiningId === c.id} className="px-3 py-1.5 text-xs font-semibold bg-[#D1D0D0] text-black rounded-md hover:bg-[#e8e7e7] transition">
                              Join Sprint
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EVENTS TAB */}
          {activeTab === "events" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#D1D0D0]">Community Events</h2>
                  <p className="text-xs text-[#988686]">Live tech talks & workshops</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowCreateEventModal(true)} className="btn-primary">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Create Event
                  </button>
                  <button onClick={loadEvents} className="btn-outline">Refresh</button>
                </div>
              </div>

              {eventsLoading ? (
                <div className="flex items-center justify-center py-16 text-[#988686] text-xs">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin text-[#988686]" /> Loading events...
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((e) => (
                    <div key={e.id} className="bg-[#141111] border border-[#5C4E4E]/55 rounded-lg p-5 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-semibold bg-[#5C4E4E]/40 px-2 py-0.5 rounded text-[#D1D0D0] mb-2 inline-block">
                          {e.location || 'Online'}
                        </span>
                        <h3 className="font-bold text-sm text-[#D1D0D0] mb-1">{e.title}</h3>
                        <p className="text-xs text-[#988686] line-clamp-2 mb-3">{e.description}</p>
                        <div className="text-xs text-[#988686] space-y-1 mb-4">
                          <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#988686]" /> {e.date || 'TBA'} {e.time}</p>
                          <p className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#988686]" /> {e.attendees_count || 0} Attendees</p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-[#5C4E4E]/40">
                        <button onClick={() => openEventModal(e.id)} className="flex-1 px-3 py-1.5 text-xs font-medium border border-[#5C4E4E] rounded-md hover:bg-[#1c1818] transition">
                          Details
                        </button>
                        {e.is_attending ? (
                          <button onClick={() => leaveEvent(e.id)} disabled={joiningId === e.id} className="px-3 py-1.5 text-xs font-medium border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition">
                            Leave
                          </button>
                        ) : (
                          <button onClick={() => joinEvent(e.id)} disabled={joiningId === e.id} className="px-3 py-1.5 text-xs font-semibold bg-[#D1D0D0] text-black rounded-md hover:bg-[#e8e7e7] transition">
                            RSVP
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#D1D0D0]">Notifications</h2>
                  <p className="text-xs text-[#988686]">Activity alerts & announcements</p>
                </div>
                <button 
                  onClick={async () => {
                    await fetchWithAuth('/notifications/clear', { method: 'DELETE' });
                    setNotificationsData([]);
                  }}
                  className="text-xs text-red-600 hover:underline font-medium"
                >
                  Clear All
                </button>
              </div>

              <div className="bg-[#141111] border border-[#5C4E4E]/55 rounded-lg divide-y divide-[#5C4E4E]/40">
                {notificationsData.map((n) => (
                  <div key={n.id} className={`p-4 flex items-center justify-between gap-4 ${n.read ? '' : 'bg-[#1c1818]/70'}`}>
                    <div className="flex items-start space-x-3">
                      <Bell className="w-4 h-4 text-[#988686] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-[#D1D0D0] font-medium">{n.message}</p>
                        {n.created_at && (
                          <span className="text-[10px] text-[#988686] font-mono mt-0.5 block">{new Date(n.created_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {n.type === 'connection_request' && (
                        <>
                          <button onClick={() => respondRequest(n.request_id, 'accept')} className="px-2.5 py-1 text-xs font-semibold bg-[#D1D0D0] text-black rounded hover:bg-[#e8e7e7] transition">
                            Accept
                          </button>
                          <button onClick={() => respondRequest(n.request_id, 'reject')} className="px-2.5 py-1 text-xs font-medium border border-[#5C4E4E] text-[#D1D0D0] rounded hover:bg-black transition">
                            Decline
                          </button>
                        </>
                      )}
                      {!n.read && (
                        <button onClick={() => markNotificationRead(n.id)} className="text-[11px] text-[#988686] hover:underline font-medium">
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {notificationsData.length === 0 && (
                  <div className="p-8 text-center text-xs text-[#988686]">
                    No new notifications.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="page-title">Edit Profile</h2>
                <p className="page-subtitle">Your profile powers skill matching and community discovery.</p>
              </div>

              <div className="bg-[#141111] border border-[#5C4E4E]/55 rounded-lg p-6 space-y-6">
                <form onSubmit={saveProfileEdits} className="space-y-5">
                  {/* Avatar */}
                  <div className="flex items-center gap-4 pb-4 border-b border-[#5C4E4E]/40">
                    <Avatar className="w-14 h-14 border border-[#5C4E4E]">
                      {profileForm.avatar_url ? (<AvatarImage src={profileForm.avatar_url} />) : (
                        <AvatarFallback className="bg-[#5C4E4E]/40 bg-[#5C4E4E]/50 text-[#D1D0D0] text-[#D1D0D0] font-bold text-base">
                          {displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <label className="px-3 py-1.5 border border-[#5C4E4E] rounded-md text-xs font-medium cursor-pointer hover:bg-[#1c1818] transition-colors">
                        Upload avatar
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e)=>{
                            const file = e.target.files && e.target.files[0];
                            if (!file) return;
                            if (file.size > 1.5 * 1024 * 1024) { alert('Please select an image under 1.5MB.'); return; }
                            const reader = new FileReader();
                            reader.onload = () => {
                              const avatarData = String(reader.result || '');
                              setProfileForm({ ...profileForm, avatar_url: avatarData });
                              sessionStorage.setItem(`avatar_${userEmail}`, avatarData);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      <p className="text-[11px] text-[#988686] mt-1">PNG or JPG, max 1.5 MB</p>
                    </div>
                  </div>

                  {/* Basic fields */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label-text">Professional title</label>
                      <input className="input-clean" value={profileForm.title} onChange={(e)=>setProfileForm({...profileForm, title: e.target.value})} placeholder="Senior Software Engineer" />
                    </div>
                    <div>
                      <label className="label-text">Company</label>
                      <input className="input-clean" value={profileForm.company} onChange={(e)=>setProfileForm({...profileForm, company: e.target.value})} placeholder="Organization or freelance" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label-text">Location</label>
                      <input className="input-clean" value={profileForm.location} onChange={(e)=>setProfileForm({...profileForm, location: e.target.value})} placeholder="City, Country" />
                    </div>
                    <div>
                      <label className="label-text">Career goals</label>
                      <input className="input-clean" value={profileForm.careerGoals} onChange={(e)=>setProfileForm({...profileForm, careerGoals: e.target.value})} placeholder="e.g. Build distributed systems" />
                    </div>
                  </div>

                  <div>
                    <label className="label-text">Bio</label>
                    <textarea className="input-clean resize-none" rows={3} value={profileForm.bio} onChange={(e)=>setProfileForm({...profileForm, bio: e.target.value})} placeholder="Brief background and what you're working on..." />
                  </div>

                  {/* Skills — tag pill UI */}
                  <div>
                    <label className="label-text">Skills</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        className="input-clean flex-1"
                        value={currentSkillInput}
                        onChange={e => setCurrentSkillInput(e.target.value)}
                        placeholder="Add a skill and press Enter"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = currentSkillInput.trim();
                            if (val && !skillTags.includes(val)) setSkillTags(p => [...p, val]);
                            setCurrentSkillInput('');
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = currentSkillInput.trim();
                          if (val && !skillTags.includes(val)) setSkillTags(p => [...p, val]);
                          setCurrentSkillInput('');
                        }}
                        className="btn-primary px-3"
                      >+</button>
                    </div>
                    {skillTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {skillTags.map(skill => (
                          <span key={skill} className="skill-tag">
                            {skill}
                            <button type="button" onClick={() => setSkillTags(p => p.filter(s => s !== skill))} className="skill-tag-remove">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {skillTags.length === 0 && <p className="text-[11px] text-[#988686]">No skills added yet.</p>}
                  </div>

                  {/* Interests — tag pill UI */}
                  <div>
                    <label className="label-text">Interests</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        className="input-clean flex-1"
                        value={currentInterestInput}
                        onChange={e => setCurrentInterestInput(e.target.value)}
                        placeholder="Add an interest and press Enter"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = currentInterestInput.trim();
                            if (val && !interestTags.includes(val)) setInterestTags(p => [...p, val]);
                            setCurrentInterestInput('');
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = currentInterestInput.trim();
                          if (val && !interestTags.includes(val)) setInterestTags(p => [...p, val]);
                          setCurrentInterestInput('');
                        }}
                        className="btn-primary px-3"
                      >+</button>
                    </div>
                    {interestTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {interestTags.map(interest => (
                          <span key={interest} className="skill-tag">
                            {interest}
                            <button type="button" onClick={() => setInterestTags(p => p.filter(i => i !== interest))} className="skill-tag-remove">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {interestTags.length === 0 && <p className="text-[11px] text-[#988686]">No interests added yet.</p>}
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-[#5C4E4E]/40">
                    <button type="submit" disabled={profileSaving} className="btn-primary">
                      {profileSaving ? (<Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />) : null} Save changes
                    </button>
                    {profileMessage && (
                      <span className={`text-xs font-semibold ${profileMessage.includes('Failed') ? 'text-red-600' : 'text-emerald-600'}`}>
                        {profileMessage}
                      </span>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className="text-xl font-bold text-[#D1D0D0]">Account Settings</h2>
                <p className="text-xs text-[#988686]">Preferences and visibility configuration</p>
              </div>

              <div className="bg-[#141111] border border-[#5C4E4E]/55 rounded-lg p-6 space-y-4">
                <form onSubmit={saveSettings} className="space-y-4">
                  <label className="flex items-center justify-between p-3 bg-black rounded-md border border-[#5C4E4E]/55">
                    <span className="text-xs font-medium">Email notifications</span>
                    <input type="checkbox" checked={settings.emailNotifications} onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })} />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-black rounded-md border border-[#5C4E4E]/55">
                    <span className="text-xs font-medium">Push notifications</span>
                    <input type="checkbox" checked={settings.pushNotifications} onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })} />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-black rounded-md border border-[#5C4E4E]/55">
                    <span className="text-xs font-medium">Profile visibility</span>
                    <select value={settings.profileVisibility} onChange={(e) => setSettings({ ...settings, profileVisibility: e.target.value })} className="bg-[#141111] rounded px-2 py-1 text-xs border border-[#5C4E4E]">
                      <option value="public">Public</option>
                      <option value="connections">Connections Only</option>
                      <option value="private">Private</option>
                    </select>
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <button type="submit" disabled={settingsSaving} className="btn-primary">
                      {settingsSaving ? (<Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />) : null} Save Settings
                    </button>
                    {settingsMessage && (<span className="text-xs font-bold text-emerald-600">{settingsMessage}</span>)}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ADMIN TAB */}
          {activeTab === "admin" && isAdmin && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-bold text-[#D1D0D0]">Admin Control Panel</h2>
                <p className="text-xs text-[#988686]">Platform governance tools</p>
              </div>

              {adminActionStatus && (
                <div className="p-3 bg-[#5C4E4E]/35 dark:bg-gray-800 border border-[#5C4E4E] text-gray-800 text-[#D1D0D0] rounded-lg text-xs font-bold">{adminActionStatus}</div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#141111] border border-[#5C4E4E]/55 rounded-lg p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#988686] mb-3">Create Platform Challenge</h3>
                  <form onSubmit={handleAdminCreateChallenge} className="space-y-3">
                    <input className="input-clean" placeholder="Title" value={adminChallengeForm.title} onChange={e=>setAdminChallengeForm({...adminChallengeForm, title: e.target.value})} required />
                    <textarea className="input-clean h-16" placeholder="Description" value={adminChallengeForm.description} onChange={e=>setAdminChallengeForm({...adminChallengeForm, description: e.target.value})} required />
                    <select className="input-clean" value={adminChallengeForm.difficulty} onChange={e=>setAdminChallengeForm({...adminChallengeForm, difficulty: e.target.value})}>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                    <button type="submit" className="btn-primary w-full">Create Challenge</button>
                  </form>
                </div>

                <div className="bg-[#141111] border border-[#5C4E4E]/55 rounded-lg p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#988686] mb-3">Create Platform Event</h3>
                  <form onSubmit={handleAdminCreateEvent} className="space-y-3">
                    <input className="input-clean" placeholder="Title" value={adminEventForm.title} onChange={e=>setAdminEventForm({...adminEventForm, title: e.target.value})} required />
                    <textarea className="input-clean h-16" placeholder="Description" value={adminEventForm.description} onChange={e=>setAdminEventForm({...adminEventForm, description: e.target.value})} required />
                    <input type="date" className="input-clean" value={adminEventForm.date} onChange={e=>setAdminEventForm({...adminEventForm, date: e.target.value})} required />
                    <button type="submit" className="btn-primary w-full">Create Event</button>
                  </form>
                </div>
              </div>

              <div className="bg-[#141111] border border-[#5C4E4E]/55 rounded-lg p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#988686] mb-3">Broadcast System Notification</h3>
                <form onSubmit={handleAdminSendNotification} className="space-y-3">
                  <textarea className="input-clean h-20" placeholder="Broadcast message..." value={adminNotifForm.message} onChange={e=>setAdminNotifForm({...adminNotifForm, message: e.target.value})} required />
                  <button type="submit" className="btn-primary">Send Broadcast</button>
                </form>
              </div>
            </div>
          )}

          {/* COMMUNITIES TAB */}
          {activeTab === "communities" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#D1D0D0]">Communities</h2>
                  <p className="text-xs text-[#988686]">Groups you joined and can open</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setShowCreateCommunity(true)} className="btn-primary">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Create Community
                  </button>
                  <button onClick={() => { setShowJoinCommunity(true); loadAllCommunities(); }} className="btn-outline">
                    Browse All
                  </button>
                </div>
              </div>

              <div className="relative max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#988686]" />
                <input
                  type="text"
                  className="input-clean pl-9"
                  placeholder="Search your communities..."
                  value={communitySearch}
                  onChange={(e) => setCommunitySearch(e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCommunities.map((community) => (
                  <div key={community.id} className="bg-[#141111] border border-[#5C4E4E]/55 rounded-lg p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-semibold bg-[#5C4E4E]/40 px-2 py-0.5 rounded text-[#D1D0D0] mb-2 inline-block">
                        {community.domain || 'Tech'}
                      </span>
                      <h3 className="font-bold text-sm text-[#D1D0D0] mb-1">{community.name}</h3>
                      <p className="text-xs text-[#988686] line-clamp-2 mb-4">{community.description}</p>
                    </div>
                    <div className="pt-3 border-t border-[#5C4E4E]/40">
                      <div className="flex items-center justify-between text-xs text-[#988686] mb-3">
                        <span>{community.member_count} members</span>
                        <span>Admin: {community.admin_name || 'Admin'}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedCommunity(community)} className="flex-1 px-3 py-1.5 text-xs font-semibold bg-[#D1D0D0] text-black rounded-md hover:bg-[#e8e7e7] transition">
                          Open Community
                        </button>
                        <button onClick={() => leaveCommunity(community.id)} className="px-3 py-1.5 text-xs font-medium border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition">
                          Leave
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredCommunities.length === 0 && (
                  <div className="col-span-full py-12 text-center text-xs text-[#988686] bg-[#141111] rounded-lg border border-[#5C4E4E]/55">
                    {communitySearch.trim()
                      ? 'No communities match your search.'
                      : 'Not joined in any community yet. Click Browse All to discover groups.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}

      {/* User Profile Detail Modal */}
      {selectedUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-[#141111] rounded-lg border border-[#5C4E4E]/55 p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12 border border-[#5C4E4E]/55">
                  {selectedUserModal.avatar_url ? (<AvatarImage src={selectedUserModal.avatar_url} />) : (
                    <AvatarFallback className="bg-[#5C4E4E] text-white font-bold text-sm">
                      {selectedUserModal.avatar || (selectedUserModal.name || 'U').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-bold text-sm text-[#D1D0D0]">{selectedUserModal.name}</h3>
                  <p className="text-xs text-[#988686]">{selectedUserModal.title}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUserModal(null)} className="text-[#988686] hover:text-[#988686]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedUserModal.bio && (
              <p className="text-xs text-[#988686]">{selectedUserModal.bio}</p>
            )}

            {selectedUserModal.skills && selectedUserModal.skills.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#988686] mb-1">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {selectedUserModal.skills.map(s => (
                    <span key={s} className="text-[10px] bg-[#5C4E4E]/40 text-[#D1D0D0] px-2 py-0.5 rounded font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#5C4E4E]/40 flex justify-end gap-2">
              <button onClick={() => setSelectedUserModal(null)} className="btn-outline">Close</button>
              {selectedUserModal.connectionStatus !== 'connected' && (
                <button onClick={() => { handleConnect(selectedUserModal); setSelectedUserModal(null); }} className="btn-primary">
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Challenge Detail Modal */}
      {selectedChallengeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-[#141111] rounded-lg border border-[#5C4E4E]/55 p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold bg-[#5C4E4E]/40 px-2 py-0.5 rounded text-[#D1D0D0] mb-1 inline-block">
                  {selectedChallengeModal.difficulty}
                </span>
                <h3 className="font-bold text-base text-[#D1D0D0]">{selectedChallengeModal.title}</h3>
              </div>
              <button onClick={() => setSelectedChallengeModal(null)} className="text-[#988686] hover:text-[#988686]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#988686] leading-relaxed">{selectedChallengeModal.description}</p>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#988686] mb-2">Participants ({selectedChallengeModal.participant_count})</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-auto">
                {(selectedChallengeModal.participant_profiles || []).map(p => (
                  <span key={p.id} className="text-xs bg-[#5C4E4E]/40 text-[#D1D0D0] px-2 py-1 rounded font-medium">
                    {p.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#5C4E4E]/40 flex justify-end gap-2">
              <button onClick={() => setSelectedChallengeModal(null)} className="btn-outline">Close</button>
              {selectedChallengeModal.is_joined ? (
                <button onClick={() => leaveChallenge(selectedChallengeModal.id)} className="px-3 py-1.5 text-xs font-medium border border-red-300 text-red-600 rounded-md hover:bg-red-50">
                  Leave Challenge
                </button>
              ) : (
                <button onClick={() => joinChallenge(selectedChallengeModal.id)} className="btn-primary">
                  Join Challenge
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEventModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-[#141111] rounded-lg border border-[#5C4E4E]/55 p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold bg-[#5C4E4E]/40 px-2 py-0.5 rounded text-[#D1D0D0] mb-1 inline-block">
                  {selectedEventModal.location || 'Online'}
                </span>
                <h3 className="font-bold text-base text-[#D1D0D0]">{selectedEventModal.title}</h3>
              </div>
              <button onClick={() => setSelectedEventModal(null)} className="text-[#988686] hover:text-[#988686]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#988686] leading-relaxed">{selectedEventModal.description}</p>

            <div className="pt-3 border-t border-[#5C4E4E]/40 flex justify-end gap-2">
              <button onClick={() => setSelectedEventModal(null)} className="btn-outline">Close</button>
              {selectedEventModal.is_attending ? (
                <button onClick={() => leaveEvent(selectedEventModal.id)} className="px-3 py-1.5 text-xs font-medium border border-red-300 text-red-600 rounded-md hover:bg-red-50">
                  Leave Event
                </button>
              ) : (
                <button onClick={() => joinEvent(selectedEventModal.id)} className="btn-primary">
                  RSVP Event
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-[#141111] rounded-lg border border-[#5C4E4E]/55 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#D1D0D0]">Create Event</h3>
              <button onClick={() => setShowCreateEventModal(false)} className="text-[#988686] hover:text-[#988686]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={createEvent} className="space-y-3">
              <input className="input-clean" required value={eventForm.title} onChange={e=>setEventForm({...eventForm, title: e.target.value})} placeholder="Event Title" />
              <textarea className="input-clean h-20" required value={eventForm.description} onChange={e=>setEventForm({...eventForm, description: e.target.value})} placeholder="Description & details..." />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="input-clean" required value={eventForm.date} onChange={e=>setEventForm({...eventForm, date: e.target.value})} />
                <input type="text" className="input-clean" placeholder="Time (e.g. 18:00 UTC)" value={eventForm.time} onChange={e=>setEventForm({...eventForm, time: e.target.value})} />
              </div>
              <input className="input-clean" value={eventForm.location} onChange={e=>setEventForm({...eventForm, location: e.target.value})} placeholder="Location / Online link" />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={eventSaving} className="btn-primary flex-1">Create Event</button>
                <button type="button" onClick={() => setShowCreateEventModal(false)} className="btn-outline flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Community Modal */}
      {showCreateCommunity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-[#141111] rounded-lg border border-[#5C4E4E]/55 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#D1D0D0]">Create Community</h3>
              <button onClick={() => setShowCreateCommunity(false)} className="text-[#988686] hover:text-[#988686]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await fetchWithAuth('/communities', {
                  method: 'POST',
                  body: JSON.stringify({ ...communityForm, admin_name: displayName })
                });
                setShowCreateCommunity(false);
                setCommunityForm({ name: "", domain: "", description: "", profile_pic: "" });
                await loadCommunities();
              } catch (_) {}
            }} className="space-y-3">
              <input className="input-clean" value={communityForm.name} onChange={(e) => setCommunityForm({...communityForm, name: e.target.value})} required placeholder="Community Name" />
              <input className="input-clean" value={communityForm.domain} onChange={(e) => setCommunityForm({...communityForm, domain: e.target.value})} placeholder="Domain (e.g. AI / Web)" />
              <textarea className="input-clean h-20" value={communityForm.description} onChange={(e) => setCommunityForm({...communityForm, description: e.target.value})} required placeholder="Description..." />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">Create Community</button>
                <button type="button" onClick={() => setShowCreateCommunity(false)} className="btn-outline flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Browse All Communities Modal */}
      {showJoinCommunity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl bg-[#141111] rounded-lg border border-[#5C4E4E]/55 p-6 shadow-sm max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#5C4E4E]/40 gap-3">
              <h3 className="font-bold text-sm text-[#D1D0D0] shrink-0">Discover communities</h3>
              <button onClick={() => setShowJoinCommunity(false)} className="text-[#988686] hover:text-[#988686]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="pt-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#988686]" />
                <input
                  type="text"
                  className="input-clean pl-9"
                  placeholder="Search by name, domain, or description..."
                  value={communitySearch}
                  onChange={(e) => setCommunitySearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-y-auto pt-4 space-y-3 flex-1">
              <div className="grid md:grid-cols-2 gap-3">
                {filteredAllCommunities.map((c) => (
                  <div key={c.id} className="p-3 bg-[#1c1818] rounded-lg border border-[#5C4E4E]/45 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-semibold bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-[#D1D0D0] mb-1 inline-block">{c.domain || 'Tech'}</span>
                      <h4 className="font-semibold text-xs text-[#D1D0D0]">{c.name}</h4>
                      <p className="text-[11px] text-[#988686] line-clamp-2 mt-1">{c.description}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#5C4E4E]/45">
                      <span className="text-[11px] text-[#988686]">{c.member_count} members</span>
                      {c.is_member ? (
                        <button onClick={() => { setSelectedCommunity(c); setShowJoinCommunity(false); }} className="px-2.5 py-1 text-[11px] font-semibold bg-[#D1D0D0] text-black rounded-md">Open</button>
                      ) : (
                        <button onClick={() => joinCommunity(c.id)} className="px-2.5 py-1 text-[11px] font-semibold border border-[#5C4E4E] rounded-md hover:bg-[#141111]">Join</button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredAllCommunities.length === 0 && (
                  <div className="col-span-full py-8 text-center text-xs text-[#988686]">
                    {communitySearch.trim() ? 'No communities match your search.' : 'No communities available yet.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* View Community Component */}
      {selectedCommunity && (
        <ViewCommunity 
          community={selectedCommunity}
          onClose={() => setSelectedCommunity(null)}
          isAdmin={Boolean(
            isAdmin && selectedCommunity && (
              (userEmail && selectedCommunity.admin_email === userEmail) ||
              (displayName && selectedCommunity.admin_name === displayName)
            )
          )}
        />
      )}

      {/* Notification Toast */}
      {joinSuccess.open && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="px-3.5 py-2 rounded-lg bg-[#D1D0D0] text-black text-xs font-semibold shadow-lg flex items-center gap-2">
            <Check className="w-3.5 h-3.5" /> {joinSuccess.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
