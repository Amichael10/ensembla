import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Drawer from '../../components/admin/Drawer';
import ConfirmModal from '../../components/admin/ConfirmModal';
import SkeletonRow from '../../components/admin/SkeletonRow';
import { extractChannelIdentifier, fetchChannelData, getPersonYoutubeChannelUrl } from '../../lib/youtube';

export default function AdminPeople() {
  const [people, setPeople] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('All'); // All, Verified, Unverified
  const [sortBy, setSortBy] = useState('Most Popular'); // Most Popular, Most Credits, A-Z, Newest

  // Modals/Drawers state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [deletingPerson, setDeletingPerson] = useState(null);
  const [selectedPersonIds, setSelectedPersonIds] = useState([]);
  const [personBatchDeleteIds, setPersonBatchDeleteIds] = useState(null);
  const [isBatchDeletingPeople, setIsBatchDeletingPeople] = useState(false);
  const [personCredits, setPersonCredits] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    photo_url: '',
    date_of_birth: '',
    gender: 'Prefer not to say',
    nationality: 'Nigerian',
    is_verified: false,
    is_spotlight: false,
    popularity_score: 0,
    youtube_channel_id: '',
    youtube_handle: '',
    youtube_stats: { subscribers: '0', videos: '0', thumbnail: null, banner: null }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  /** Single field: paste channel URL, @handle, or UC… id (parsed on save / fetch) */
  const [youtubeChannelInput, setYoutubeChannelInput] = useState('');

  const fetchPeople = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('people')
        .select(`*, credits(count)`)
        .order('popularity_score', { ascending: false });

      if (error) throw error;
      setPeople(data || []);
    } catch (error) {
      console.error('Error fetching people:', error);
      toast.error('Failed to load people');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  useEffect(() => {
    setSelectedPersonIds([]);
  }, [search, verifiedFilter, sortBy]);

  // Filtering and Sorting
  let filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (verifiedFilter === 'Verified') {
    filteredPeople = filteredPeople.filter(p => p.is_verified);
  } else if (verifiedFilter === 'Unverified') {
    filteredPeople = filteredPeople.filter(p => !p.is_verified);
  }

  filteredPeople.sort((a, b) => {
    if (sortBy === 'Most Popular') {
      return (b.popularity_score || 0) - (a.popularity_score || 0);
    } else if (sortBy === 'Most Credits') {
      return (b.credits?.[0]?.count || 0) - (a.credits?.[0]?.count || 0);
    } else if (sortBy === 'A-Z') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'Newest') {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    return 0;
  });

  const handleToggleVerify = async (person) => {
    try {
      const newStatus = !person.is_verified;
      const { error } = await supabase
        .from('people')
        .update({ is_verified: newStatus })
        .eq('id', person.id);

      if (error) throw error;
      
      setPeople(people.map(p => p.id === person.id ? { ...p, is_verified: newStatus } : p));
      toast.success(newStatus ? 'Profile verified ✓' : 'Verification removed');
    } catch (error) {
      console.error('Error toggling verification:', error);
      toast.error('Failed to update verification status');
    }
  };

  const handleDelete = async () => {
    if (!deletingPerson) return;
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', deletingPerson.id);

      if (error) throw error;

      setPeople(people.filter(p => p.id !== deletingPerson.id));
      setSelectedPersonIds((prev) => prev.filter((id) => id !== deletingPerson.id));
      toast.success('Person deleted');
      setDeletingPerson(null);
    } catch (error) {
      console.error('Error deleting person:', error);
      toast.error('Failed to delete person');
    }
  };

  const openAddDrawer = () => {
    setEditingPerson(null);
    setYoutubeChannelInput('');
    setFormData({
      name: '',
      bio: '',
      photo_url: '',
      date_of_birth: '',
      gender: 'Prefer not to say',
      nationality: 'Nigerian',
      is_verified: false,
      is_spotlight: false,
      popularity_score: 0,
      tmdb_id: '',
      youtube_channel_id: '',
      youtube_handle: '',
      youtube_stats: { subscribers: '0', videos: '0', thumbnail: null, banner: null }
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = async (person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name || '',
      bio: person.bio || '',
      photo_url: person.photo_url || '',
      date_of_birth: person.date_of_birth || '',
      gender: person.gender || 'Prefer not to say',
      nationality: person.nationality || 'Nigerian',
      is_verified: person.is_verified || false,
      is_spotlight: person.is_spotlight || false,
      popularity_score: person.popularity_score || 0,
      tmdb_id: person.tmdb_id || '',
      youtube_channel_id: person.youtube_channel_id || '',
      youtube_handle: person.youtube_handle || '',
      youtube_stats: person.youtube_stats || { subscribers: '0', videos: '0', thumbnail: null, banner: null }
    });
    setYoutubeChannelInput(getPersonYoutubeChannelUrl(person) || '');
    
    // Fetch credits for this person
    const { data: credits } = await supabase
      .from('credits')
      .select(`
        id, role, character_name, billing_order,
        films(id, title, year, poster_url)
      `)
      .eq('person_id', person.id)
      .order('billing_order');
      
    setPersonCredits(credits || []);
    setIsDrawerOpen(true);
  };

  const refreshFromTmdb = async () => {
    if (!formData.tmdb_id) {
      toast.error('No TMDB ID linked to this profile');
      return;
    }

    const tmdbId = formData.tmdb_id;
    setIsRefreshing(true);
    toast.loading('Refreshing profile data...', { id: 'refresh-profile' });

    try {
      // 1. Refresh TMDB Metadata
      const res = await fetch(`/api/tmdb?endpoint=/person/${tmdbId}&language=en-US`);
      if (!res.ok) throw new Error('TMDB fetch failed');
      const data = await res.json();

      setFormData(prev => ({
        ...prev,
        bio: data.biography || prev.bio,
        photo_url: data.profile_path ? `https://image.tmdb.org/t/p/w520${data.profile_path}` : prev.photo_url,
      }));

      // 2. Try to refresh YouTube stats if they have a channel linked
      if (formData.youtube_channel_id || formData.youtube_handle) {
        try {
          const ident = { 
            type: formData.youtube_channel_id ? 'id' : 'handle', 
            value: formData.youtube_channel_id || formData.youtube_handle 
          };
          const ytData = await fetchChannelData(ident);
          setFormData(prev => ({
            ...prev,
            youtube_stats: {
              subscribers: ytData.subscribers,
              videos: ytData.videos,
              thumbnail: ytData.thumbnail,
              banner: ytData.banner,
              last_updated: ytData.lastUpdated
            }
          }));
        } catch (ytErr) {
          console.warn('YouTube refresh failed during TMDB sync:', ytErr);
        }
      }

      toast.success('Profile Refreshed Successfully', { id: 'refresh-profile' });
    } catch (error) {
      console.error('Refresh Error:', error);
      toast.error('Failed to refresh from TMDB', { id: 'refresh-profile' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFetchYoutube = async () => {
    const identifierRaw =
      youtubeChannelInput.trim() || formData.youtube_channel_id || formData.youtube_handle;
    if (!identifierRaw) {
      toast.error('Enter a channel URL, @handle, or channel ID first');
      return;
    }

    const t = toast.loading('Connecting to YouTube API...');
    try {
      const ident = extractChannelIdentifier(identifierRaw.trim());
      const ytData = await fetchChannelData(ident);

      setFormData(prev => ({
        ...prev,
        youtube_channel_id: ytData.channelId,
        youtube_handle: ytData.handle || prev.youtube_handle,
        youtube_stats: {
          subscribers: ytData.subscribers,
          videos: ytData.videos,
          thumbnail: ytData.thumbnail,
          banner: ytData.banner,
          last_updated: ytData.lastUpdated
        }
      }));
      setYoutubeChannelInput(`https://www.youtube.com/channel/${ytData.channelId}`);
      toast.success(`Fetched: ${ytData.title}`, { id: t });
    } catch (err) {
      toast.error(err.message || 'YouTube Fetch Failed', { id: t });
    }
  };

  const handleRemoveCredit = async (creditId) => {
    try {
      const { error } = await supabase
        .from('credits')
        .delete()
        .eq('id', creditId);
        
      if (error) throw error;
      
      setPersonCredits(personCredits.filter(c => c.id !== creditId));
      toast.success('Credit removed');
    } catch (error) {
      console.error('Error removing credit:', error);
      toast.error('Failed to remove credit');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let youtube_channel_id = null;
      let youtube_handle = null;
      let youtube_stats = formData.youtube_stats;

      if (youtubeChannelInput.trim()) {
        const ident = extractChannelIdentifier(youtubeChannelInput.trim());
        if (ident?.type === 'id') {
          youtube_channel_id = ident.value;
          youtube_handle = null;
        } else if (ident?.type === 'handle') {
          youtube_handle = String(ident.value).replace(/^@/, '');
          youtube_channel_id = null;
        }
      } else {
        youtube_stats = null;
      }

      // Clean empty strings to null where appropriate
      const dataToSave = {
        ...formData,
        date_of_birth: formData.date_of_birth || null,
        photo_url: formData.photo_url || null,
        popularity_score: parseInt(formData.popularity_score) || 0,
        tmdb_id: formData.tmdb_id || null,
        youtube_channel_id,
        youtube_handle,
        youtube_stats
      };

      if (editingPerson) {
        const { error } = await supabase
          .from('people')
          .update(dataToSave)
          .eq('id', editingPerson.id);
        if (error) throw error;
        toast.success('Profile updated');
      } else {
        const { error } = await supabase
          .from('people')
          .insert([dataToSave]);
        if (error) throw error;
        toast.success('Person added');
      }
      setIsDrawerOpen(false);
      fetchPeople();
    } catch (error) {
      console.error('Error saving person:', error);
      toast.error('Failed to save person');
    } finally {
      setIsSaving(false);
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleRecalculateScores = async () => {
    setIsRecalculating(true);
    try {
      const { error } = await supabase.rpc('refresh_all_popularity_scores');
      if (error) throw error;
      toast.success('Popularity scores updated');
      await fetchPeople();
    } catch (error) {
      console.error('Error recalculating scores:', error);
      toast.error('Failed to update scores');
    } finally {
      setIsRecalculating(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const togglePersonSelect = (id) => {
    setSelectedPersonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allFilteredPeopleSelected =
    filteredPeople.length > 0 && filteredPeople.every((p) => selectedPersonIds.includes(p.id));

  const toggleSelectAllFilteredPeople = () => {
    if (allFilteredPeopleSelected) {
      const filteredIds = new Set(filteredPeople.map((p) => p.id));
      setSelectedPersonIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      setSelectedPersonIds((prev) => {
        const next = new Set([...prev, ...filteredPeople.map((p) => p.id)]);
        return [...next];
      });
    }
  };

  const handleConfirmBatchDeletePeople = async () => {
    if (!personBatchDeleteIds?.length) return;
    setIsBatchDeletingPeople(true);
    try {
      const { error } = await supabase.from('people').delete().in('id', personBatchDeleteIds);
      if (error) throw error;
      setPeople((prev) => prev.filter((p) => !personBatchDeleteIds.includes(p.id)));
      setSelectedPersonIds((prev) => prev.filter((id) => !personBatchDeleteIds.includes(id)));
      toast.success(`Deleted ${personBatchDeleteIds.length} people`);
      setPersonBatchDeleteIds(null);
    } catch (error) {
      console.error('Error batch deleting people:', error);
      toast.error('Batch delete failed');
    } finally {
      setIsBatchDeletingPeople(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-brand text-[10px] font-bold uppercase tracking-[0.3em] mb-1 italic">Talent Registry</p>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">People Directory</h1>
          <p className="text-text-muted text-sm mt-1 font-medium leading-relaxed opacity-80">
            Secure ledger of all cast and crew associated with Nollywood projects.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRecalculateScores}
            disabled={isRecalculating}
            className="flex items-center gap-2.5 bg-surface-2 border border-border px-5 py-2.5 rounded-lg text-[11px] font-bold text-text-primary hover:border-brand/40 transition-all disabled:opacity-50"
          >
            {isRecalculating ? (
              <>
                <svg className="animate-spin h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Syncing Indices...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Regenerate Popularity
              </>
            )}
          </button>
          <button
            onClick={openAddDrawer}
            className="bg-brand text-white font-bold px-6 py-2.5 rounded-lg text-[13px] hover:scale-105 active:scale-[0.98] transition-all shadow-lg shadow-brand/20 flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span>
            Add Profile
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card-cal p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="md:col-span-2 relative group flex flex-col">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 px-1">Global Directory Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, role, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-md px-4 py-2.5 pl-10 text-sm text-text-primary focus:border-brand focus:ring-4 focus:ring-brand/5 outline-none transition-all"
              />
              <svg className="absolute left-3.5 top-3 w-4 h-4 text-text-muted group-focus-within:text-brand transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 px-1">Verification</label>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-md px-4 py-2.5 text-sm text-text-primary focus:border-brand outline-none appearance-none cursor-pointer"
            >
              <option value="All">All Identities</option>
              <option value="Verified">Verified Only</option>
              <option value="Unverified">Unverified Only</option>
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 px-1">Sort Indices</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-md px-4 py-2.5 text-sm text-text-primary focus:border-brand outline-none appearance-none cursor-pointer"
            >
              <option value="Most Popular">By Popularity</option>
              <option value="Most Credits">By Credit Count</option>
              <option value="A-Z">Alphabetical (A-Z)</option>
              <option value="Newest">Recently Registered</option>
            </select>
          </div>
        </div>
      </div>

      {selectedPersonIds.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-lg animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 rounded-full bg-red-500" />
            <span className="text-sm font-bold text-text-primary">
              {selectedPersonIds.length} profiles targets for batch action
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPersonBatchDeleteIds([...selectedPersonIds])}
            className="px-5 py-2 bg-red-500 text-white text-xs font-bold rounded-md hover:bg-red-600 transition-all shadow-md active:scale-95"
          >
            Purge Selected
          </button>
        </div>
      )}

      {/* Modern Data Management Table */}
      <div className="card-cal p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] bg-surface-2/30">
                <th className="pl-8 pr-4 py-5 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={allFilteredPeopleSelected}
                    onChange={toggleSelectAllFilteredPeople}
                    disabled={isLoading || filteredPeople.length === 0}
                    className="w-4 h-4 rounded border-border bg-surface text-brand focus:ring-brand/30 transition-all cursor-pointer"
                  />
                </th>
                <th className="px-6 py-5">Intel Profile</th>
                <th className="px-6 py-5">Origin</th>
                <th className="px-6 py-5">Influence metrics</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => <SkeletonRow key={i} columns={6} />)
              ) : filteredPeople.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-text-muted italic font-medium">
                    No results found in the intelligence branch.
                  </td>
                </tr>
              ) : (
                filteredPeople.map((person) => (
                  <tr key={person.id} className="group hover:bg-surface-2/40 transition-all duration-200">
                    <td className="pl-8 pr-4 py-5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedPersonIds.includes(person.id)}
                        onChange={() => togglePersonSelect(person.id)}
                        className="w-4 h-4 rounded border-border bg-surface text-brand focus:ring-brand/30 transition-all cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {person.photo_url ? (
                            <img src={person.photo_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-border shadow-sm group-hover:border-brand/40 transition-colors" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text-muted font-black text-xs uppercase tracking-tighter">
                              {getInitials(person.name)}
                            </div>
                          )}
                          {person.is_verified && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand text-white rounded-full border-2 border-background-primary flex items-center justify-center shadow-[0_2px_8px_rgba(255,92,0,0.3)]">
                              <span className="text-[10px] leading-none font-black italic">✓</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link 
                            to={`/people/${person.id}`} 
                            className="font-black text-text-primary text-[15px] hover:text-brand transition-colors duration-200 block truncate tracking-tight"
                          >
                            {person.name}
                          </Link>
                          <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-0.5 opacity-60">
                            ID: {person.id.substring(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-text-muted bg-surface-2 px-2.5 py-1 rounded-lg border border-border/50 uppercase tracking-wider">
                        {person.nationality || 'Agnostic'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-8">
                        <div>
                          <p className="text-text-primary font-black text-sm tabular-nums tracking-tighter">{person.credits?.[0]?.count || 0}</p>
                          <p className="text-[9px] text-text-muted font-bold uppercase tracking-[0.1em] opacity-60">Credits</p>
                        </div>
                        <div>
                          <p className="text-text-primary font-black text-sm tabular-nums tracking-tighter">{formatNumber(person.popularity_score)}</p>
                          <p className="text-[9px] text-text-muted font-bold uppercase tracking-[0.1em] opacity-60">Influence</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => handleToggleVerify(person)}
                        className={`inline-flex items-center px-3.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all border ${
                          person.is_verified 
                            ? 'bg-brand/5 text-brand border-brand/20 hover:bg-brand hover:text-white' 
                            : 'bg-surface-2 text-text-muted border-border hover:border-brand/40'
                        }`}
                      >
                        {person.is_verified ? 'Verified ✓' : 'Unverified'}
                      </button>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <button
                          onClick={() => openEditDrawer(person)}
                          className="p-2.5 bg-surface-2 text-text-primary rounded-md hover:bg-brand hover:text-white transition-all border border-border shadow-sm active:scale-95"
                          title="Modify Record"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button
                          onClick={() => setDeletingPerson(person)}
                          className="p-2.5 bg-surface-2 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-all border border-border shadow-sm active:scale-95"
                          title="Purge Record"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingPerson ? "Edit Person" : "Add Person"}
      >
        <form onSubmit={handleSave} className="flex flex-col h-full bg-surface overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar pb-32">
            {/* Form Header */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black bg-brand/10 text-brand px-2 py-0.5 rounded uppercase tracking-[0.2em] italic">
                  Profile
                </span>
                {editingPerson && formData.tmdb_id && (
                  <button
                    type="button"
                    onClick={() => refreshFromTmdb(formData.tmdb_id)}
                    disabled={isRefreshing}
                    className="text-[10px] font-black text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                  >
                    {isRefreshing ? (
                      <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : '✨ Sync TMDB'}
                  </button>
                )}
              </div>
              <h2 className="text-2xl font-black text-text-primary tracking-tight">
                {editingPerson ? 'Modify Intelligence' : 'Add Person'}
              </h2>
              <p className="text-text-muted text-sm font-medium opacity-70 leading-relaxed">
                {editingPerson 
                  ? `Updating record for ${formData.name}. Ensure all telemetry matches official sources.` 
                  : 'Add a new person to the directory.'}
              </p>
            </div>

            {/* Photo Preview & Core Info */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative group mx-auto md:mx-0">
                {formData.photo_url ? (
                  <img src={formData.photo_url} alt="" className="w-32 h-32 rounded-md object-cover border-4 border-background-secondary shadow-2xl group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-32 h-32 rounded-md bg-surface-2 border-2 border-dashed border-border flex flex-col items-center justify-center text-text-muted gap-2">
                    <span className="text-3xl">👤</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">No Visual</span>
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-brand text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-4 border-background-primary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
              </div>

              <div className="flex-1 w-full space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1 italic">Full Identity Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-surface-2 border border-border rounded-lg px-5 py-4 text-base font-black text-text-primary focus:border-brand focus:ring-4 focus:ring-brand/5 outline-none transition-all placeholder:font-medium"
                    placeholder="Enter full legal name..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1 italic">Origin / Nationality</label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      className="w-full bg-surface-2 border border-border rounded-md px-4 py-3 text-sm font-bold text-text-primary focus:border-brand outline-none transition-all"
                      placeholder="e.g. Nigerian"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1 italic">Identifier (TMDB ID)</label>
                    <input
                      type="text"
                      value={formData.tmdb_id || ''}
                      onChange={(e) => setFormData({ ...formData, tmdb_id: e.target.value })}
                      className="w-full bg-surface-2 border border-border rounded-md px-4 py-3 text-sm font-mono text-text-primary focus:border-brand outline-none transition-all"
                      placeholder="Optional ID"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Intel URL */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Visual Reference</h3>
              </div>
              <input
                type="url"
                value={formData.photo_url}
                onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                className="w-full bg-surface-2 border border-border rounded-md px-4 py-3 text-sm font-medium text-text-primary focus:border-brand outline-none transition-all"
                placeholder="https://image.tmdb.org/t/p/original/..."
              />
            </section>

            {/* Bio Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                  <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Asset Intelligence (Bio)</h3>
                </div>
                <span className={`text-[10px] font-black tabular-nums ${formData.bio.length > 500 ? 'text-red-500' : 'text-text-muted'}`}>
                  {formData.bio.length} / 500
                </span>
              </div>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                maxLength={500}
                rows={5}
                className="w-full bg-surface-2 border border-border rounded-lg px-5 py-4 text-sm font-medium text-text-primary focus:border-brand focus:ring-4 focus:ring-brand/5 outline-none transition-all resize-none leading-relaxed"
                placeholder="Detailed career overview and background..."
              />
            </section>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1 italic">Chronology (DOB)</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full bg-surface-2 border border-border rounded-md px-4 py-3 text-sm font-bold text-text-primary focus:border-brand outline-none transition-all cursor-pointer"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1 italic">Gender Identification</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-surface-2 border border-border rounded-md px-4 py-3 text-sm font-bold text-text-primary focus:border-brand outline-none transition-all cursor-pointer appearance-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Intelligence: YouTube */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Transmission Channel (YouTube)</h3>
              </div>
              <div className="p-6 bg-surface-2/50 border border-border rounded-md space-y-6">
                <div className="space-y-2">
                  <p className="text-[11px] text-text-muted leading-relaxed italic opacity-80">
                    Connect an official channel to track platform influence. Supports full URLs or handle IDs.
                  </p>
                  <div className="relative group">
                    <input
                      type="text"
                      value={youtubeChannelInput}
                      onChange={(e) => setYoutubeChannelInput(e.target.value)}
                      placeholder="https://www.youtube.com/@handle or UC..."
                      className="w-full bg-surface border border-border rounded-md px-4 py-3 text-sm font-mono text-text-primary focus:border-brand outline-none transition-all"
                    />
                    <svg className="absolute right-4 top-3 w-5 h-5 text-red-600 opacity-60" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleFetchYoutube}
                    className="text-[11px] font-black px-5 py-2.5 rounded-md bg-brand/5 text-brand border border-brand/20 hover:bg-brand hover:text-white transition-all uppercase tracking-widest"
                  >
                    Fetch Telemetry
                  </button>
                  {getPersonYoutubeChannelUrl({
                    youtube_channel_id: formData.youtube_channel_id,
                    youtube_handle: formData.youtube_handle
                  }) && (
                    <a
                      href={getPersonYoutubeChannelUrl({
                        youtube_channel_id: formData.youtube_channel_id,
                        youtube_handle: formData.youtube_handle
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-black px-5 py-2.5 rounded-md border border-border text-text-muted hover:border-brand/40 hover:text-brand transition-all uppercase tracking-widest inline-flex items-center gap-2"
                    >
                      Audit Channel ↗
                    </a>
                  )}
                </div>
                {(formData.youtube_stats?.subscribers || formData.youtube_stats?.videos) && (
                  <div className="flex gap-6 pt-2">
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-text-primary tabular-nums tracking-tighter">
                        {formData.youtube_stats?.subscribers ? Number(formData.youtube_stats.subscribers).toLocaleString() : '0'}
                      </span>
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-1">Subscribers</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-text-primary tabular-nums tracking-tighter">
                        {formData.youtube_stats?.videos ? Number(formData.youtube_stats.videos).toLocaleString() : '0'}
                      </span>
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-1">Transmissions</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Platform Status */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Platform Status</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-surface-2/40 border border-border rounded-md flex items-center justify-between group hover:border-brand/30 transition-colors">
                  <div>
                    <p className="text-xs font-black text-text-primary uppercase tracking-tight">Verified Intel</p>
                    <p className="text-[10px] text-text-muted font-bold italic opacity-70">Official platform verification</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.is_verified} onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })} className="sr-only peer" />
                    <div className="w-11 h-6 bg-surface border-2 border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-text-muted after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand peer-checked:after:bg-white peer-checked:after:border-brand"></div>
                  </label>
                </div>
                <div className="p-5 bg-surface-2/40 border border-border rounded-md flex items-center justify-between group hover:border-brand/30 transition-colors">
                  <div>
                    <p className="text-xs font-black text-text-primary uppercase tracking-tight">Frontline Feature</p>
                    <p className="text-[10px] text-text-muted font-bold italic opacity-70">Spotlight on primary feed</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.is_spotlight} onChange={(e) => setFormData({ ...formData, is_spotlight: e.target.checked })} className="sr-only peer" />
                    <div className="w-11 h-6 bg-surface border-2 border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-text-muted after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand peer-checked:after:bg-white peer-checked:after:border-brand"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Filmography: Intelligence Feed */}
            {editingPerson && (
              <section className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                  <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Operational History (Credits)</h3>
                </div>
                {personCredits.length === 0 ? (
                  <div className="p-8 text-center bg-surface-2/30 border border-dashed border-border rounded-md">
                    <p className="text-xs text-text-muted italic font-medium opacity-70">No recorded missions for this asset.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {personCredits.map((credit) => (
                      <div key={credit.id} className="flex items-center gap-4 bg-surface-2/40 p-3 rounded-lg border border-border group/credit hover:border-brand/30 transition-all">
                        <img 
                          src={credit.films?.poster_url || 'https://via.placeholder.com/40x60?text=No+Poster'} 
                          alt="" 
                          className="w-10 h-14 rounded-lg object-cover shadow-sm bg-surface" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-text-primary truncate tracking-tight">
                            {credit.films?.title} <span className="text-text-muted font-normal text-xs opacity-60">({credit.films?.year})</span>
                          </p>
                          <p className="text-[10px] text-brand font-black uppercase tracking-widest mt-0.5">
                            {credit.role} {credit.character_name && `• as ${credit.character_name}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCredit(credit.id)}
                          className="p-2.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all opacity-0 group-hover/credit:opacity-100"
                          title="Purge Link"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-brand/[0.03] border border-brand/10 p-3 rounded-md">
                  <p className="text-[9px] text-brand/80 text-center font-bold uppercase tracking-widest italic font-mono">
                    * To inject new credits, navigate to the Digital Command Center (Film Library).
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* Sticky Commander Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-8 pt-12 bg-gradient-to-t from-background-primary via-background-primary/95 to-transparent backdrop-blur-sm pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto max-w-full">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 bg-surface-2 text-text-muted font-bold py-4 rounded-lg hover:bg-surface-2/80 hover:text-text-primary transition-all text-[13px] border border-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || formData.bio.length > 500}
                className="flex-[2] bg-brand text-white font-black py-4 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all text-[13px] shadow-2xl shadow-brand/30 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Executing Auth...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    Finalize Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </Drawer>

      {/* Delete Confirmation Modal */}
      {deletingPerson && (
        <ConfirmModal
          title="Delete Person"
          message={`Are you sure you want to delete ${deletingPerson.name}? This will also remove all their credits.`}
          confirmLabel="Delete"
          confirmColor="bg-red-500 hover:bg-red-600"
          onConfirm={handleDelete}
          onCancel={() => setDeletingPerson(null)}
        />
      )}

      {personBatchDeleteIds && (
        <ConfirmModal
          title="Delete people"
          message={`Delete ${personBatchDeleteIds.length} ${personBatchDeleteIds.length === 1 ? 'person' : 'people'}? Their credits will be removed if your database allows it (e.g. cascade).`}
          confirmLabel="Delete selected"
          confirmColor="bg-red-500 hover:bg-red-600"
          onConfirm={handleConfirmBatchDeletePeople}
          onCancel={() => !isBatchDeletingPeople && setPersonBatchDeleteIds(null)}
          isProcessing={isBatchDeletingPeople}
        />
      )}
    </div>
  );
}
