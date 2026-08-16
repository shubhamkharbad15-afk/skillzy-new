import React, { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '../../../lib/api';
import { 
  Send, 
  Smile,
  Paperclip,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const ChatSection = ({ communityId, isAdmin }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
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
    const interval = setInterval(() => {
      loadMessages();
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
      const res = await fetchWithAuth(`/communities/${communityId}/messages`);
      const normalized = (Array.isArray(res) ? res : []).map(m => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.created_at || m.timestamp || Date.now())
      }));
      setMessages(normalized);
      setError('');
    } catch (error) {
      setError('Failed to load messages');
      setMessages([]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      if (containsAbusiveWords(newMessage)) {
        setNotice({ open: true, message: 'Message contains blacklisted language. Please keep discussions professional.' });
        setTimeout(() => setNotice({ open: false, message: '' }), 2500);
        setNewMessage('');
        return;
      }
      const cleanMessage = maskAbusiveWords(newMessage);
      const optimistic = {
        id: `tmp-${Date.now()}`,
        sender_name: user.name,
        sender: user.email,
        message: cleanMessage,
        timestamp: new Date(),
        avatar: user.avatar,
        isAdmin: user.isAdmin
      };
      setMessages(prev => [...prev, optimistic]);
      setNewMessage('');

      await fetchWithAuth(`/communities/${communityId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: optimistic.message })
      });

      await loadMessages();
    } catch (error) {
      setError('Failed to send message');
    }
  };

  const formatTime = (timestamp) => {
    const ts = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(ts.getTime())) return '';
    return ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[550px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200/80 border-[#5C4E4E]/45/80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 border-[#5C4E4E]/45/80">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-slate-700 dark:text-[#988686]" />
          <h3 className="font-semibold text-xs text-gray-900 dark:text-white">Community Chat</h3>
        </div>
        <button onClick={loadMessages} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition p-1">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && (
          <div className="p-2.5 bg-red-50 text-red-700 rounded text-xs border border-red-200">{error}</div>
        )}
        {messages.map((msg) => {
          const isCurrentUser = msg.sender === user.email || msg.sender_name === user.name;
          const senderName = msg.sender_name || msg.sender || 'Member';
          const initials = msg.avatar || senderName.slice(0, 2).toUpperCase();
          
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
              <Avatar className="w-7 h-7 border border-gray-200 border-[#5C4E4E]/45 shrink-0 mt-0.5">
                <AvatarFallback className="bg-slate-200 dark:bg-gray-700 text-slate-800 dark:text-gray-200 text-[10px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className={`max-w-[75%] space-y-0.5 ${isCurrentUser ? 'text-right' : ''}`}>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{senderName}</span>
                  <span>{formatTime(msg.timestamp)}</span>
                </div>
                <div className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                  isCurrentUser 
                    ? 'bg-slate-900 text-white dark:bg-[#D1D0D0] dark:text-slate-900' 
                    : 'bg-[#5C4E4E]/35 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}>
                  {maskAbusiveWords(msg.message)}
                </div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="py-12 text-center text-xs text-gray-400">
            No messages sent yet. Start the discussion!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 border-[#5C4E4E]/45/80 p-3 bg-gray-50/50 dark:bg-gray-900/50">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write a message..."
            className="input-clean flex-1"
          />
          <button type="submit" disabled={!newMessage.trim()} className="btn-primary shrink-0 px-3">
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {notice.open && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="px-3.5 py-2 rounded-lg shadow-lg bg-red-600 text-white text-xs font-semibold">
            {notice.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSection;
