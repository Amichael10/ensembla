import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsMobileMenuOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className={`fixed w-full top-0 z-50 transition-colors duration-300 ${isScrolled ? 'bg-surface' : 'bg-transparent backdrop-blur-md'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
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

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search films, people..." 
                className="w-full md:w-64 focus:w-full bg-surface-2 rounded-full py-2.5 pl-11 pr-4 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-gold transition-all duration-300"
              />
            </form>
          </div>

          {/* Right: Links & Auth */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/browse" className="text-text-primary hover:text-gold transition-colors duration-300 font-medium min-h-[44px] flex items-center">
              Browse
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link 
                  to={user.role === 'professional' ? '/dashboard/pro' : '/dashboard'} 
                  className="flex items-center gap-2 hover:text-gold transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-sm font-bold text-gold">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{user.name.split(' ')[0]}</span>
                </Link>
                <button 
                  onClick={logout}
                  className="text-text-muted hover:text-text-primary text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/login" className="border border-gold text-gold px-6 py-2 rounded-full hover:bg-gold hover:text-bg active:scale-95 transition-all duration-300 font-medium min-h-[44px] flex items-center">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-text-primary hover:text-gold transition-colors duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isMobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-surface border-t border-border absolute w-full shadow-lg">
          <div className="px-4 pt-4 pb-6 space-y-4">
            <form onSubmit={handleSearch} className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search films, people..." 
                className="w-full bg-surface-2 rounded-full py-2.5 pl-11 pr-4 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </form>
            <div className="flex flex-col space-y-4 pt-2">
              <Link 
                to="/browse" 
                className="text-text-primary hover:text-gold transition-colors font-medium text-lg px-2" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Browse
              </Link>
              {isAuthenticated ? (
                <>
                  <Link 
                    to={user.role === 'professional' ? '/dashboard/pro' : '/dashboard'} 
                    className="text-text-primary hover:text-gold transition-colors font-medium text-lg px-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="text-left text-text-muted hover:text-text-primary transition-colors font-medium text-lg px-2"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link 
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="border border-gold text-gold px-6 py-2.5 rounded-full hover:bg-gold hover:text-bg transition-colors font-medium w-full text-center block"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
