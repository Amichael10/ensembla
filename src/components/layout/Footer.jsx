import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-bg border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Row 1: Logo & Socials */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <Link to="/" className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
              <rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18"/>
              <line x1="7" x2="7" y1="2" y2="22"/>
              <line x1="17" x2="17" y1="2" y2="22"/>
              <line x1="2" x2="7" y1="12" y2="12"/>
              <line x1="2" x2="7" y1="7" y2="7"/>
              <line x1="2" x2="7" y1="17" y2="17"/>
              <line x1="17" x2="22" y1="12" y2="12"/>
              <line x1="17" x2="22" y1="7" y2="7"/>
              <line x1="17" x2="22" y1="17" y2="17"/>
            </svg>
            <span className="font-heading font-bold text-gold text-2xl tracking-wide">FilmDba</span>
          </Link>
          
          <div className="flex items-center gap-5">
            <a href="#" className="text-text-muted hover:text-gold transition-colors" aria-label="Twitter">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
              </svg>
            </a>
            <a href="#" className="text-text-muted hover:text-gold transition-colors" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="#" className="text-text-muted hover:text-gold transition-colors" aria-label="YouTube">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"/>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Row 2: Link Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="font-heading font-semibold text-text-primary mb-4">Discover</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-text-muted hover:text-gold transition-colors text-sm">Home</Link></li>
              <li><Link to="/browse" className="text-text-muted hover:text-gold transition-colors text-sm">Browse Films</Link></li>
              <li><Link to="/browse?sort=rating" className="text-text-muted hover:text-gold transition-colors text-sm">Top Rated</Link></li>
              <li><Link to="/browse?sort=new" className="text-text-muted hover:text-gold transition-colors text-sm">New Releases</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-text-primary mb-4">People</h3>
            <ul className="space-y-3">
              <li><Link to="/browse?type=actors" className="text-text-muted hover:text-gold transition-colors text-sm">Actors</Link></li>
              <li><Link to="/browse?type=directors" className="text-text-muted hover:text-gold transition-colors text-sm">Directors</Link></li>
              <li><Link to="/browse?type=producers" className="text-text-muted hover:text-gold transition-colors text-sm">Producers</Link></li>
              <li><Link to="/browse?type=writers" className="text-text-muted hover:text-gold transition-colors text-sm">Writers</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-text-primary mb-4">Industry</h3>
            <ul className="space-y-3">
              <li><Link to="#" className="text-text-muted hover:text-gold transition-colors text-sm">Notice Board</Link></li>
              <li><Link to="#" className="text-text-muted hover:text-gold transition-colors text-sm">Companies</Link></li>
              <li><Link to="#" className="text-text-muted hover:text-gold transition-colors text-sm">Awards</Link></li>
              <li><Link to="#" className="text-text-muted hover:text-gold transition-colors text-sm">NFVCB</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-text-primary mb-4">Account</h3>
            <ul className="space-y-3">
              <li><Link to="#" className="text-text-muted hover:text-gold transition-colors text-sm">Sign In</Link></li>
              <li><Link to="#" className="text-text-muted hover:text-gold transition-colors text-sm">Create Account</Link></li>
              <li><Link to="#" className="text-text-muted hover:text-gold transition-colors text-sm">Dashboard</Link></li>
              <li><Link to="#" className="text-text-muted hover:text-gold transition-colors text-sm">Settings</Link></li>
            </ul>
          </div>
        </div>

        {/* Row 3: Copyright */}
        <div className="border-t border-border pt-8 text-center">
          <p className="text-text-muted text-sm">© 2025 FilmDba. Built for Nollywood.</p>
        </div>
      </div>
    </footer>
  );
}
