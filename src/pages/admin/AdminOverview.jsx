import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminOverview() {
  const [counts, setCounts] = useState({
    films: 0, people: 0, credits: 0,
    users: 0, reviews: 0, pendingClaims: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [films, people, credits, users, reviews, claims] = 
          await Promise.all([
            supabase.from('films').select('*', { count: 'exact', head: true }),
            supabase.from('people').select('*', { count: 'exact', head: true }),
            supabase.from('credits').select('*', { count: 'exact', head: true }),
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('reviews').select('*', { count: 'exact', head: true }),
            supabase.from('profile_claims')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'pending')
          ]);
        setCounts({
          films: films.count || 0,
          people: people.count || 0,
          credits: credits.count || 0,
          users: users.count || 0,
          reviews: reviews.count || 0,
          pendingClaims: claims.count || 0
        });
      } catch (error) {
        console.error('Error fetching counts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCounts();
  }, []);

  const recentActivity = [
    { type: 'film', text: 'New film added: Shanty Town', time: '5m ago' },
    { type: 'claim', text: 'Profile claim submitted: Genevieve Nnaji', time: '1h ago' },
    { type: 'user', text: 'New user signup (fan)', time: '2h ago' },
    { type: 'review', text: 'New review on King of Boys', time: '3h ago' },
    { type: 'sync', text: 'YouTube sync completed — 6 films updated', time: '5h ago' },
    { type: 'film', text: 'Trailer linked: October 1', time: '1d ago' },
    { type: 'claim', text: 'Claim approved: Kunle Afolayan', time: '1d ago' },
    { type: 'user', text: 'New user signup (professional)', time: '2d ago' }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'film': return '🎬';
      case 'claim': return '📋';
      case 'user': return '👤';
      case 'review': return '⭐';
      case 'sync': return '🔄';
      default: return '📌';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'film': return 'border-l-[#D4A017]'; // gold
      case 'claim': return 'border-l-amber-500';
      case 'user': return 'border-l-blue-500';
      case 'review': return 'border-l-green-500';
      case 'sync': return 'border-l-purple-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Row 1 */}
        <div className="bg-[#13192B] rounded-2xl p-6 border border-transparent hover:border-gold/20 transition-colors">
          <div className="text-4xl font-bold text-gold">
            {isLoading ? '-' : counts.films.toLocaleString()}
          </div>
          <div className="text-text-muted text-sm mt-1">Total Films</div>
        </div>
        <div className="bg-[#13192B] rounded-2xl p-6 border border-transparent hover:border-gold/20 transition-colors">
          <div className="text-4xl font-bold text-gold">
            {isLoading ? '-' : counts.people.toLocaleString()}
          </div>
          <div className="text-text-muted text-sm mt-1">Total People</div>
        </div>
        <div className="bg-[#13192B] rounded-2xl p-6 border border-transparent hover:border-gold/20 transition-colors">
          <div className="text-4xl font-bold text-gold">
            {isLoading ? '-' : counts.credits.toLocaleString()}
          </div>
          <div className="text-text-muted text-sm mt-1">Total Credits</div>
        </div>

        {/* Row 2 */}
        <div className="bg-[#13192B] rounded-2xl p-6 border border-transparent hover:border-gold/20 transition-colors">
          <div className="text-4xl font-bold text-gold">
            {isLoading ? '-' : counts.users.toLocaleString()}
          </div>
          <div className="text-text-muted text-sm mt-1">Total Users</div>
        </div>
        <div className="bg-[#13192B] rounded-2xl p-6 border border-transparent hover:border-gold/20 transition-colors">
          <div className="text-4xl font-bold text-gold">
            {isLoading ? '-' : counts.reviews.toLocaleString()}
          </div>
          <div className="text-text-muted text-sm mt-1">Total Reviews</div>
        </div>
        <div className="bg-[#13192B] rounded-2xl p-6 border border-transparent hover:border-gold/20 transition-colors">
          <div className={`text-4xl font-bold ${counts.pendingClaims > 0 ? 'text-amber-500' : 'text-gold'}`}>
            {isLoading ? '-' : counts.pendingClaims.toLocaleString()}
          </div>
          <div className="text-text-muted text-sm mt-1">Pending Claims</div>
          {counts.pendingClaims > 0 && (
            <div className="text-amber-500 text-xs mt-1 font-medium">Needs attention</div>
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-[#13192B] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">Recent Activity</h2>
        </div>
        <div className="divide-y divide-border">
          {recentActivity.map((activity, index) => (
            <div 
              key={index}
              className={`flex items-center justify-between p-4 hover:bg-surface transition-colors border-l-4 ${getActivityColor(activity.type)}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl" aria-hidden="true">{getActivityIcon(activity.type)}</span>
                <span className="text-text-primary text-sm">{activity.text}</span>
              </div>
              <span className="text-text-muted text-xs whitespace-nowrap ml-4">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
