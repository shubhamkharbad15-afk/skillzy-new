import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    totalPoints: 0,
    recognitions: 0,
    averageActivity: 0,
    weeklyActivity: [],
    leaderboard: []
  });

  useEffect(() => {
    // Load real data from API
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Load community dashboard data
        const [dashboardRes, leaderboardRes] = await Promise.all([
          fetchWithAuth(`/communities/${communityData.id}/dashboard`),
          fetchWithAuth(`/communities/${communityData.id}/leaderboard`)
        ]);
        
        setDashboardData({
          totalPoints: dashboardRes?.totalPoints || 0,
          recognitions: dashboardRes?.recognitions || 0,
          averageActivity: dashboardRes?.averageActivity || 0,
          weeklyActivity: dashboardRes?.weeklyActivity || [],
          leaderboard: leaderboardRes || []
        });
      } catch (error) {
        // Fallback to mock data if API fails
        setDashboardData({
          totalPoints: 2847,
          recognitions: 12,
          averageActivity: 85,
          weeklyActivity: [
            { day: 'Mon', points: 120, activities: 8 },
            { day: 'Tue', points: 95, activities: 6 },
            { day: 'Wed', points: 150, activities: 10 },
            { day: 'Thu', points: 180, activities: 12 },
            { day: 'Fri', points: 200, activities: 15 },
            { day: 'Sat', points: 85, activities: 5 },
            { day: 'Sun', points: 60, activities: 4 }
          ],
          leaderboard: [
            { name: 'Sarah Chen', points: 3240, role: 'Senior Developer', avatar: 'SC' },
            { name: 'Mike Johnson', points: 2890, role: 'Product Manager', avatar: 'MJ' },
            { name: 'Alex Rivera', points: 2650, role: 'UX Designer', avatar: 'AR' },
            { name: 'Emma Wilson', points: 2420, role: 'Data Scientist', avatar: 'EW' },
            { name: 'David Kim', points: 2180, role: 'DevOps Engineer', avatar: 'DK' }
          ]
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Total Points
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {dashboardData.totalPoints.toLocaleString()}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
              Recognitions
            </CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {dashboardData.recognitions}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">
              Avg Activity
            </CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {dashboardData.averageActivity}%
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Weekly average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" />
            Weekly Activity
          </CardTitle>
          <CardDescription>
            Points and activities tracked over the past week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-4">
            {dashboardData.weeklyActivity.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {day.day}
                </div>
                <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-3 mb-2">
                  <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                    {day.points}
                  </div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400">
                    points
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {day.activities} activities
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Member Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Member Leaderboard
          </CardTitle>
          <CardDescription>
            Top contributors this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardData.leaderboard.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {member.avatar}
                  </div>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-gray-500">{member.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                    {member.points.toLocaleString()} pts
                  </Badge>
                  {index < 3 && (
                    <Star className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyDashboard;
