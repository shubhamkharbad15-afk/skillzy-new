import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { fetchWithAuth } from '../../../lib/api';
import { 
  Send, 
  Plus, 
  Smile,
  Paperclip,
  MoreVertical,
  MessageSquare
} from 'lucide-react';

const ChatSection = ({ communityId, isAdmin }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState({ open: false, message: '' });
  const [user, setUser] = useState({ name: 'You', email: '', avatar: 'YU', isAdmin });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const maskAbusiveWords = (text) => {
    if (!text) return '';
    const blacklist = [
      'abuse', 'idiot', 'stupid', 'dumb', 'hate','bloody','dick','prick','penis','pillock','frigging','bollocks','bitch','shit','bastard','slapper','dork','tits','fuck','moron','nigga',
    ];
    let masked = String(text);
    for (const word of blacklist) {
      const re = new RegExp(`\\b${word}\\b`, 'gi');
      masked = masked.replace(re, '***');
    }
    return masked;
  };

  const containsAbusiveWords = (text) => {
    if (!text) return false;
    const blacklist = [
      'abuse', 'idiot', 'stupid', 'dumb', 'hate','bloody','dick','prick','penis','pillock','frigging','bollocks','bitch','shit','bastard','slapper','dork','tits','fuck','moron','nigga',
    ];
    const s = String(text);
    for (const word of blacklist) {
      const re = new RegExp(`\\b${word}\\b`, 'i');
      if (re.test(s)) return true;
    }
    return false;
  };

  useEffect(() => {
    // Load current user for correct sender info
    const loadUser = async () => {
      try {
        const me = await fetchWithAuth('/users/me');
        const fullName = [me?.first_name, me?.last_name].filter(Boolean).join(' ').trim();
        const initials = (fullName || me?.email || 'You').trim().split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
        setUser({
          name: fullName || (me?.email || 'You'),
          email: me?.email || '',
          avatar: initials,
          isAdmin
        });
      } catch (_) {}
    };
    loadUser();
    loadMessages();
    // Set up real-time updates
    const interval = setInterval(() => {
      loadMessages(); // Refresh messages from server
    }, 3000);

    return () => clearInterval(interval);
  }, [communityId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      // Load real messages from API
      const res = await fetchWithAuth(`/communities/${communityId}/messages`);
      const normalized = (Array.isArray(res) ? res : []).map(m => ({
        ...m,
        // Ensure timestamp is a Date object for rendering/formatting
        timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)
      }));
      setMessages(normalized);
      setError('');
    } catch (error) {
      setError('Failed to load messages');
      setMessages([]);
    }
  };

  const addRandomMessage = () => {
    const randomMessages = [
      "That's a great point!",
      "I agree with this approach.",
      "Has anyone tried this before?",
      "Let me know if you need help with this.",
      "This is really helpful, thanks!",
      "I'll look into this and get back to you.",
      "Great work everyone!",
      "Looking forward to the next meeting."
    ];
    
    const randomSenders = [
      { name: 'David Kim', avatar: 'DK', email: 'david.kim@example.com' },
      { name: 'Lisa Park', avatar: 'LP', email: 'lisa.park@example.com' },
      { name: 'Tom Wilson', avatar: 'TW', email: 'tom.wilson@example.com' }
    ];

    const randomSender = randomSenders[Math.floor(Math.random() * randomSenders.length)];
    const randomMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];

    const newMsg = {
      id: Date.now(),
      sender: randomSender.name,
      senderEmail: randomSender.email,
      message: randomMessage,
      timestamp: new Date(),
      avatar: randomSender.avatar,
      isAdmin: false
    };

    setMessages(prev => [...prev, newMsg]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      if (containsAbusiveWords(newMessage)) {
        setNotice({ open: true, message: 'Message not sent: this goes against our community guidelines. Please keep it friendly.' });
        setTimeout(() => setNotice({ open: false, message: '' }), 2500);
        setNewMessage('');
        return;
      }
      // Optimistic add
      const cleanMessage = maskAbusiveWords(newMessage);
      const optimistic = {
        id: `tmp-${Date.now()}`,
        sender: user.name,
        senderEmail: user.email,
        message: cleanMessage,
        timestamp: new Date(),
        avatar: user.avatar,
        isAdmin: user.isAdmin
      };
      setMessages(prev => [...prev, optimistic]);
      setNewMessage('');

      // Send message to server
      await fetchWithAuth(`/communities/${communityId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: optimistic.message })
      });

      // Refresh from server
      await loadMessages();
    } catch (error) {
      setError('Failed to send message');
    }
  };

  const handleFABClick = () => {
    // This will trigger the existing Event Creation Modal
    // We'll emit a custom event that the parent component can listen to
    const event = new CustomEvent('openEventModal', { 
      detail: { 
        userRole: isAdmin ? 'admin' : 'user',
        communityId: communityId 
      } 
    });
    window.dispatchEvent(event);
  };

  const formatTime = (timestamp) => {
    const ts = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(ts.getTime())) return '';
    const now = new Date();
    const diff = now - ts;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Chat Header */}
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            Community Chat
          </CardTitle>
          <Button onClick={loadMessages} variant="outline" className="border-indigo-500 text-indigo-600 hover:bg-indigo-50">
            Refresh
          </Button>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">{error}</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs">
                {msg.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{msg.sender}</span>
                {msg.isAdmin && (
                  <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                    Admin
                  </Badge>
                )}
                <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-md">
                <p className="text-sm text-gray-800 dark:text-gray-200">{maskAbusiveWords(msg.message)}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gray-300 text-gray-600 text-xs">AI</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-md">
                <div className="flex items-center gap-1">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">Someone is typing...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Message Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Smile className="w-4 h-4 text-gray-400" />
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Paperclip className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
          </div>
          <Button type="submit" disabled={!newMessage.trim()} className="bg-indigo-600 hover:bg-indigo-700">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-6 right-6">
        <Button
          onClick={handleFABClick}
          className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
      {notice.open && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="px-4 py-3 rounded-lg shadow-lg bg-orange-600 text-white text-sm">
            {notice.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSection;
