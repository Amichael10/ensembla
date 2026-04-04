import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/admin/ConfirmModal';
import SkeletonRow from '../../components/admin/SkeletonRow';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  
  const [roleChangeData, setRoleChangeData] = useState(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          people(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChangeSelect = (targetUser, newRole) => {
    if (targetUser.role === newRole) return;
    setRoleChangeData({ user: targetUser, newRole });
  };

  const confirmRoleChange = async () => {
    if (!roleChangeData) return;
    const { user, newRole } = roleChangeData;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(`Role updated to ${newRole}`);
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setRoleChangeData(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      (u.name && u.name.toLowerCase().includes(searchLower)) || 
      (u.email && u.email.toLowerCase().includes(searchLower));
    
    const matchesRole = roleFilter === 'All' || u.role.toLowerCase() === roleFilter.toLowerCase();
    
    return matchesSearch && matchesRole;
  });

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-gold text-dark';
      case 'professional': return 'bg-blue-500 text-white';
      default: return 'bg-surface-2 text-text-primary';
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin': return 'bg-gold text-dark';
      case 'professional': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-surface-2 text-text-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-primary">Users</h1>
          <span className="bg-surface-2 text-text-muted px-3 py-1 rounded-full text-sm font-medium">
            {users.length}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#13192B] p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between border border-border">
        <div className="relative w-full md:w-96">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg border border-border text-text-primary rounded-xl pl-10 pr-4 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </div>
        
        <div className="w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full md:w-auto bg-bg border border-border text-text-primary rounded-xl px-4 py-2 text-sm focus:border-gold focus:outline-none"
          >
            <option value="All">All Roles</option>
            <option value="Fan">Fan</option>
            <option value="Professional">Professional</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#13192B] rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted uppercase bg-surface-2/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Avatar</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium">Profile</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => <SkeletonRow key={i} columns={7} />)
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-text-muted">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-2/50 transition-colors group">
                    <td className="px-6 py-4">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.name} className="w-10 h-10 rounded-full object-cover bg-surface-2" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${getAvatarColor(u.role)}`}>
                          {getInitials(u.name || u.email)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-text-primary">
                      {u.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      {u.linked_profile_id && u.people ? (
                        <Link to={`/people/${u.linked_profile_id}`} className="text-gold hover:underline" target="_blank" rel="noopener noreferrer">
                          {u.people.name}
                        </Link>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end" title={u.id === currentUser?.id ? "You cannot change your own role." : ""}>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChangeSelect(u, e.target.value)}
                          disabled={u.id === currentUser?.id}
                          className="bg-bg border border-border text-text-primary rounded-lg px-3 py-1.5 text-sm focus:border-gold focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="fan">Fan</option>
                          <option value="professional">Professional</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Change Confirmation Modal */}
      {roleChangeData && (
        <ConfirmModal
          title="Change Role"
          message={`Change ${roleChangeData.user.name || roleChangeData.user.email}'s role to ${roleChangeData.newRole}?`}
          confirmLabel="Change Role"
          confirmColor="bg-gold text-dark hover:bg-gold/90"
          onConfirm={confirmRoleChange}
          onCancel={() => setRoleChangeData(null)}
        />
      )}
    </div>
  );
}
