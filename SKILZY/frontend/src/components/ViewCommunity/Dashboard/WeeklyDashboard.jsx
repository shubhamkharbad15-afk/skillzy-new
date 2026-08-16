import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchWithAuth } from '../../../lib/api';
import { 
  TrendingUp, 
  Award, 
  Users, 
  Activity,
  Star,
  Target
} from 'lucide-react';

const WeeklyDashboard = ({ communityData }) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalMembers: 0,
    totalPoints: 0,
    recognitions: 0,
    totalEvents: 0,
    totalMessages: 0,
    averageActivity: 0,
    weeklyActivity: [],
    leaderboard: []
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [dashboardRes, leaderboardRes] = await Promise.all([
          fetchWithAuth(`/communities/${communityData.id}/dashboard`),
          fetchWithAuth(`/communities/${communityData.id}/leaderboard`)
        ]);
        
        setDashboardData({
          totalMembers: dashboardRes?.totalMembers || communityData?.member_count || 0,
          totalPoints: dashboardRes?.totalPoints || 0,
          recognitions: dashboardRes?.recognitions || 0,
          totalEvents: dashboardRes?.totalEvents || 0,
          totalMessages: dashboardRes?.totalMessages || 0,
          averageActivity: dashboardRes?.averageActivity || 0,
          weeklyActivity: dashboardRes?.weeklyActivity || [],
          leaderboard: Array.isArray(leaderboardRes) ? leaderboardRes : []
        });
      } catch (error) {
        setDashboardData({
          totalMembers: communityData?.member_count || 1,
          totalPoints: 0,
          recognitions: 0,
          totalEvents: 0,
          totalMessages: 0,
          averageActivity: 0,
          weeklyActivity: [
            { day: 'Mon', points: 0, activities: 0 },
            { day: 'Tue', points: 0, activities: 0 },
            { day: 'Wed', points: 0, activities: 0 },
            { day: 'Thu', points: 0, activities: 0 },
            { day: 'Fri', points: 0, activities: 0 },
            { day: 'Sat', points: 0, activities: 0 },
            { day: 'Sun', points: 0, activities: 0 }
          ],
          leaderboard: []
        });
      }
      setLoading(false);
    };

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [communityData.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 bg-white dark:bg-gray-800 border rounded-lg space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 border rounded-lg">
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Restrained Uniform Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            <span>Total Points</span>
            <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white font-mono">
            {dashboardData.totalPoints.toLocaleString()}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Calculated from activity</p>
        </div>

        <div className="bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            <span>Members</span>
            <Users className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white font-mono">
            {dashboardData.totalMembers}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Active community members</p>
        </div>

        <div className="bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            <span>Discussions</span>
            <Activity className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white font-mono">
            {dashboardData.totalMessages}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Messages sent</p>
        </div>

        <div className="bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            <span>Events</span>
            <Award className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white font-mono">
            {dashboardData.totalEvents}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Community sessions</p>
        </div>
      </div>

      {/* Weekly Activity Breakdown */}
      <div className="bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 rounded-lg p-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-500" /> Weekly Activity Overview
          </h3>
          <p className="text-xs text-gray-500">Activity logged over the past week</p>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {dashboardData.weeklyActivity.map((day, index) => (
            <div key={index} className="text-center p-2 rounded bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800">
              <div className="text-[11px] font-semibold text-gray-500 mb-1">{day.day}</div>
              <div className="text-base font-bold text-gray-900 dark:text-white font-mono">{day.activities}</div>
              <div className="text-[10px] text-gray-400">msgs</div>
            </div>
          ))}
        </div>
      </div>

      {/* Member Leaderboard */}
      <div className="bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 rounded-lg p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" /> Community Leaderboard
            </h3>
            <p className="text-xs text-gray-500">Top contributors calculated from real engagement</p>
          </div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {dashboardData.leaderboard.map((member, index) => (
            <div key={index} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-gray-400 w-4">{index + 1}</span>
                <div className="w-7 h-7 bg-slate-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-slate-800 dark:text-gray-200 text-xs font-bold">
                  {member.avatar || (member.name || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-xs text-gray-900 dark:text-white">{member.name}</div>
                  <div className="text-[11px] text-gray-500">{member.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                  {member.points.toLocaleString()} pts
                </span>
                {index < 3 && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
              </div>
            </div>
          ))}
          {dashboardData.leaderboard.length === 0 && (
            <div className="text-center py-6 text-xs text-gray-500">
              No activity recorded yet for community members.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyDashboard;
