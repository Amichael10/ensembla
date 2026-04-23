import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/layout/AuthLayout';

export default function Onboarding() {
  const [role, setRole] = useState('fan');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Lumi | Complete Your Profile";
    if (user?.onboarded) {
      navigate(user.role === 'professional' ? '/pro-dashboard' : '/dashboard');
    }
    if (user?.name) setName(user.name);
  }, [user, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // In a real app, we'd upload the avatar to Supabase Storage here
      // For now, we update the metadata
      await updateUserProfile({
        name: name || user.email.split('@')[0],
        role: role,
        onboarded: true,
        // avatar_url: preview // This would be the storage URL normally
      });
      
      navigate(role === 'professional' ? '/pro-dashboard' : '/dashboard');
    } catch (err) {
      console.error('Onboarding failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-10 space-y-2">
        <h2 className="font-heading font-bold text-4xl md:text-5xl text-text-primary tracking-tighter uppercase italic leading-none">
          Complete <span className="text-brand">Profile</span>
        </h2>
        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] opacity-60">
          Personalize your Lumi experience
        </p>
      </div>

      <form onSubmit={handleComplete} className="space-y-8">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-border group-hover:border-brand transition-all bg-surface-2 flex items-center justify-center">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted opacity-40">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Upload</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-40">
            Profile Image (Optional)
          </p>
        </div>

        {/* Account Type Selection (Always Visible) */}
        <div className="space-y-4">
          <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">
            Select Account Type
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole('fan')}
              className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-500 ${
                role === 'fan' ? 'border-brand bg-brand/5' : 'border-border bg-surface-2/30'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${role === 'fan' ? 'bg-brand text-white' : 'bg-surface-2 text-text-muted'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">FAN HUB</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('professional')}
              className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-500 ${
                role === 'professional' ? 'border-brand bg-brand/5' : 'border-border bg-surface-2/30'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${role === 'professional' ? 'bg-brand text-white' : 'bg-surface-2 text-text-muted'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">INDUSTRY</span>
            </button>
          </div>
        </div>

        {/* Step-based Content */}
        {role === 'professional' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 bg-surface-2/30 border-2 border-brand/20 rounded-2xl space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand/10 text-brand rounded-xl flex items-center justify-center text-xl">🔍</div>
                    <div className="space-y-1">
                        <h3 className="font-heading font-bold text-lg text-text-primary tracking-tight uppercase italic">Identify Yourself</h3>
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-60">Search for your existing archive profile</p>
                    </div>
                </div>
                <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="SEARCH YOUR STAGE NAME..."
                      className="w-full bg-surface-2/50 border border-border text-text-primary rounded-xl px-6 py-4 text-[11px] font-bold uppercase tracking-widest focus:border-brand transition-all"
                    />
                </div>
                <div className="pt-6 border-t border-border/50 text-center">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-40 mb-4">NOT IN THE ARCHIVE YET?</p>
                    <button 
                      type="button"
                      onClick={() => navigate('/pro-dashboard')} 
                      className="text-[10px] font-black text-brand hover:underline uppercase tracking-widest"
                    >
                      + CREATE NEW OFFICIAL PROFILE
                    </button>
                </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Display Name */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="YOUR NAME"
                className="w-full bg-surface-2/50 border border-border text-text-primary rounded-xl px-6 py-4 text-[11px] font-bold uppercase tracking-widest focus:border-brand focus:outline-none transition-all"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand text-white text-[11px] font-black uppercase tracking-widest py-5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand/20 disabled:opacity-50"
        >
          {isLoading ? 'SYNCING PROFILE...' : 'START YOUR JOURNEY'}
        </button>
      </form>
    </AuthLayout>
  );
}
