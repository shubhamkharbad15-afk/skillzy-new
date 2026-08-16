import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchWithAuth } from "../lib/api";

const Admin = () => {
  const [challenge, setChallenge] = useState({ title: "", description: "", difficulty: "Medium" });
  const [notif, setNotif] = useState({ user: "", message: "", broadcast: false });
  const [status, setStatus] = useState("");
  const [eventData, setEventData] = useState({ title: "", description: "", date: "", location: "" });
  const [allowed, setAllowed] = useState(true); // Set to true for demo
  const [showMenu, setShowMenu] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  // Simulated admin check - replace with your actual fetchWithAuth logic
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // const res = await fetchWithAuth('/auth/is-admin');
        // if (res?.isAdmin) setAllowed(true); else navigate('/');
        setAllowed(true); // Demo mode
        try {
          const me = await fetchWithAuth('/users/me', { redirectOn401: false });
          const fullName = [me?.first_name, me?.last_name].filter(Boolean).join(' ').trim();
          setAdminName(fullName || (me?.email || 'Admin'));
          setAdminEmail(me?.email || '');
        } catch (_) {}
      } catch (_) {
        // navigate('/');
      }
    };
    checkAdmin();
  }, []);

  const createChallenge = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      await fetchWithAuth("/admin/challenges", { method: "POST", body: JSON.stringify(challenge) });
      // Optional: broadcast a notification to all users
      try {
        await fetchWithAuth("/admin/notifications", { method: "POST", body: JSON.stringify({ broadcast: true, message: `New challenge: ${challenge.title}` }) });
      } catch (_) {}
      setStatus("Challenge created successfully");
      setChallenge({ title: "", description: "", difficulty: "Medium" });
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      setStatus("Failed to create challenge");
    }
  };

  const createNotification = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      await fetchWithAuth("/admin/notifications", { method: "POST", body: JSON.stringify(notif) });
      setStatus("Notification sent successfully");
      setNotif({ user: "", message: "", broadcast: false });
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      setStatus("Failed to send notification");
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      await fetchWithAuth("/admin/events", { method: "POST", body: JSON.stringify(eventData) });
      try {
        await fetchWithAuth("/admin/notifications", { method: "POST", body: JSON.stringify({ broadcast: true, message: `New event: ${eventData.title}` }) });
      } catch (_) {}
      setStatus("Event created successfully");
      setEventData({ title: "", description: "", date: "", location: "" });
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      setStatus("Failed to create event");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  if (!allowed) return null;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Drawer Overlay */}
      {showDrawer && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setShowDrawer(false)}
        ></div>
      )}

      {/* Drawer */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-slate-800 border-r-2 border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 ${showDrawer ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white">Profile</h2>
            <button 
              onClick={() => setShowDrawer(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Profile Info */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4">
              <span className="text-slate-900 text-2xl font-bold">{(adminName || adminEmail || 'AD').trim().split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()}</span>
            </div>
            <h3 className="text-lg font-semibold text-white">{adminName || 'Admin'}</h3>
            {adminEmail && <p className="text-sm text-slate-400 mt-1">{adminEmail}</p>}
          </div>

          <div className="border-t border-slate-700 pt-4 mb-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Role:</span>
                <span className="text-white font-medium">Administrator</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-green-400 font-medium">Active</span>
              </div>
            </div>
          </div>

          {/* Logout Button at Bottom */}
          <div className="mt-auto">
            <button 
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-3 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 p-6 bg-slate-800/70 backdrop-blur-xl rounded-xl shadow-xl border border-slate-700">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowDrawer(true)}
              className="text-white hover:text-slate-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-slate-400 mt-1 hidden md:block">{adminName || 'Admin'}{adminEmail ? ` • ${adminEmail}` : ''}</p>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {status && (
          <div className="mb-6 p-4 bg-slate-700/50 border-l-4 border-slate-400 rounded-lg shadow-md backdrop-blur-sm">
            <p className="text-slate-200 font-medium">{status}</p>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Create Challenge Card */}
          <Card className="bg-slate-800/70 backdrop-blur-xl border-2 border-slate-700 shadow-xl hover:shadow-2xl transition-all rounded-xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-slate-500 to-slate-400"></div>
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Create Challenge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createChallenge} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-300">Title</Label>
                  <Input 
                    value={challenge.title} 
                    onChange={(e) => setChallenge({ ...challenge, title: e.target.value })} 
                    className="h-10 bg-slate-900/50 border-2 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500 transition-colors rounded-lg"
                    placeholder="Enter challenge title"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-300">Description</Label>
                  <Input 
                    value={challenge.description} 
                    onChange={(e) => setChallenge({ ...challenge, description: e.target.value })} 
                    className="h-10 bg-slate-900/50 border-2 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500 transition-colors rounded-lg"
                    placeholder="Describe the challenge"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-300">Difficulty</Label>
                  <select 
                    className="w-full h-10 bg-slate-900/50 border-2 border-slate-700 text-white rounded-lg px-3 outline-none focus:border-slate-500 transition-colors" 
                    value={challenge.difficulty} 
                    onChange={(e) => setChallenge({ ...challenge, difficulty: e.target.value })}
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
                <Button 
                  type="submit"
                  className="w-full h-11 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-lg transition-all transform hover:scale-[1.02] shadow-md hover:shadow-lg"
                >
                  Create Challenge
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Send Notification Card */}
          <Card className="bg-slate-800/70 backdrop-blur-xl border-2 border-slate-700 shadow-xl hover:shadow-2xl transition-all rounded-xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-slate-500 to-slate-400"></div>
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Send Notification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createNotification} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-300">User Email (optional)</Label>
                  <Input 
                    value={notif.user} 
                    onChange={(e) => setNotif({ ...notif, user: e.target.value })} 
                    className="h-10 bg-slate-900/50 border-2 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500 transition-colors rounded-lg"
                    placeholder="defaults to current user"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-300">Message</Label>
                  <Input 
                    value={notif.message} 
                    onChange={(e) => setNotif({ ...notif, message: e.target.value })} 
                    className="h-10 bg-slate-900/50 border-2 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500 transition-colors rounded-lg"
                    placeholder="Enter notification message"
                    required 
                  />
                </div>
                <label className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg cursor-pointer hover:bg-slate-900/50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={notif.broadcast} 
                    onChange={(e) => setNotif({ ...notif, broadcast: e.target.checked })} 
                    className="w-4 h-4 rounded bg-slate-900/50 border-slate-700"
                  />
                  <span className="text-sm font-medium text-slate-300">Broadcast to all users</span>
                </label>
                <Button 
                  type="submit"
                  className="w-full h-11 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-lg transition-all transform hover:scale-[1.02] shadow-md hover:shadow-lg"
                >
                  Send Notification
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Create Event Card */}
          <Card className="lg:col-span-2 bg-slate-800/70 backdrop-blur-xl border-2 border-slate-700 shadow-xl hover:shadow-2xl transition-all rounded-xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-slate-500 to-slate-400"></div>
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Create Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createEvent} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-300">Title</Label>
                    <Input 
                      value={eventData.title} 
                      onChange={(e) => setEventData({ ...eventData, title: e.target.value })} 
                      className="h-10 bg-slate-900/50 border-2 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500 transition-colors rounded-lg"
                      placeholder="Enter event name"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-300">Location</Label>
                    <Input 
                      value={eventData.location} 
                      onChange={(e) => setEventData({ ...eventData, location: e.target.value })} 
                      className="h-10 bg-slate-900/50 border-2 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500 transition-colors rounded-lg"
                      placeholder="Event venue"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-300">Description</Label>
                  <Input 
                    value={eventData.description} 
                    onChange={(e) => setEventData({ ...eventData, description: e.target.value })} 
                    className="h-10 bg-slate-900/50 border-2 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500 transition-colors rounded-lg"
                    placeholder="Describe the event"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-300">Date</Label>
                  <Input 
                    type="date" 
                    value={eventData.date} 
                    onChange={(e) => setEventData({ ...eventData, date: e.target.value })} 
                    className="h-10 bg-slate-900/50 border-2 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500 transition-colors rounded-lg"
                  />
                </div>
                <Button 
                  type="submit"
                  className="w-full h-11 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-lg transition-all transform hover:scale-[1.02] shadow-md hover:shadow-lg"
                >
                  Create Event
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;