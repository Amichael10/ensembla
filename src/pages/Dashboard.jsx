import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import FilmCard from '../components/film/FilmCard';
import PersonCard from '../components/person/PersonCard';
import { Skeleton } from '../components/ui/Skeleton';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('watchlist');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Real database state
  const [watchlist, setWatchlist] = useState([]);
  const [following, setFollowing] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [watchedFilms, setWatchedFilms] = useState(new Set());
  const [editingReviewId, setEditingReviewId] = useState(null);

  useEffect(() => {
    document.title = "Lumi | Dashboard";
    
    // Redirect professionals to the Pro Hub
    if (user?.role === 'professional' || user?.role === 'admin') {
      navigate('/pro-dashboard');
      return;
    }

    if (user?.id) {
      fetchAllData();
    }
  }, [user?.id, user?.role]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Watchlist
      const { data: wlData } = await supabase
        .from('watchlist')
        .select('*, films(*)')
        .eq('user_id', user.id);
      
      if (wlData) {
        setWatchlist(wlData.map(item => item.films).filter(Boolean));
      }

      // 2. Fetch Following (people)
      const { data: followData } = await supabase
        .from('followers')
        .select('*, people(*)')
        .eq('user_id', user.id);
      
      if (followData) {
        setFollowing(followData.map(item => item.people).filter(Boolean));
      }

      // 3. Fetch Reviews
      const { data: revData } = await supabase
        .from('reviews')
        .select('*, films(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (revData) {
        setReviews(revData.map(r => ({
          ...r,
          film: r.films
        })));
      }

    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async (film) => {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('film_id', film.id);
    
    if (!error) {
      setWatchlist(prev => prev.filter(f => f.id !== film.id));
      toast.success('Removed from watchlist');
    }
  };

  const handleToggleWatched = (film) => {
    setWatchedFilms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(film.id)) {
        newSet.delete(film.id);
      } else {
        newSet.add(film.id);
      }
      return newSet;
    });
  };

  const handleUnfollow = async (personId) => {
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('user_id', user.id)
      .eq('person_id', personId);
    
    if (!error) {
      setFollowing(prev => prev.filter(p => p.id !== personId));
      toast.success('Unfollowed');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);
    
    if (!error) {
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast.success('Review deleted');
    }
  };

  const tabs = [
    { id: 'watchlist', label: 'WATCHLIST', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
    )},
    { id: 'following', label: 'FOLLOWING', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
    )},
    { id: 'reviews', label: 'CRITIC LOG', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    )},
    { id: 'settings', label: 'SETTINGS', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    )}
  ];

  return (
    <div className="min-h-screen bg-bg">

      <div className="max-w-7xl mx-auto border-x border-border flex pt-20 min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-72 border-r border-border flex-col justify-between py-12 shrink-0 bg-surface-2/5">
          <nav className="space-y-2 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                    : 'text-text-muted hover:text-brand hover:bg-surface border border-transparent hover:border-border'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="px-6">
            <div className="bg-surface rounded-xl p-6 border border-border space-y-4">
              <h4 className="font-heading font-bold text-xs text-brand uppercase tracking-widest italic">Verify Profile</h4>
              <p className="text-[10px] text-text-muted font-black uppercase tracking-widest opacity-60 leading-relaxed">Unlock advanced distribution metrics and direct channel management.</p>
              <Link to="/settings/upgrade" className="block w-full text-center py-3 bg-surface-2 text-text-primary border border-border text-[9px] font-black uppercase tracking-widest rounded-lg hover:border-brand hover:text-brand transition-all">
                LEARN MORE
              </Link>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-8 md:p-16">
          {loading ? (
            <div className="space-y-8 animate-pulse">
                <Skeleton className="h-10 w-1/3" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1,2,3,4].map(i => <div key={i} className="aspect-[2/3] bg-surface rounded-xl border border-border" />)}
                </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* WATCHLIST */}
              {activeTab === 'watchlist' && (
                <div className="space-y-12">
                  <div className="flex items-end justify-between border-b border-border pb-6">
                    <div className="space-y-2">
                        <h2 className="font-heading font-bold text-4xl text-text-primary tracking-tighter uppercase italic">Curated Queue</h2>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">PERSONALIZED ARCHIVE SELECTIONS</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest border border-border px-4 py-1.5 rounded-full bg-surface-2/10">
                      {watchlist.length} RECORDS
                    </span>
                  </div>

                  {watchlist.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {watchlist.map(film => (
                        <FilmCard 
                          key={film.id} 
                          film={film} 
                          size="md" 
                          actionType="remove"
                          onAction={handleRemoveFromWatchlist}
                          showWatchedToggle={true}
                          isWatched={watchedFilms.has(film.id)}
                          onToggleWatched={handleToggleWatched}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-surface-2/5 border-2 border-dashed border-border rounded-xl">
                      <div className="w-20 h-20 bg-surface border border-border rounded-full flex items-center justify-center mb-8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand opacity-40"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                      </div>
                      <h3 className="font-heading font-bold text-2xl text-text-primary mb-4 tracking-tighter uppercase italic">Queue is empty</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-8 opacity-60">DISCOVER NOLLYWOOD MASTERPIECES TO ADD</p>
                      <Link to="/browse" className="bg-brand text-white px-10 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-brand/20">
                        BROWSE THE ARCHIVE
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* FOLLOWING */}
              {activeTab === 'following' && (
                <div className="space-y-12">
                   <div className="flex items-end justify-between border-b border-border pb-6">
                    <div className="space-y-2">
                        <h2 className="font-heading font-bold text-4xl text-text-primary tracking-tighter uppercase italic">Connections</h2>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">SUBSCRIBED CREATIVE TALENTS</p>
                    </div>
                  </div>

                  {following.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {following.map(person => (
                        <div key={person.id} className="flex items-center gap-6 bg-surface p-6 rounded-xl border border-border group">
                          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 border-border group-hover:border-brand transition-colors">
                            <img src={person.photo_url || person.photo} alt={person.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link to={`/people/${person.id}`} className="font-bold text-text-primary hover:text-brand transition-colors uppercase tracking-tight truncate block">
                              {person.name}
                            </Link>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60 mt-1">{person.role || 'FILMMAKER'}</p>
                          </div>
                          <button 
                            onClick={() => handleUnfollow(person.id)}
                            className="px-4 py-2 text-[9px] font-black uppercase tracking-widest border border-border rounded hover:bg-red-500/10 hover:text-red-500 transition-all"
                          >
                            UNFOLLOW
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-32 bg-surface-2/5 border-2 border-dashed border-border rounded-xl">
                      <h3 className="font-heading font-bold text-2xl text-text-primary mb-4 tracking-tighter uppercase italic">No Subscriptions</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-8 opacity-60">FOLLOW CREATIVES TO GET NOTIFIED</p>
                      <Link to="/people" className="bg-brand text-white px-10 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                        EXPLORER CREATIVES
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* REVIEWS */}
              {activeTab === 'reviews' && (
                <div className="space-y-12">
                   <div className="flex items-end justify-between border-b border-border pb-6">
                    <div className="space-y-2">
                        <h2 className="font-heading font-bold text-4xl text-text-primary tracking-tighter uppercase italic">Critic Log</h2>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">AUTHENTICATED SELECTION REVIEWS</p>
                    </div>
                  </div>

                  {reviews.length > 0 ? (
                    <div className="space-y-8">
                      {reviews.map(review => (
                        <div key={review.id} className="bg-surface p-8 rounded-xl border border-border space-y-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-5">
                             <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          </div>
                          
                          <div className="flex gap-8 relative z-10">
                            <Link to={`/films/${review.film.id}`} className="shrink-0 w-24 aspect-[2/3] rounded-lg overflow-hidden border border-border shadow-md">
                              <img src={review.film.poster_url || review.film.poster} alt={review.film.title} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                            </Link>
                            <div className="flex-1 space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <Link to={`/films/${review.film.id}`} className="font-bold text-text-primary hover:text-brand transition-colors text-lg uppercase tracking-tight">
                                    {review.film.title}
                                  </Link>
                                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1 opacity-60">{review.film.year} ARCHIVE ENTRY</p>
                                </div>
                                <div className="text-[9px] font-black text-text-muted uppercase tracking-widest bg-surface-2/50 px-2 py-1 rounded border border-border">
                                    {new Date(review.created_at).toLocaleDateString()}
                                </div>
                              </div>
                              
                              <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-3 py-1 rounded-md text-sm font-black border border-brand/20">
                                {review.rating} <span className="opacity-40 text-xs">/ 10</span>
                              </div>
                              
                              {editingReviewId === review.id ? (
                                <div className="space-y-4 pt-4 border-t border-border/50">
                                  <textarea 
                                    className="w-full bg-bg border border-border rounded-xl p-6 text-text-primary focus:border-brand focus:outline-none transition-all text-sm italic"
                                    rows="4"
                                    defaultValue={review.body}
                                  ></textarea>
                                  <div className="flex gap-4">
                                    <button onClick={() => setEditingReviewId(null)} className="bg-brand text-white px-8 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest">SAVE LOG</button>
                                    <button onClick={() => setEditingReviewId(null)} className="bg-surface-2 text-text-muted px-8 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest border border-border">CANCEL</button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-text-muted text-sm leading-relaxed italic opacity-80 border-l-2 border-brand/30 pl-6 line-clamp-3">
                                  "{review.body}"
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {!editingReviewId && (
                            <div className="flex justify-end gap-6 pt-6 border-t border-border/50 relative z-10">
                              <button 
                                onClick={() => setEditingReviewId(review.id)}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand transition-all"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                                EDIT LOG
                              </button>
                              <button 
                                onClick={() => handleDeleteReview(review.id)}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-red-500 transition-all"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                DELETE
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-32 bg-surface-2/5 border-2 border-dashed border-border rounded-xl">
                      <h3 className="font-heading font-bold text-2xl text-text-primary mb-4 tracking-tighter uppercase italic">No Logs Found</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-8 opacity-60">START CRITIQUING ARCHIVE SELECTIONS</p>
                      <Link to="/browse" className="bg-brand text-white px-10 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                        FIND FILMS
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-12 max-w-3xl">
                   <div className="border-b border-border pb-6">
                        <h2 className="font-heading font-bold text-4xl text-text-primary tracking-tighter uppercase italic">Terminal Config</h2>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">USER PARAMETERS & SECURITY PROTOCOLS</p>
                   </div>

                   <div className="space-y-12">
                      <section className="bg-surface p-10 rounded-xl border border-border space-y-10">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand">Identity Profile</h3>
                        
                        <div className="flex items-center gap-8">
                          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-brand/30 flex flex-col items-center justify-center bg-surface-2 text-text-muted cursor-pointer hover:border-brand hover:bg-brand/5 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            <span className="text-[8px] uppercase font-black tracking-widest">UPLOAD</span>
                          </div>
                          <div className="text-[10px] text-text-muted font-black uppercase tracking-widest opacity-60">
                            REQUIRED: HIGH-RESOLUTION AVATAR PROTOCOL.<br/>FORMAT: JPG/PNG/WEBP.
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">DISPLAY NAME</label>
                            <input type="text" defaultValue={user.name} className="w-full bg-bg border border-border text-text-primary rounded-lg px-6 py-4 text-[11px] font-bold uppercase tracking-widest focus:border-brand focus:outline-none transition-all" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">EMAIL ADDRESS</label>
                            <input type="email" defaultValue={user.email} disabled className="w-full bg-surface-2 border border-border text-text-muted rounded-lg px-6 py-4 text-[11px] font-bold uppercase tracking-widest opacity-40 cursor-not-allowed" />
                          </div>
                        </div>
                        <button className="bg-brand text-white px-10 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-brand/20">
                          COMMIT CHANGES
                        </button>
                      </section>

                      <section className="bg-surface p-10 rounded-xl border border-border space-y-10">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand">Access Security</h3>
                        <div className="space-y-8">
                           <div className="space-y-2">
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">CURRENT PASSKEY</label>
                            <input type="password" placeholder="••••••••" className="w-full bg-bg border border-border text-text-primary rounded-lg px-6 py-4 text-[11px] font-bold tracking-widest focus:border-brand focus:outline-none transition-all" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">NEW PASSKEY</label>
                            <input type="password" placeholder="••••••••" className="w-full bg-bg border border-border text-text-primary rounded-lg px-6 py-4 text-[11px] font-bold tracking-widest focus:border-brand focus:outline-none transition-all" />
                          </div>
                        </div>
                        <button className="bg-surface-2 text-text-primary border border-border px-10 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest hover:border-brand hover:text-brand transition-all">
                          UPDATE SECURITY
                        </button>
                      </section>

                      <section className="bg-red-500/5 border border-red-500/20 p-10 rounded-xl space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-red-500">Hazard Protocol</h3>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60 leading-relaxed">THIS ACTION WILL PERMANENTLY WIPE ALL ARCHIVE RECORDS, REVIEWS, AND PROFILE IDENTITY FROM THE SERVER. THIS CANNOT BE REVERSED.</p>
                        </div>
                        <button className="bg-red-500 text-white px-10 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all">
                          WIPE IDENTITY
                        </button>
                      </section>
                   </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
