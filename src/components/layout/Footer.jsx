import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-bg border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-x border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-brand text-white flex items-center justify-center rounded-lg shadow-lg shadow-brand/20 group-hover:scale-110 transition-transform">
                <span className="text-xl">L</span>
              </div>
              <span className="font-heading font-bold text-white text-3xl tracking-tighter uppercase italic">Lumi</span>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed max-w-xs">
              The premier digital archive for Nollywood. Preserving the legacy, celebrating the future.
            </p>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] mb-6">Discover</h3>
            <ul className="space-y-4">
              <li><Link to="/" className="text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-brand transition-colors">Home</Link></li>
              <li><Link to="/browse" className="text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-brand transition-colors">Browse Films</Link></li>
              <li><Link to="/browse?sort=rating" className="text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-brand transition-colors">Top Rated</Link></li>
              <li><Link to="/browse?sort=new" className="text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-brand transition-colors">New Releases</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] mb-6">People</h3>
            <ul className="space-y-4">
              <li><Link to="/browse?type=actors" className="text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-brand transition-colors">Actors</Link></li>
              <li><Link to="/browse?type=directors" className="text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-brand transition-colors">Directors</Link></li>
              <li><Link to="/browse?type=producers" className="text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-brand transition-colors">Producers</Link></li>
              <li><Link to="/browse?type=writers" className="text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-brand transition-colors">Writers</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] mb-6">Archive</h3>
            <ul className="space-y-4">
              <li><Link to="/login" className="text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-brand transition-colors">Sign In</Link></li>
              <li><Link to="/signup" className="text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-brand transition-colors">Join Lumi</Link></li>
              <li><Link to="/dashboard" className="text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-brand transition-colors">Dashboard</Link></li>
              <li><Link to="/pro/claim" className="text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-brand transition-colors">Claim Profile</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] opacity-40">
            © 2025 LUMI ARCHIVE. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-8">
            <Link to="#" className="text-[9px] font-black text-text-muted uppercase tracking-widest hover:text-brand transition-colors">Terms</Link>
            <Link to="#" className="text-[9px] font-black text-text-muted uppercase tracking-widest hover:text-brand transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
