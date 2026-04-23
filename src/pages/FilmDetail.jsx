import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../hooks/useWatchlist';
import ReviewSection from '../components/film/ReviewSection';
import PersonCard from '../components/person/PersonCard';
import FilmCard from '../components/film/FilmCard';
import { Skeleton } from '../components/ui/Skeleton';

const FilmDetailSkeleton = () => (
    <div className="w-full bg-bg min-h-screen">
        <div className="relative w-full h-[60vh] min-h-[500px] bg-surface-2/20 animate-pulse border-b border-border" />
        <div className="max-w-7xl mx-auto border-x border-border min-h-[600px]">
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-x divide-border">
                <div className="lg:col-span-2 p-8 md:p-12 space-y-8">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </div>
                <div className="lg:col-span-1 p-8 space-y-8">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        </div>
    </div>
)

export default function FilmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [film, setFilm] = useState(null);
  const [relatedFilms, setRelatedFilms] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    inWatchlist,
    loading: watchlistLoading,
    toggleWatchlist
  } = useWatchlist(id, user);

  const [cast, setCast] = useState([]);
  const [crew, setCrew] = useState([]);

  useEffect(() => {
    fetchFilm();
    fetchCredits();
  }, [id]);

  const fetchCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('credits')
        .select(`
          id, role, character_name, billing_order,
          people(id, name, photo_url, popularity_score)
        `)
        .eq('film_id', id)
        .order('billing_order', { ascending: true });

      if (error) throw error;
      
      const castMembers = data
        .filter(c => c.role.toLowerCase() === 'actor' || c.role.toLowerCase() === 'cast')
        .map(c => ({
          ...c.people,
          role: c.character_name || 'Cast'
        }));
        
      const crewMembers = data
        .filter(c => c.role.toLowerCase() !== 'actor' && c.role.toLowerCase() !== 'cast')
        .map(c => ({
          ...c.people,
          role: c.role
        }));

      setCast(castMembers);
      setCrew(crewMembers);
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const fetchFilm = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('films')
        .select(`
          *,
          film_companies(
            companies(id, name, logo_url)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setFilm(data);

      if (data) {
        document.title = `Lumi | ${data.title}`;
        const { data: related } = await supabase
          .from('films')
          .select('*')
          .neq('id', id)
          .limit(3);
        setRelatedFilms(related || []);
      }
    } catch (error) {
      console.error('Error fetching film:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchlist = async () => {
    if (!user) {
      navigate('/login', {
        state: { from: `/films/${id}`, message: 'Sign in to add films to your watchlist' }
      });
      return;
    }
    await toggleWatchlist();
  };

  const handleShare = async () => {
    const shareData = {
      title: film.title,
      text: `Check out ${film.title} on Lumi`,
      url: window.location.href
    };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard');
    }
  };

  if (loading) return <FilmDetailSkeleton />;

  if (!film) {
    return (
      <div className="w-full min-h-screen bg-bg flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 border-x border-border py-32 text-center w-full">
          <p className="text-4xl mb-4">🎬</p>
          <p className="text-text-primary font-heading font-bold text-xl uppercase tracking-tighter italic mb-8">Film not found</p>
          <button onClick={() => navigate('/browse')} className="bg-brand text-white font-black uppercase tracking-widest px-8 py-4 rounded-lg hover:shadow-brand/20 transition-all">
            ← BROWSE ARCHIVE
          </button>
        </div>
      </div>
    );
  }

  // Format views
  const formatViews = (views) => {
    if (!views) return '0';
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views;
  };

  return (
    <div className="w-full bg-bg min-h-screen pb-20">
      {/* 1. CINEMATIC HEADER */}
      <div className="relative w-full h-[60vh] min-h-[500px] border-b border-border overflow-hidden">
        <img
          src={film.backdrop_url || film.backdrop} 
          alt={`${film.title} Backdrop`} 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/90 via-bg/20 to-transparent w-full md:w-1/2"></div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg to-transparent"></div>

        <div className="absolute bottom-0 left-0 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-x border-white/5 flex flex-col md:flex-row items-end gap-8 pb-8">
            <div className="hidden md:block w-64 shrink-0 translate-y-16 z-10">
              <img
                src={film.poster_url || film.poster} 
                alt={`${film.title} Poster`} 
                className="w-full rounded-xl shadow-2xl border border-white/10 object-cover aspect-[2/3]"
              />
            </div>

            <div className="flex-1 z-10 w-full">
              <h1 className="font-heading font-bold text-4xl md:text-6xl text-text-primary mb-4 leading-tight tracking-tighter uppercase italic">
                {film.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs text-text-muted font-black uppercase tracking-widest mb-4">
                <span>{film.year}</span>
                <span className="w-1 h-1 rounded-full bg-border"></span>
                <span>{film.runtime_minutes || film.runtime} MIN</span>
                <span className="w-1 h-1 rounded-full bg-border"></span>
                <span>{film.language}</span>
                <span className="w-1 h-1 rounded-full bg-border"></span>
                <span className="bg-brand/10 text-brand px-2 py-0.5 rounded text-[10px] font-black border border-brand/20">
                  {film.nfvcb_rating}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {(film.genres || []).map(genre => (
                  <span key={genre} className="px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-surface-2/40 backdrop-blur-md text-text-primary rounded-lg border border-border">
                    {genre}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-end gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-brand text-4xl md:text-5xl font-bold font-heading leading-none tracking-tighter italic">{film.tmdb_rating || film.rating}</span>
                  <div className="flex flex-col justify-end pb-1">
                    <span className="text-text-muted text-[10px] font-black tracking-widest uppercase">/ 10 Rating</span>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg key={star} xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill={star <= Math.round((film.tmdb_rating || film.rating) / 2) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="text-brand">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-text-muted pb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#000" />
                  </svg>
                  <span className="text-[10px] font-black tracking-widest uppercase">{formatViews(film.view_count)} VIEWS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTENT SECTION */}
      <div className="max-w-7xl mx-auto border-x border-border min-h-[600px]">
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-x divide-border">

          {/* MAIN CONTENT (70%) */}
          <div className="lg:col-span-2">
            {/* Synopsis */}
            <section className="p-8 md:p-12 border-b border-border">
              <h2 className="font-heading font-bold text-2xl text-text-primary mb-6 tracking-tighter uppercase italic">Synopsis</h2>
              <p className="text-text-muted text-lg leading-relaxed italic opacity-80 border-l-2 border-brand pl-6">
                {film.synopsis}
              </p>
            </section>

            {/* Trailer */}
            <section id="trailer-section" className="p-8 md:p-12 border-b border-border bg-surface-2/10 relative overflow-hidden">
               <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none"></div>
              <h2 className="font-heading font-bold text-2xl text-text-primary mb-6 tracking-tighter uppercase italic relative z-10">Official Trailer</h2>
              <div className="relative z-10 aspect-video rounded-xl overflow-hidden border border-border bg-surface-2 shadow-sm">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${film.trailer_youtube_id || 'dQw4w9WgXcQ'}?autoplay=0&rel=0&modestbranding=1`}
                  title={`${film.title} Trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </section>

            {/* Cast */}
            {cast.length > 0 && (
              <section className="p-8 md:p-12 border-b border-border">
                <h2 className="font-heading font-bold text-2xl text-text-primary mb-6 tracking-tighter uppercase italic">Primary Cast</h2>
                <div className="flex overflow-x-auto gap-8 pb-4 scrollbar-hide">
                  {cast.map(person => (
                    <div key={person.id} className="shrink-0 w-32">
                      <PersonCard person={person} variant="compact" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Crew */}
            {crew.length > 0 && (
              <section className="p-8 md:p-12 border-b border-border">
                <h2 className="font-heading font-bold text-2xl text-text-primary mb-6 tracking-tighter uppercase italic">Key Crew</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 border border-border rounded-lg overflow-hidden">
                  {crew.map((member, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-surface p-4 border-r border-b border-border last:border-r-0 last:border-b-0">
                      <img src={member.photo_url || `https://placehold.co/150x150/1A1A1A/FF5C00?text=${member.name.split(' ').map(n => n[0]).join('')}`} alt={member.name} className="w-10 h-10 rounded-lg object-cover border border-border" />
                      <div>
                        <div className="font-bold text-text-primary text-xs line-clamp-1 uppercase tracking-tight">{member.name}</div>
                        <div className="text-text-muted text-[10px] uppercase font-black tracking-widest">{member.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="p-8 md:p-12">
              <ReviewSection
                filmId={film.id}
                currentUser={user}
              />
            </section>
          </div>

          {/* SIDEBAR (30%) */}
          <div className="space-y-0 divide-y divide-border h-full">
            <div className="p-8">
              {film.film_companies?.length > 0 ? (
                <div className="bg-surface rounded-xl p-6 border border-border flex items-center gap-4 group transition-all cursor-default">
                  <div className="w-12 h-12 bg-surface-2 rounded-lg overflow-hidden flex items-center justify-center text-brand font-bold text-xl shrink-0 border border-border/50">
                    {film.film_companies[0].companies?.logo_url ? (
                      <img src={film.film_companies[0].companies.logo_url} className="w-full h-full object-contain p-1" />
                    ) : (
                      film.film_companies[0].companies?.name?.charAt(0) || 'L'
                    )}
                  </div>
                  <div>
                    <div className="text-[9px] text-text-muted uppercase font-black tracking-[0.2em] mb-0.5">Production House</div>
                    <div className="font-bold text-text-primary text-sm line-clamp-1 uppercase tracking-tight">{film.film_companies[0].companies?.name}</div>
                  </div>
                </div>
              ) : (
                <div className="bg-surface rounded-xl p-6 border border-border flex items-center gap-4">
                  <div className="w-12 h-12 bg-surface-2 rounded-lg flex items-center justify-center text-brand font-bold text-xl shrink-0">
                    {film.director?.charAt(0) || 'L'}
                  </div>
                  <div>
                    <div className="text-[9px] text-text-muted uppercase font-black tracking-[0.2em] mb-0.5">Production Lead</div>
                    <div className="font-bold text-text-primary text-sm uppercase tracking-tight">{film.director || 'Lumi Productions'}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-surface-2/5">
              <h3 className="font-heading font-bold text-sm text-text-primary mb-6 uppercase tracking-widest italic">Metadata</h3>
              <div className="space-y-4 text-[11px] font-bold">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-text-muted uppercase tracking-widest">Status</span>
                  <span className="text-text-primary uppercase">{film.status}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-text-muted uppercase tracking-widest">Language</span>
                  <span className="text-text-primary uppercase">{film.language}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-text-muted uppercase tracking-widest">Runtime</span>
                  <span className="text-text-primary">{film.runtime_minutes || film.runtime} MIN</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted uppercase tracking-widest">NFVCB</span>
                  <span className="bg-surface-2 text-text-primary px-2 py-0.5 rounded text-[10px] border border-border font-black uppercase tracking-widest">
                    {film.nfvcb_rating}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-3">
              {film.release_type && film.release_type !== 'cinema' && film.youtube_watch_url ? (
                <a
                  href={film.youtube_watch_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all duration-300 active:scale-95 min-h-[44px] text-white hover:scale-[1.02] ${
                    film.release_type === 'youtube' ? 'bg-[#FF0000] hover:shadow-[0_0_15px_rgba(255,0,0,0.4)]' :
                    film.release_type === 'netflix' ? 'bg-[#E50914] hover:shadow-[0_0_15px_rgba(229,9,20,0.4)]' :
                    film.release_type === 'prime_video' ? 'bg-[#00A8E1] hover:shadow-[0_0_15px_rgba(0,168,225,0.4)]' :
                    film.release_type === 'showmax' ? 'bg-[#E10098] hover:shadow-[0_0_15px_rgba(225,0,152,0.4)]' :
                    'bg-brand text-white hover:shadow-[0_0_15px_rgba(255,92,0,0.4)]'
                  }`}
                >
                  Watch on {film.release_type.replace('_', ' ')}
                </a>
              ) : (
                <button
                  onClick={handleWatchlist}
                  disabled={watchlistLoading}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all duration-300 active:scale-95 min-h-[44px] disabled:opacity-50 ${inWatchlist
                    ? 'bg-surface-2 border border-brand text-brand'
                    : 'bg-brand text-white hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,92,0,0.4)]'
                    }`}
                >
                  {inWatchlist ? 'IN WATCHLIST' : 'ADD TO WATCHLIST'}
                </button>
              )}
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 border border-border text-text-primary hover:border-brand hover:text-brand px-6 py-4 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all duration-300 active:scale-95 min-h-[44px]"
              >
                SHARE ARCHIVE
              </button>
            </div>

            <div className="p-8">
              <h3 className="font-heading font-bold text-sm text-text-primary mb-6 uppercase tracking-widest italic">Related Media</h3>
              <div className="flex flex-col gap-0 border border-border rounded-lg overflow-hidden shadow-sm">
                {relatedFilms.map(relatedFilm => (
                  <Link
                    key={relatedFilm.id}
                    to={`/films/${relatedFilm.id}`}
                    className="flex gap-4 bg-surface hover:bg-surface-2 p-4 border-b border-border last:border-b-0 group transition-all"
                  >
                    <img
                      src={relatedFilm.poster_url || relatedFilm.poster} 
                      alt={relatedFilm.title}
                      className="w-12 h-16 object-cover rounded-md border border-border"
                    />
                    <div className="flex flex-col justify-center">
                      <h4 className="font-bold text-text-primary text-xs group-hover:text-brand transition-colors line-clamp-1 mb-1 tracking-tight uppercase">
                        {relatedFilm.title}
                      </h4>
                      <div className="text-[10px] font-black text-text-muted mb-2 uppercase tracking-widest">
                        {relatedFilm.year} • {relatedFilm.genres && relatedFilm.genres.length > 0 ? relatedFilm.genres[0] : 'Media'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}