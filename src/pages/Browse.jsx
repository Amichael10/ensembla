import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import FilmCard from '../components/film/FilmCard';
import { Skeleton } from '../components/ui/Skeleton';

export default function Browse() {
  const [searchParams] = useSearchParams();
  const initialGenre = searchParams.get('genre') || '';
  const initialSort = searchParams.get('sort') || 'views';

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [films, setFilms] = useState([]);
  const [dbGenres, setDbGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters state
  const [selectedGenres, setSelectedGenres] = useState(initialGenre ? [initialGenre] : []);
  const [yearRange, setYearRange] = useState(2000);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [language, setLanguage] = useState('');
  const [sortBy, setSortBy] = useState(initialSort);

  useEffect(() => {
    document.title = "Lumi | Browse";
    fetchGenres();
  }, []);

  useEffect(() => {
    setError(null);
    fetchFilms();
  }, [selectedGenres, yearRange, selectedRatings, language, sortBy]);

  const fetchGenres = async () => {
    try {
      const { data, error } = await supabase
        .from('genres')
        .select('name')
        .order('name');
      if (error) throw error;
      setDbGenres((data || []).map(g => g.name));
    } catch (err) {
      console.error('Error fetching genres:', err);
    }
  };
  
  const fetchFilms = async () => {
    setLoading(true);
    try {
      let query = supabase.from('films').select(`
        id, title, poster_url, backdrop_url, year, language, 
        runtime_minutes, view_count, average_rating, nfvcb_rating,
        film_genres!left(genres(name))
      `);

      if (selectedGenres.length > 0) {
        query = supabase.from('films').select(`
          id, title, poster_url, backdrop_url, year, language, 
          runtime_minutes, view_count, average_rating, nfvcb_rating,
          film_genres!inner(genres!inner(name))
        `);
        query = query.in('film_genres.genres.name', selectedGenres);
      }

      if (yearRange > 1990) query = query.gte('year', yearRange);
      if (language) query = query.eq('language', language);
      if (selectedRatings.length > 0) query = query.in('nfvcb_rating', selectedRatings);

      const sortMap = {
        'views': { column: 'view_count', ascending: false },
        'rating': { column: 'average_rating', ascending: false },
        'newest': { column: 'year', ascending: false },
        'oldest': { column: 'year', ascending: true }
      };
      
      const config = sortMap[sortBy] || sortMap.views;
      query = query.order(config.column, { ascending: config.ascending });
      query = query.range(0, 49);

      const { data, error: dbError } = await query;
      
      if (dbError) throw dbError;

      const transformed = (data || []).map(f => ({
        ...f,
        genres: f.film_genres?.map(fg => fg.genres?.name).filter(Boolean) || []
      }));

      setFilms(transformed);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Could not connect to the movie database.');
    } finally {
      setLoading(false);
    }
  };

  const nfvcbRatings = ['PG', '12', '15', '18'];
  
  const toggleGenre = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const toggleRating = (rating) => {
    setSelectedRatings(prev => 
      prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]
    );
  };

  const clearAll = () => {
    setSelectedGenres([]);
    setYearRange(2000);
    setSelectedRatings([]);
    setLanguage('');
    setSortBy('views');
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header Section */}
      <div className="bg-surface-2/10 border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 py-16 pt-32 border-x border-border relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-heading font-bold text-text-primary tracking-tighter uppercase italic">
                The Archive
              </h1>
              <p className="text-text-muted text-sm max-w-xl italic border-l-2 border-brand pl-6">
                Explore the complete collection of Nollywood masterpieces, from digital premieres to theatrical blockbusters.
              </p>
            </div>
            <button 
              className="md:hidden flex items-center justify-center gap-2 bg-surface border border-border px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-primary"
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            >
              FILTERS
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-x border-border min-h-screen">
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Filters Sidebar */}
          <div className={`md:w-80 shrink-0 p-8 space-y-12 bg-surface-2/5 ${isMobileFiltersOpen ? 'block' : 'hidden md:block'}`}>
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-heading font-bold text-sm text-text-primary uppercase tracking-widest italic">Filters</h3>
              <button onClick={clearAll} className="text-[9px] font-black uppercase tracking-widest text-brand hover:underline">Clear Archive</button>
            </div>

            <div className="space-y-4">
              <h4 className="font-black text-text-muted text-[10px] uppercase tracking-widest">Sort Protocol</h4>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full bg-surface border border-border text-text-primary rounded-lg p-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-brand transition-all">
                <option value="views">MOST VIEWED</option>
                <option value="rating">TOP RATED</option>
                <option value="newest">NEWEST ARRIVALS</option>
                <option value="oldest">VINTAGE</option>
              </select>
            </div>

            <div className="space-y-6">
              <h4 className="font-black text-text-muted text-[10px] uppercase tracking-widest">Genres Sector</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-4 custom-scrollbar">
                {dbGenres.map(genre => (
                  <label key={genre} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleGenre(genre)}>
                    <div className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${selectedGenres.includes(genre) ? 'bg-brand border-brand shadow-[0_0_8px_var(--brand)]' : 'border-border bg-surface group-hover:border-brand/50'}`}>
                      {selectedGenres.includes(genre) && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${selectedGenres.includes(genre) ? 'text-brand' : 'text-text-primary group-hover:text-brand'}`}>{genre}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="font-black text-text-muted text-[10px] uppercase tracking-widest">Timeline</h4>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand">{yearRange}+</span>
              </div>
              <input type="range" min="1990" max="2025" value={yearRange} onChange={(e) => setYearRange(parseInt(e.target.value))} className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-brand" />
            </div>

            <div className="space-y-6">
              <h4 className="font-black text-text-muted text-[10px] uppercase tracking-widest">Classification</h4>
              <div className="flex flex-wrap gap-2">
                {nfvcbRatings.map(r => (
                  <button key={r} onClick={() => toggleRating(r)} className={`px-4 py-2 rounded text-[10px] font-black border transition-all ${selectedRatings.includes(r) ? 'bg-brand border-brand text-white shadow-lg shadow-brand/20' : 'border-border text-text-muted hover:border-brand/50 hover:text-text-primary'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Films Grid */}
          <div className="flex-1 p-8 md:p-12">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-surface rounded-xl overflow-hidden border border-border animate-pulse">
                     <Skeleton className="h-full w-full" />
                  </div>
                ))}
              </div>
            ) : films.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {films.map(film => <FilmCard key={film.id} film={film} />)}
              </div>
            ) : (
              <div className="bg-surface-2/10 border-2 border-dashed border-border rounded-xl p-32 text-center">
                <p className="text-text-muted text-xs font-black uppercase tracking-widest mb-6">No matching records found in the archive.</p>
                <button onClick={clearAll} className="bg-brand text-white text-[10px] font-black uppercase tracking-widest px-8 py-3 rounded-lg hover:shadow-brand/20 transition-all">RESET FILTERS</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
