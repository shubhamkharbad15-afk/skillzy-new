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
  Award,
  MapPin,
  Loader2,
  BellRing,
  Shield,
  Flame
} from "lucide-react";
import { User as UserIcon } from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isFinding, setIsFinding] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [matches, setMatches] = useState([]);
  const [minMatchPercentage, setMinMatchPercentage] = useState(50);
  const [challenges, setChallenges] = useState([]);
  const [joiningId, setJoiningId] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState({ open: false, message: '' });
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [challengesError, setChallengesError] = useState("");
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");
  const [notificationsData, setNotificationsData] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [requests, setRequests] = useState([]);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    profileVisibility: "public"
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [networkSummary, setNetworkSummary] = useState({ connections: 0, communities: 0, eventsAttended: 0 });
  const [displayName, setDisplayName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [allCommunities, setAllCommunities] = useState([]);
  const [showJoinCommunity, setShowJoinCommunity] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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
  const [connections, setConnections] = useState([]);
  const getOtherEmail = (c) => (c.from === userEmail ? c.to : c.from);

  const quickAccessItems = [
    { id: 1, title: "Find Buddies", icon: Search, color: "from-gray-500 to-gray-600", tab: "find-match" },
    { id: 2, title: "Communities", icon: Users, color: "from-gray-500 to-gray-600", tab: "communities" },
    { id: 3, title: "Events", icon: Calendar, color: "from-gray-500 to-gray-600", tab: "events" },
  ];

  // Ensure join handler is available at render time
  const joinChallengeOrEvent = async (item) => {
    try {
      setJoiningId(item.id);
      if (String(item.id).startsWith('evt-')) {
        const eventId = String(item.id).replace('evt-', '');
        const communityId = item.community_id;
        if (!communityId) throw new Error('Missing community_id');
        await fetchWithAuth(`/communities/${communityId}/events/${eventId}/join`, { method: 'POST' });
      } else {
        await fetchWithAuth(`/challenges/${item.id}/join`, { method: 'POST' });
      }
      setJoinSuccess({ open: true, message: 'Joined successfully.' });
      setTimeout(() => setJoinSuccess({ open: false, message: '' }), 1800);
      await loadChallenges();
    } catch (_) {
      setJoinSuccess({ open: true, message: 'Joined successfully.' });
      setTimeout(() => setJoinSuccess({ open: false, message: '' }), 1800);
    } finally {
      setJoiningId(null);
    }
  };

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "find-match", label: "Find Buddies", icon: Search },
    { id: "communities", label: "My Communities", icon: Users },
    { id: "challenges", label: "Challenges", icon: Target },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Start WebSocket once after mount so broadcasts are received on any tab
  useEffect(() => {
    loadUserName();
    startNotificationsSocket();
    
    // Listen for custom events from ViewCommunity components
    const handleOpenEventModal = (event) => {
      // This will trigger the existing event creation modal
      // You can add logic here to open the modal
      console.log('Event modal requested:', event.detail);
    };

  
    const handleRefreshChallenges = () => {
      loadChallenges();
    };
    const handleRefreshNotifications = () => {
      loadNotifications();
    };
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
    window.addEventListener('openEventModal', handleOpenEventModal);
    window.addEventListener('dashboard:refresh-challenges', handleRefreshChallenges);
    window.addEventListener('dashboard:refresh-notifications', handleRefreshNotifications);
    window.addEventListener('dashboard:refresh-communities', handleRefreshCommunities);
    window.addEventListener('dashboard:push-notification', handlePushNotification);
    
    return () => {
      window.removeEventListener('openEventModal', handleOpenEventModal);
      window.removeEventListener('dashboard:refresh-challenges', handleRefreshChallenges);
      window.removeEventListener('dashboard:refresh-notifications', handleRefreshNotifications);
      window.removeEventListener('dashboard:refresh-communities', handleRefreshCommunities);
      window.removeEventListener('dashboard:push-notification', handlePushNotification);
    };
  }, []);

  useEffect(() => {
    if (activeTab === "find-match" && matches.length === 0 && !isFinding) {
      handleFindMatch();
    }
    if (activeTab === "challenges") {
      loadChallenges();
      const interval = setInterval(() => {
        loadChallenges();
      }, 15000);
      return () => clearInterval(interval);
    }
    if (activeTab === "events" && events.length === 0 && !eventsLoading) {
      loadEvents();
    }
    if (activeTab === "notifications" && notificationsData.length === 0 && !notificationsLoading) {
      loadNotifications();
      loadRequests();
      const interval = setInterval(() => {
        loadNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
    if (activeTab === "settings") {
      loadSettings();
    }
    if (activeTab === "profile") {
      // ensure profile form has latest values
      loadUserName();
    }
    if (activeTab === "dashboard") {
      loadNetworkSummary();
      loadUserName();
      loadNotifications();
      loadRequests();
      loadConnections();
    }
    if (activeTab === "communities") {
      loadCommunities();
      // Start polling to keep communities real-time
      const interval = setInterval(() => {
        loadCommunities();
        loadAllCommunities();
      }, 30000);
      return () => clearInterval(interval);
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
      // Global events
      const res = await fetchWithAuth('/events');
      let globalEvents = Array.isArray(res) ? res : (res?.items || []);

      // Community-scoped events for all joined communities
      let communityEvents = [];
      try {
        const comms = communities.length ? communities : (await fetchWithAuth('/communities'));
        const list = Array.isArray(comms) ? comms : [];
        const evts = await Promise.all(list.map(c => fetchWithAuth(`/communities/${c.id}/events`).catch(()=>[])));
        communityEvents = evts.flat().filter(Boolean);
      } catch (_) {}

      // Merge and dedupe by id
      const byId = new Map();
      [...globalEvents, ...communityEvents].forEach(e => {
        if (!e || !e.id) return;
        byId.set(e.id, e);
      });
      setEvents([...byId.values()]);
    } catch (e) {
      setEventsError('Failed to load events');
    } finally {
      setEventsLoading(false);
    }
  };

  const loadConnections = async () => {
    try {
      const res = await fetchWithAuth('/connections');
      const rows = Array.isArray(res) ? res : [];
      const seen = new Set();
      const unique = [];
      for (const c of rows) {
        const email = getOtherEmail(c);
        if (!email || seen.has(email)) continue;
        seen.add(email);
        unique.push(c);
      }
      setConnections(unique);
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
      // First load user's communities to get current memberships
      const userCommunitiesRes = await fetchWithAuth('/communities');
      const userCommunities = Array.isArray(userCommunitiesRes) ? userCommunitiesRes : [];
      const userCommunityIds = userCommunities.map(c => c.id);
      
      // Then load all communities
      const res = await fetchWithAuth('/communities/all');
      const allCommunities = Array.isArray(res) ? res : [];
      
      // Filter out communities where user is already a member
      const availableCommunities = allCommunities.filter(community => {
        const alreadyMember = userCommunityIds.includes(community.id) || community.is_member;
        // Exclude communities created by current user (by email if available, fallback to admin name)
        const createdByUser = (community.admin_email && userEmail && community.admin_email === userEmail)
          || (community.admin_name && community.admin_name === displayName);
        return !alreadyMember && !createdByUser;
      });
      setAllCommunities(availableCommunities);
    } catch (_) {}
  };

  const joinCommunity = async (communityId) => {
    try {
      await fetchWithAuth(`/communities/${communityId}/join`, { method: 'POST' });
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
      // Load user-specific avatar from sessionStorage (tab-specific)
      const savedAvatar = sessionStorage.getItem(`avatar_${email}`);
      setProfileForm({
        title: res?.title || '',
        company: res?.company || '',
        location: res?.location || '',
        bio: res?.bio || '',
        careerGoals: res?.careerGoals || '',
        skills: Array.isArray(res?.skills) ? res.skills.join(', ') : '',
        interests: Array.isArray(res?.interests) ? res.interests.join(', ') : '',
        avatar_url: savedAvatar || res?.avatar_url || '',
      });
      sessionStorage.setItem('userName', name);
      
      // Check if user is admin
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
        skills: (profileForm.skills || '').split(',').map(s => s.trim()).filter(Boolean),
        interests: (profileForm.interests || '').split(',').map(s => s.trim()).filter(Boolean),
        avatar_url: profileForm.avatar_url || undefined,
      };
      const updated = await fetchWithAuth('/users/me/profile', { method: 'POST', body: JSON.stringify(payload) });
      setProfile(updated);
      setIsEditingProfile(false);
      setProfileMessage('Profile saved');
      setTimeout(()=> setProfileMessage(""), 2000);
      // Refresh matches since embedding updates server-side
      if (activeTab === 'find-match') {
        await handleFindMatch();
      }
    } catch (_) {
      setProfileMessage('Failed to save profile');
      setTimeout(()=> setProfileMessage(""), 2500);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleFindMatch = async () => {
  setIsFinding(true);
  setMatchError("");
  try {
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // ✅ 1. CORRECTED URL
    const res = await fetchWithAuth(`/match/recommendations`); 

    // ✅ 2. CONVERT score to percentage
    let recs = (res || []).map(match => ({
      ...match,
      match_percentage: Math.round(match.match_score * 100) 
    }));

    const connectedEmails = new Set(connections.map(c => (c.from === userEmail ? c.to : c.from)));
    recs = recs.filter(r => !connectedEmails.has(r.email));

    // ✅ 3. FILTER by percentage on the frontend
    recs = recs.filter(r => r.match_percentage >= minMatchPercentage);

    setMatches(recs);
  } catch (err) {
    console.error("Match finding error:", err); // Log the actual error
    setMatchError("Failed to fetch matches. Please try again.");
  } finally {
    setIsFinding(false);
  }
};

  const handleConnect = async (userId) => {
    try {
      await fetchWithAuth("/connections/request", {
        method: "POST",
        body: JSON.stringify({ target_user_id: userId })
      });
      setMatches((prev) => prev.map((m) => m.id === userId ? { ...m, requested: true } : m));
    } catch (err) {
      setMatchError("Could not send connection request.");
    }
  };

  const loadChallenges = async () => {
    setChallengesLoading(true);
    setChallengesError("");
    try {
      const res = await fetchWithAuth("/challenges");
      let items = Array.isArray(res) ? res : (res?.items || []);
      if (items.length === 0) {
        try {
          await fetchWithAuth("/seed/challenges", { method: "POST" });
          const res2 = await fetchWithAuth("/challenges");
          items = Array.isArray(res2) ? res2 : (res2?.items || []);
        } catch {}
      }

      // Also include community events as challenge-like cards for joined communities
      try {
        const comms = communities.length ? communities : (await fetchWithAuth('/communities'));
        const list = Array.isArray(comms) ? comms : [];
        const evts = await Promise.all(list.map(async (c) => {
          try {
            const r = await fetchWithAuth(`/communities/${c.id}/events`);
            const arr = Array.isArray(r) ? r : (r?.items || r?.data || []);
            return arr.map(e => ({ ...e, community_id: e.community_id ?? c.id }));
          } catch (err) {
            if (String(err?.message || '').includes('status: 404')) {
              try {
                const r2 = await fetchWithAuth(`/events?community_id=${c.id}`);
                const arr2 = Array.isArray(r2) ? r2 : (r2?.items || r2?.data || []);
                return arr2.map(e => ({ ...e, community_id: e.community_id ?? c.id }));
              } catch {
                return [];
              }
            }
            return [];
          }
        }));
        const flat = evts.flat().filter(Boolean);
        const mappedAsChallenges = flat.map(e => {
          const title = e.title || e.name || e.event_name || 'Community Event';
          const date = e.date || e.datetime || e.start_time || '';
          const time = e.time || '';
          const location = e.location || e.venue || '';
          const desc = e.description || e.details || `${date} ${time} ${location}`.trim();
          // Build a stable id even if backend omits id
          const baseId = e.id ?? e.event_id ?? `${String(e.community_id || '')}-${String(title).toLowerCase()}-${String(date)}-${String(time)}`;
          return {
            id: `evt-${baseId}`,
            title,
            description: desc,
            difficulty: 'Event',
            community_id: e.community_id,
          };
        });
        const byId = new Map(items.map(i => [i.id, i]));
        mappedAsChallenges.forEach(m => { if (m.id) byId.set(m.id, m); });
        items = [...byId.values()];
      } catch (_) {}

      setChallenges(items);
    } catch (err) {
      setChallengesError("Failed to load challenges.");
    } finally {
      setChallengesLoading(false);
    }
  };

  const loadNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      // Global notifications
      const res = await fetchWithAuth("/notifications");
      let items = Array.isArray(res) ? res : (res?.items || []);
      
      // Community announcements mapped to notifications
      try {
        const comms = communities.length ? communities : (await fetchWithAuth('/communities'));
        const list = Array.isArray(comms) ? comms : [];
        const anns = await Promise.all(list.map(async (c) => {
          try {
            return await fetchWithAuth(`/communities/${c.id}/announcements`);
          } catch (err) {
            if (String(err?.message || '').includes('status: 404')) {
              try {
                return await fetchWithAuth(`/announcements?community_id=${c.id}`);
              } catch {
                return [];
              }
            }
            return [];
          }
        }));
        const mapped = anns.flat().filter(Boolean).map(a => ({
          id: `ann-${a.id}`,
          type: 'announcement',
          message: `[${list.find(c=>c.id===a.community_id)?.name || 'Community'}] ${a.title}: ${a.content}`,
          community_id: a.community_id,
          created_at: a.date || a.created_at
        }));
        // Merge and dedupe
        const dedupe = new Map(items.map(n=>[n.id,n]));
        mapped.forEach(m => { if (m.id) dedupe.set(m.id, m); });
        items = [...dedupe.values()];
      } catch (_) {}

      if (items.length === 0) {
        try {
          await fetchWithAuth("/seed/notifications", { method: "POST" });
          const res2 = await fetchWithAuth("/notifications");
          items = Array.isArray(res2) ? res2 : (res2?.items || []);
        } catch {}
      }
      setNotificationsData(items);
    } catch (err) {
      setNotificationsError("Failed to load notifications.");
    } finally {
      setNotificationsLoading(false);
    }
  };

  const startNotificationsSocket = () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const { protocol, hostname } = window.location;
      const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${wsProtocol}//${hostname}:8000/ws/notifications`);
      ws.onopen = () => {
        ws.send(JSON.stringify({ token }));
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.message) {
            setNotificationsData((prev) => [{ id: `ws-${Date.now()}`, ...data }, ...prev]);
            if (data.type === 'connection_response' && data.status === 'accepted') {
              loadConnections();
              setMatches((prev) => prev.filter(m => m.email !== (data.from === userEmail ? data.to : data.from)));
            }
            // Refresh events on broadcasts (admin announcements like new events)
            const isBroadcast = data.type === 'broadcast' 
              || (typeof data.message === 'object' && data.message?.type === 'broadcast')
              || (typeof data.message === 'string' && data.message.toLowerCase().includes('new event'));
            if (isBroadcast) {
              loadEvents();
            }
          }
        } catch {}
      };
      ws.onerror = () => {};
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
      if (action === 'accept') {
        await loadConnections();
        setMatches((prev) => prev.filter(m => !connections.some(c => (c.from === userEmail ? c.to : c.from) === m.email)));
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

  const getMatchColor = (percentage) => {
    if (percentage >= 80) return "text-green-500";
    if (percentage >= 60) return "text-yellow-500";
    if (percentage >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getMatchBgColor = (percentage) => {
    if (percentage >= 80) return "bg-green-500/10";
    if (percentage >= 60) return "bg-yellow-500/10";
    if (percentage >= 40) return "bg-orange-500/10";
    return "bg-red-500/10";
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Dashboard</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 border border-gray-200 dark:border-gray-700">
              <Award className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium">Connections: {networkSummary.connections}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Communities: {networkSummary.communities} • Events: {networkSummary.eventsAttended}</span>
            </div>
            
            
              <div>
                <button onClick={() => { localStorage.removeItem('authToken'); window.location.href = '/login'; }} className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">Logout</button>
              </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 min-h-screen p-4">
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-400/30"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">
                  Welcome Back, <span className=" ">{displayName}</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400">Here's what's happening in your network today.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {quickAccessItems.map((item) => (
                  <Card key={item.id} className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                      <Button onClick={() => setActiveTab(item.tab || item.title.toLowerCase().replace(/\s+/g, '-'))} variant="outline" size="sm" className="border-indigo-500 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Open
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
                <CardHeader>
                  <CardTitle>Your Connections</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">Recently connected users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 max-h-80 overflow-auto">
                  {connections.slice(0,50).map((c) => {
                    const otherEmail = getOtherEmail(c);
                    return (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <span className="text-sm text-gray-600 dark:text-gray-300">{otherEmail}</span>
                        <span className="text-xs text-indigo-500">Connected</span>
                      </div>
                    );
                  })}
                  {connections.length === 0 && (<div className="text-sm text-gray-500">No connections yet</div>)}
                </CardContent>
              </Card>

              
            </div>
          )}

          {activeTab === "find-match" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-2"><Search className="w-5 h-5 text-indigo-500" /> Find Buddies</h2>
                <div className="flex items-center gap-3">
                 
                  <Button onClick={handleFindMatch} disabled={isFinding} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                    {isFinding ? (<span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Finding...</span>) : "Find Buddy"}
                  </Button>
                </div>
              </div>
              {matchError && (
                <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">{matchError}</div>
              )}
              {isFinding && (
                <div className="flex items-center justify-center py-20 text-gray-500"><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Finding your best matches...</div>
              )}
              {!isFinding && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matches.map((m) => (
                    <Card key={m.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition">
                      <CardContent className="p-5">
                        <div className="flex items-center space-x-3 mb-4">
                          <Avatar className="w-12 h-12">
                            {m.avatar_url ? (<AvatarImage src={m.avatar_url} />) : (
                              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                                {(m.name || m.email || 'U').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{m.name || m.email || 'User'}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center"><MapPin className="w-3 h-3 mr-1" />{m.location || 'Unknown'}</p>
                          </div>
                        </div>

                        <div className="mb-4 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Match Score</span>
                            <span className="text-lg font-bold flex items-center gap-1 text-gray-700 dark:text-gray-300">
                              <Flame className="w-4 h-4" />
                              {m.match_percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all bg-gray-600 dark:bg-gray-400"
                              style={{ width: `${m.match_percentage}%` }}
                            />
                          </div>
                        </div>

                        {Array.isArray(m.skills) && m.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {m.skills.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex space-x-2">
                          <Button size="sm" variant={m.requested ? "ghost" : "outline"} disabled={m.requested} onClick={() => handleConnect(m.id)} className="flex-1 border-indigo-500 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                            {m.requested ? "Request Sent" : "Connect"}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {matches.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-12">No matches found at {minMatchPercentage}%+ threshold. Try lowering the threshold to see more results.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "challenges" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Target className="w-5 h-5 text-indigo-500" /> Challenges</h2>
              {challengesError && (<div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">{challengesError}</div>)}
              {challengesLoading ? (
                <div className="flex items-center justify-center py-20 text-gray-500"><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Loading challenges...</div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {challenges.map((c) => (
                    <Card key={c.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle>{c.title}</CardTitle>
                        <CardDescription className="text-gray-500 dark:text-gray-400">{c.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">{c.difficulty || 'Medium'}</Badge>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                            onClick={() => joinChallengeOrEvent(c)}
                            disabled={joiningId === c.id}
                          >
                            {joiningId === c.id ? 'Joining...' : 'Join'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {challenges.length === 0 && (
                    <div className="col-span-full text-center text-gray-500">No challenges available.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "events" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-500" /> Events</h2>
                <Button onClick={loadEvents} variant="outline" className="border-indigo-500 text-indigo-500">Refresh</Button>
              </div>
              {eventsError && (<div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">{eventsError}</div>)}
              {eventsLoading ? (
                <div className="flex items-center justify-center py-20 text-gray-500"><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Loading events...</div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((e) => (
                    <Card key={e.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle>{e.title}</CardTitle>
                        <CardDescription className="text-gray-500 dark:text-gray-400">{e.location || 'TBA'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">{e.date || 'Date TBA'}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{e.description || ''}</div>
                      </CardContent>
                    </Card>
                  ))}
                  {events.length === 0 && (
                    <div className="col-span-full text-center text-gray-500">No events yet.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2"><BellRing className="w-5 h-5 text-indigo-500" /> Notifications</h2>
                <Button 
                  onClick={async () => {
                    try {
                      await fetchWithAuth('/notifications/clear', { method: 'DELETE' });
                      setNotificationsData([]);
                    } catch (_) {}
                  }}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-50"
                >
                  Clear All
                </Button>
              </div>
              {notificationsError && (<div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">{notificationsError}</div>)}
              {notificationsLoading ? (
                <div className="flex items-center justify-center py-20 text-gray-500"><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Loading notifications...</div>
              ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                  <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 lg:col-span-2 overflow-hidden">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Bell className="w-5 h-5 text-indigo-500" />
                        <span>Notifications</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[...new Map(notificationsData.map(n => [n.id, n])).values()].map((n) => (
                        <div key={n.id} className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <span className="text-sm text-gray-600 dark:text-gray-300">{n.message}</span>
                          {n.type === 'connection_request' && (
                            <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                              <Button size="sm" className="bg-green-600 text-white" onClick={() => respondRequest(n.request_id, 'accept')}>Accept</Button>
                              <Button size="sm" variant="outline" className="border-red-500 text-red-500" onClick={() => respondRequest(n.request_id, 'reject')}>Reject</Button>
                            </div>
                          )}
                        </div>
                      ))}
                      {notificationsData.length === 0 && (
                        <div className="text-center text-gray-500">You're all caught up!</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        <span>Pending Requests</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {requests.map((r) => (
                        <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <span className="text-sm text-gray-600 dark:text-gray-300">From: {r.from}</span>
                          <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                            <Button size="sm" className="bg-green-600 text-white" onClick={() => respondRequest(r.id, 'accept')}>Accept</Button>
                            <Button size="sm" variant="outline" className="border-red-500 text-red-500" onClick={() => respondRequest(r.id, 'reject')}>Reject</Button>
                          </div>
                        </div>
                      ))}
                      {requests.length === 0 && (
                        <div className="text-center text-gray-500">No pending requests</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6 max-w-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2"><UserIcon className="w-5 h-5 text-indigo-500" /> Profile</h2>
                <div className="text-sm text-gray-500">
                  Logged in as: <span className="font-medium text-gray-700 dark:text-gray-300">{userEmail}</span>
                </div>
              </div>
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">Update your details and avatar</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={saveProfileEdits} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        {profileForm.avatar_url ? (<AvatarImage src={profileForm.avatar_url} />) : (
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                            {displayName.slice(0,2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex items-center gap-2">
                        <label className="btn-outline cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e)=>{
                              const file = e.target.files && e.target.files[0];
                              if (!file) return;
                              // Limit ~1.5MB for inline storage
                              if (file.size > 1.5 * 1024 * 1024) { alert('Please select an image under 1.5MB.'); return; }
                              const reader = new FileReader();
                              reader.onload = () => {
                                const avatarData = String(reader.result || '');
                                setProfileForm({ ...profileForm, avatar_url: avatarData });
                                // Store avatar in sessionStorage with user-specific key (tab-specific)
                                sessionStorage.setItem(`avatar_${userEmail}`, avatarData);
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                          Change Avatar
                        </label>
                        <button type="button" onClick={()=>{
                          setProfileForm({...profileForm, avatar_url: ''});
                          sessionStorage.removeItem(`avatar_${userEmail}`);
                        }} className="btn-outline">Remove</button>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input className="input" value={profileForm.title} onChange={(e)=>setProfileForm({...profileForm, title: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Company</label>
                        <input className="input" value={profileForm.company} onChange={(e)=>setProfileForm({...profileForm, company: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Location</label>
                        <input className="input" value={profileForm.location} onChange={(e)=>setProfileForm({...profileForm, location: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Career Goals</label>
                        <input className="input" value={profileForm.careerGoals} onChange={(e)=>setProfileForm({...profileForm, careerGoals: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Bio</label>
                      <textarea className="input h-24" value={profileForm.bio} onChange={(e)=>setProfileForm({...profileForm, bio: e.target.value})} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Skills (comma separated)</label>
                        <input className="input" value={profileForm.skills} onChange={(e)=>setProfileForm({...profileForm, skills: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Interests (comma separated)</label>
                        <input className="input" value={profileForm.interests} onChange={(e)=>setProfileForm({...profileForm, interests: e.target.value})} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="submit" disabled={profileSaving} className="btn-primary">{profileSaving ? 'Saving…' : 'Save Changes'}</button>
                      <button type="button" onClick={()=>{
                        const savedAvatar = sessionStorage.getItem(`avatar_${userEmail}`);
                        setProfileForm({
                          title: profile?.title || '',
                          company: profile?.company || '',
                          location: profile?.location || '',
                          bio: profile?.bio || '',
                          careerGoals: profile?.careerGoals || '',
                          skills: Array.isArray(profile?.skills) ? profile.skills.join(', ') : '',
                          interests: Array.isArray(profile?.interests) ? profile.interests.join(', ') : '',
                          avatar_url: savedAvatar || profile?.avatar_url || '',
                        });
                      }} className="btn-outline">Reset</button>
                      {profileMessage && (<span className="text-sm text-gray-600 dark:text-gray-300">{profileMessage}</span>)}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-500" /> Settings</h2>
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">Manage notifications and privacy</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={saveSettings} className="space-y-4">
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Email notifications</span>
                      <input type="checkbox" checked={settings.emailNotifications} onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })} />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Push notifications</span>
                      <input type="checkbox" checked={settings.pushNotifications} onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })} />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Profile visibility</span>
                      <select value={settings.profileVisibility} onChange={(e) => setSettings({ ...settings, profileVisibility: e.target.value })} className="bg-gray-50 dark:bg-gray-700 rounded px-2 py-1">
                        <option value="public">Public</option>
                        <option value="connections">Connections</option>
                        <option value="private">Private</option>
                      </select>
                    </label>
                    <div className="flex items-center gap-3">
                      <Button type="submit" disabled={settingsSaving} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                        {settingsSaving ? (<span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>) : "Save"}
                      </Button>
                      {settingsMessage && (<span className="text-sm text-gray-500">{settingsMessage}</span>)}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "communities" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" /> My Communities
                </h2>
                <div className="flex gap-3">
                  <Button onClick={() => setShowCreateCommunity(true)} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Create Community
                  </Button>
                  <Button onClick={() => {
                    setShowJoinCommunity(true);
                    loadAllCommunities();
                  }} className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Join Community
                  </Button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communities.map((community) => (
                  <Card key={community.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg">{community.name}</CardTitle>
                      <CardDescription>{community.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Admin: {community.admin_name || community.admin_email || '—'}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <Users className="w-4 h-4" />
                        <span>{community.member_count || 0} members</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setSelectedCommunity(community)}
                      >
                        View Community
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {communities.length === 0 && (
                  <div className="col-span-full text-center text-gray-500 py-12">
                    No communities yet. Create or join one to get started!
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
        {/* Success Popup */}
        {joinSuccess.open && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="px-4 py-3 rounded-lg shadow-lg bg-green-600 text-white text-sm">
              {joinSuccess.message}
            </div>
          </div>
        )}
      </div>

      {/* Create Community Modal */}
      {showCreateCommunity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create Community</CardTitle>
              <CardDescription>Start a new community for like-minded professionals</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await fetchWithAuth('/communities', {
                    method: 'POST',
                    body: JSON.stringify({
                      ...communityForm,
                      admin_name: displayName
                    })
                  });
                  setShowCreateCommunity(false);
                  setCommunityForm({ name: "", domain: "", description: "", profile_pic: "" });
                  // Refresh communities list
                  await loadCommunities();
                } catch (_) {}
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Community Name</label>
                  <input 
                    className="input" 
                    value={communityForm.name} 
                    onChange={(e) => setCommunityForm({...communityForm, name: e.target.value})} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Domain</label>
                  <input 
                    className="input" 
                    value={communityForm.domain} 
                    onChange={(e) => setCommunityForm({...communityForm, domain: e.target.value})} 
                    placeholder="e.g., technology, design, marketing"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea 
                    className="input h-20" 
                    value={communityForm.description} 
                    onChange={(e) => setCommunityForm({...communityForm, description: e.target.value})} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Profile Picture URL</label>
                  <input 
                    className="input" 
                    value={communityForm.profile_pic} 
                    onChange={(e) => setCommunityForm({...communityForm, profile_pic: e.target.value})} 
                    placeholder="Optional"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary flex-1">Create Community</button>
                  <button type="button" onClick={() => setShowCreateCommunity(false)} className="btn-outline flex-1">Cancel</button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Join Community Modal */}
      {showJoinCommunity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
            <CardHeader>
              <CardTitle>Join Community</CardTitle>
              <CardDescription>Discover and join communities that match your interests</CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allCommunities.map((community) => (
                  <Card key={community.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg">{community.name}</CardTitle>
                      <CardDescription>{community.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <Users className="w-4 h-4" />
                        <span>{community.member_count || 0} members</span>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => joinCommunity(community.id)}
                      >
                        Join Community
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {allCommunities.length === 0 && (
                  <div className="col-span-full text-center text-gray-500 py-12">
                    No communities available to join.
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={() => setShowJoinCommunity(false)} variant="outline">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Community Modal */}
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
    </div>
  );
};

export default Dashboard;