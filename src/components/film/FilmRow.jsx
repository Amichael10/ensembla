import { Link } from 'react-router-dom';
import FilmCard from './FilmCard';
import SkeletonCard from '../ui/SkeletonCard';

export default function FilmRow({ title, subtitle, films, sortKey, isLoading = false, noHeader = false }) {
  // Sort films if sortKey is provided
  const sortedFilms = [...films].sort((a, b) => {
    if (sortKey === 'views') return (b.view_count || 0) - (a.view_count || 0);
    if (sortKey === 'year') return (b.year || 0) - (a.year || 0);
    if (sortKey === 'rating') return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  return (
    <section className={noHeader ? '' : 'py-8'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        {!noHeader && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="space-y-1">
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-text-primary tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-text-muted text-sm font-medium opacity-80">{subtitle}</p>
              )}
            </div>
            <Link 
              to={`/browse${sortKey ? `?sort=${sortKey}` : ''}`} 
              className="text-brand font-black text-[10px] uppercase tracking-widest px-5 py-2 border border-border rounded-full hover:border-brand hover:text-brand transition-all duration-300 active:scale-95 flex items-center gap-2 w-fit"
            >
              See All 
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        )}

        {/* Scrollable Row */}
        <div className="relative -mx-4 sm:mx-0">
          <div className="flex overflow-x-auto gap-4 md:gap-8 pb-10 pt-2 px-4 sm:px-0 snap-x snap-mandatory scrollbar-hide touch-pan-x">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="snap-start shrink-0">
                  <SkeletonCard size="md" />
                </div>
              ))
            ) : films.length === 0 ? (
              <div className="w-full py-12 text-center text-text-muted italic text-sm">
                No active productions matching this criteria.
              </div>
            ) : (
              sortedFilms.map((film) => (
                <div key={film.id} className="snap-start shrink-0 group">
                  <FilmCard film={film} size="md" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
