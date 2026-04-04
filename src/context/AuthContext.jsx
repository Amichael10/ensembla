import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (authUser) => {
    if (!authUser) {
      setUser(null);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (data) {
        setUser({
          ...authUser,
          app_metadata: data // Store the public.users data
        });
      } else {
        setUser(authUser);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setUser(authUser);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user).finally(() => setLoading(false));
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        fetchUserProfile(session.user);
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error('Google login error:', error);
  };

  const signup = async (name, email, password, role) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        }
      }
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const formattedUser = user ? {
    id: user.id,
    name: user.app_metadata?.name || user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0],
    email: user.email,
    avatar_url: user.app_metadata?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    role: user.app_metadata?.role || user.user_metadata?.role || 'fan'
  } : null;

  const value = {
    user: formattedUser,
    login,
    loginWithGoogle,
    signup,
    logout,
    isAuthenticated: !!user,
    role: formattedUser?.role || null,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
