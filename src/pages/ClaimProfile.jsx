import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import PersonCard from '../components/person/PersonCard';

export default function ClaimProfile() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [claimReason, setClaimReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    document.title = "FilmDba | Claim Profile";
    if (user?.id) {
       checkExistingClaim();
    }
  }, [user?.id]);

  const checkExistingClaim = async () => {
    const { data } = await supabase
      .from('profile_claims')
      .select('status')
      .eq('user_id', user.id)
      .single();
    
    if (data && (data.status === 'pending' || data.status === 'approved')) {
      toast.success('Redirecting to your dashboard...');
      window.location.href = '/dashboard/pro';
    }
  };

  useEffect(() => {
    if (searchQuery.length > 2) {
      const delaySearch = setTimeout(async () => {
        const { data } = await supabase
          .from('people')
          .select('*')
          .ilike('name', `%${searchQuery}%`)
          .limit(8);
        setFilteredPeople(data || []);
      }, 300);
      return () => clearTimeout(delaySearch);
    } else {
      setFilteredPeople([]);
    }
  }, [searchQuery]);

  const handleSelect = (person) => {
    setSelectedPerson(person);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmed) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profile_claims')
        .insert({
          user_id: user.id,
          person_id: selectedPerson.id,
          status: 'pending',
          notes: claimReason
        });
      
      if (error) throw error;
      setIsSubmitted(true);
    } catch (err) {
      toast.error('Failed to submit claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-bg pt-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="bg-surface border border-border rounded-2xl p-8 md:p-12 text-center max-w-md w-full animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6 relative">
            {/* CSS Checkmark Animation */}
            <div className="absolute inset-0 rounded-full border-4 border-gold border-t-transparent animate-spin" style={{ animationDuration: '3s', animationIterationCount: 1, animationFillMode: 'forwards' }}></div>
            <svg className="w-12 h-12 text-gold animate-in zoom-in duration-500 delay-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 className="font-heading font-bold text-3xl text-text-primary mb-4">Claim Submitted!</h2>
          <p className="text-text-muted mb-8 leading-relaxed">
            We'll review your claim and email you at <strong className="text-text-primary">{user.email}</strong> within 1-2 business days.
          </p>
          <Link to="/dashboard" className="block w-full bg-gold text-bg py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all duration-300">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* STEP INDICATOR */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-2 -z-10"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gold transition-all duration-500 -z-10" style={{ width: `${(step - 1) * 50}%` }}></div>
            
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-500 ${
                  step > num ? 'bg-gold text-bg' : step === num ? 'bg-gold text-bg ring-4 ring-gold/20' : 'bg-surface-2 text-text-muted border border-border'
                }`}>
                  {step > num ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : num}
                </div>
                <span className={`text-xs font-medium uppercase tracking-wider ${step >= num ? 'text-gold' : 'text-text-muted'}`}>
                  {num === 1 ? 'Search' : num === 2 ? 'Select' : 'Submit'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 md:p-10 shadow-xl">
          {/* STEP 1: SEARCH */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="font-heading font-bold text-3xl text-text-primary mb-2 text-center">Find Your Profile</h2>
              <p className="text-text-muted text-center mb-8">Search for your name to claim your official FilmDba page.</p>
              
              <div className="relative max-w-xl mx-auto mb-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input 
                  type="text" 
                  placeholder="Search your name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-bg border border-border text-text-primary rounded-full pl-12 pr-4 py-4 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-lg"
                  autoFocus
                />
              </div>

              {searchQuery && (
                <div className="mt-8">
                  {filteredPeople.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {filteredPeople.map(person => (
                        <div key={person.id} className="relative group">
                          <PersonCard person={person} />
                          <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                            <button 
                              onClick={() => handleSelect(person)}
                              className="bg-gold text-bg px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform"
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-surface-2 rounded-xl border border-border">
                      <p className="text-text-primary font-medium mb-2">No results for "{searchQuery}"</p>
                      <p className="text-text-muted text-sm">
                        Not found? Your profile may not exist yet. <br/>
                        <a href="#" className="text-gold hover:underline">Contact us to add it.</a>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SELECT */}
          {step === 2 && selectedPerson && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 text-center max-w-md mx-auto">
              <h2 className="font-heading font-bold text-3xl text-text-primary mb-8">Is this you?</h2>
              
              <div className="bg-bg border border-border rounded-2xl p-6 mb-8">
                <img src={selectedPerson.photo} alt={selectedPerson.name} className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-surface" />
                <h3 className="font-heading font-bold text-2xl text-text-primary mb-1 flex items-center justify-center gap-2">
                  {selectedPerson.name}
                  {selectedPerson.is_verified && (
                    <svg className="text-gold" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  )}
                </h3>
                <p className="text-gold font-medium mb-4">{selectedPerson.role}</p>
                
                <div className="flex justify-center gap-6 text-sm">
                  <div>
                    <span className="block text-text-muted">Credits</span>
                    <span className="font-bold text-text-primary">{selectedPerson.film_count}</span>
                  </div>
                  <div>
                    <span className="block text-text-muted">Followers</span>
                    <span className="font-bold text-text-primary">{(selectedPerson.popularity / 1000).toFixed(1)}k</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => setStep(3)}
                  className="w-full bg-gold text-bg py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all duration-300"
                >
                  Yes, this is my profile
                </button>
                <button 
                  onClick={() => setStep(1)}
                  className="w-full text-text-muted hover:text-text-primary py-2 text-sm font-medium transition-colors"
                >
                  Search again
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUBMIT */}
          {step === 3 && selectedPerson && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-lg mx-auto">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
                <img src={selectedPerson.photo} alt={selectedPerson.name} className="w-16 h-16 rounded-full object-cover" />
                <div>
                  <div className="text-sm text-text-muted">Claiming profile for</div>
                  <div className="font-bold text-xl text-text-primary">{selectedPerson.name}</div>
                </div>
                <button onClick={() => setStep(1)} className="ml-auto text-sm text-gold hover:underline">Change</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-text-primary">Describe your connection to this profile</label>
                  <textarea 
                    required
                    value={claimReason}
                    onChange={(e) => setClaimReason(e.target.value)}
                    placeholder="Tell us who you are and how we can verify your identity (e.g. social media links, IMDB page, agency contact)"
                    className="w-full bg-bg border border-border text-text-primary rounded-xl px-4 py-3 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all min-h-[120px]"
                  ></textarea>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-text-primary">Supporting documents (optional)</label>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-gold/50 transition-colors cursor-pointer bg-bg group">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-text-muted group-hover:text-gold transition-colors"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span className="text-sm font-medium text-text-primary block mb-1">Drag and drop or click to upload</span>
                    <span className="text-xs text-text-muted">PDF, JPG, or PNG (max 5MB)</span>
                  </div>
                </div>

                <div className="bg-surface-2 p-4 rounded-xl border border-border flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="confirm" 
                    required
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-border text-gold focus:ring-gold bg-bg accent-gold cursor-pointer"
                  />
                  <label htmlFor="confirm" className="text-sm text-text-muted cursor-pointer select-none">
                    I confirm I am the person named above or their authorized representative. I understand that submitting false claims may result in a permanent ban.
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={!confirmed || !claimReason}
                  className="w-full bg-gold text-bg py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Submit Claim
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
