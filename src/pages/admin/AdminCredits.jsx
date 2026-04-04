import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import Drawer from '../../components/admin/Drawer';
import ConfirmModal from '../../components/admin/ConfirmModal';
import SkeletonRow from '../../components/admin/SkeletonRow';

// Custom Searchable Dropdown Component
function SearchableDropdown({ options, value, onChange, placeholder, type = 'person' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        className="w-full bg-bg border border-border text-text-primary rounded-xl px-4 py-2 text-sm focus-within:border-gold cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption ? (
          <div className="flex items-center gap-2">
            {selectedOption.image ? (
              <img src={selectedOption.image} alt="" className={`w-6 h-6 object-cover bg-surface-2 ${type === 'film' ? 'rounded-md' : 'rounded-full'}`} />
            ) : (
              <div className={`w-6 h-6 bg-surface-2 flex items-center justify-center text-[10px] font-bold ${type === 'film' ? 'rounded-md' : 'rounded-full'}`}>
                {selectedOption.label.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate">{selectedOption.label}</span>
          </div>
        ) : (
          <span className="text-text-muted">{placeholder}</span>
        )}
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-surface-2 border border-border rounded-xl shadow-xl max-h-60 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              className="w-full bg-bg border border-border text-text-primary rounded-lg px-3 py-1.5 text-sm focus:border-gold focus:outline-none"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-sm text-text-muted">No results found</div>
            ) : (
              filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  className={`p-2 rounded-lg cursor-pointer flex items-center gap-3 hover:bg-surface transition-colors ${value === opt.value ? 'bg-surface' : ''}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  {opt.image ? (
                    <img src={opt.image} alt="" className={`w-8 h-8 object-cover bg-surface-2 ${type === 'film' ? 'rounded-md' : 'rounded-full'}`} />
                  ) : (
                    <div className={`w-8 h-8 bg-surface-2 flex items-center justify-center text-xs font-bold ${type === 'film' ? 'rounded-md' : 'rounded-full'}`}>
                      {opt.label.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="truncate text-sm">{opt.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCredits() {
  const [credits, setCredits] = useState([]);
  const [allPeople, setAllPeople] = useState([]);
  const [allFilms, setAllFilms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Modals/Drawers state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCredit, setEditingCredit] = useState(null);
  const [deletingCredit, setDeletingCredit] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    person_id: '',
    film_id: '',
    role: 'actor',
    character_name: '',
    billing_order: 99
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [creditsRes, peopleRes, filmsRes] = await Promise.all([
        supabase
          .from('credits')
          .select(`
            *,
            people(id, name, photo_url),
            films(id, title, poster_url)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('people')
          .select('id, name, photo_url')
          .order('name'),
        supabase
          .from('films')
          .select('id, title, poster_url')
          .order('title')
      ]);

      if (creditsRes.error) throw creditsRes.error;
      if (peopleRes.error) throw peopleRes.error;
      if (filmsRes.error) throw filmsRes.error;

      setCredits(creditsRes.data || []);
      setAllPeople(peopleRes.data || []);
      setAllFilms(filmsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtering
  const filteredCredits = credits.filter(c => {
    const personName = c.people?.name?.toLowerCase() || '';
    const filmTitle = c.films?.title?.toLowerCase() || '';
    const searchLower = search.toLowerCase();
    
    const matchesSearch = personName.includes(searchLower) || filmTitle.includes(searchLower);
    const matchesRole = roleFilter === 'All' || c.role.toLowerCase() === roleFilter.toLowerCase();
    
    return matchesSearch && matchesRole;
  });

  const handleDelete = async () => {
    if (!deletingCredit) return;
    try {
      const { error } = await supabase
        .from('credits')
        .delete()
        .eq('id', deletingCredit.id);

      if (error) throw error;

      setCredits(credits.filter(c => c.id !== deletingCredit.id));
      toast.success('Credit removed');
      setDeletingCredit(null);
    } catch (error) {
      console.error('Error deleting credit:', error);
      toast.error('Failed to remove credit');
    }
  };

  const openAddDrawer = () => {
    setEditingCredit(null);
    setFormData({
      person_id: '',
      film_id: '',
      role: 'actor',
      character_name: '',
      billing_order: 99
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (credit) => {
    setEditingCredit(credit);
    setFormData({
      person_id: credit.person_id || '',
      film_id: credit.film_id || '',
      role: credit.role || 'actor',
      character_name: credit.character_name || '',
      billing_order: credit.billing_order || 99
    });
    setIsDrawerOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.person_id || !formData.film_id || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = {
        person_id: formData.person_id,
        film_id: formData.film_id,
        role: formData.role,
        character_name: formData.role === 'actor' ? formData.character_name : null,
        billing_order: parseInt(formData.billing_order, 10) || 99
      };

      if (!editingCredit) {
        // Check for duplicate
        const { data: existing } = await supabase
          .from('credits')
          .select('id')
          .eq('person_id', formData.person_id)
          .eq('film_id', formData.film_id)
          .eq('role', formData.role);

        if (existing && existing.length > 0) {
          toast.error('This credit already exists.');
          setIsSaving(false);
          return;
        }

        const { error } = await supabase
          .from('credits')
          .insert([dataToSave]);
        if (error) throw error;
        toast.success('Credit added');
      } else {
        const { error } = await supabase
          .from('credits')
          .update(dataToSave)
          .eq('id', editingCredit.id);
        if (error) throw error;
        toast.success('Credit updated');
      }
      setIsDrawerOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving credit:', error);
      toast.error('Failed to save credit');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role.toLowerCase()) {
      case 'actor': return 'bg-blue-500/20 text-blue-400';
      case 'director': return 'bg-gold/20 text-gold';
      case 'writer': return 'bg-green-500/20 text-green-400';
      case 'producer': return 'bg-[#C1440E]/20 text-[#C1440E]';
      default: return 'bg-surface-2 text-text-muted';
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  // Format options for dropdowns
  const peopleOptions = allPeople.map(p => ({ value: p.id, label: p.name, image: p.photo_url }));
  const filmOptions = allFilms.map(f => ({ value: f.id, label: f.title, image: f.poster_url }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-primary">Credits</h1>
          <span className="bg-surface-2 text-text-muted px-3 py-1 rounded-full text-sm font-medium">
            {credits.length}
          </span>
        </div>
        <button
          onClick={openAddDrawer}
          className="bg-gold text-dark font-semibold px-4 py-2 rounded-xl hover:bg-gold/90 transition-colors"
        >
          + Add Credit
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#13192B] p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between border border-border">
        <div className="relative w-full md:w-96">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by person or film..."
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
            <option value="Actor">Actor</option>
            <option value="Director">Director</option>
            <option value="Writer">Writer</option>
            <option value="Producer">Producer</option>
            <option value="Cinematographer">Cinematographer</option>
            <option value="Editor">Editor</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#13192B] rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted uppercase bg-surface-2/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Person</th>
                <th className="px-6 py-4 font-medium">Film</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Character</th>
                <th className="px-6 py-4 font-medium">Billing</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => <SkeletonRow key={i} columns={6} />)
              ) : filteredCredits.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-text-muted">
                    No credits found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCredits.map((credit) => (
                  <tr key={credit.id} className="hover:bg-surface-2/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {credit.people?.photo_url ? (
                          <img src={credit.people.photo_url} alt={credit.people?.name} className="w-8 h-8 rounded-full object-cover bg-surface-2" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-xs font-bold text-text-primary">
                            {getInitials(credit.people?.name)}
                          </div>
                        )}
                        <span className="font-medium text-text-primary">{credit.people?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {credit.films?.poster_url ? (
                          <img src={credit.films.poster_url} alt={credit.films?.title} className="w-6 h-9 rounded object-cover bg-surface-2" />
                        ) : (
                          <div className="w-6 h-9 rounded bg-surface-2 flex items-center justify-center text-[10px] font-bold text-text-primary">
                            {getInitials(credit.films?.title)}
                          </div>
                        )}
                        <span className="text-text-primary">{credit.films?.title || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(credit.role)}`}>
                        {credit.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {credit.role === 'actor' ? (credit.character_name || '—') : '—'}
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {credit.billing_order}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditDrawer(credit)}
                          className="p-2 text-text-muted hover:text-blue-400 hover:bg-surface rounded-lg transition-colors"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeletingCredit(credit)}
                          className="p-2 text-text-muted hover:text-red-400 hover:bg-surface rounded-lg transition-colors"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingCredit ? "Edit Credit" : "Add Credit"}
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Person *</label>
            <SearchableDropdown
              options={peopleOptions}
              value={formData.person_id}
              onChange={(val) => setFormData({ ...formData, person_id: val })}
              placeholder="Select a person..."
              type="person"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Film *</label>
            <SearchableDropdown
              options={filmOptions}
              value={formData.film_id}
              onChange={(val) => setFormData({ ...formData, film_id: val })}
              placeholder="Select a film..."
              type="film"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-bg border border-border text-text-primary rounded-xl px-4 py-2 text-sm focus:border-gold focus:outline-none"
            >
              <option value="actor">Actor</option>
              <option value="director">Director</option>
              <option value="writer">Writer</option>
              <option value="producer">Producer</option>
              <option value="cinematographer">Cinematographer</option>
              <option value="editor">Editor</option>
              <option value="composer">Composer</option>
              <option value="costume_designer">Costume Designer</option>
            </select>
          </div>

          {formData.role === 'actor' && (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Character Name</label>
              <input
                type="text"
                value={formData.character_name}
                onChange={(e) => setFormData({ ...formData, character_name: e.target.value })}
                className="w-full bg-bg border border-border text-text-primary rounded-xl px-4 py-2 text-sm focus:border-gold focus:outline-none"
                placeholder="Character name in the film"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Billing Order</label>
            <input
              type="number"
              min="1"
              value={formData.billing_order}
              onChange={(e) => setFormData({ ...formData, billing_order: e.target.value })}
              className="w-full bg-bg border border-border text-text-primary rounded-xl px-4 py-2 text-sm focus:border-gold focus:outline-none"
            />
            <p className="mt-1 text-xs text-text-muted">
              Lower number = higher billing position. Set 1 for the lead actor.
            </p>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-gold text-dark font-semibold py-3 rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Credit'}
            </button>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="w-full text-text-muted hover:text-text-primary font-medium py-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Drawer>

      {/* Delete Confirmation Modal */}
      {deletingCredit && (
        <ConfirmModal
          title="Remove Credit"
          message={`Remove ${deletingCredit.people?.name} as ${deletingCredit.role.replace('_', ' ')} in ${deletingCredit.films?.title}?`}
          confirmLabel="Remove"
          confirmColor="bg-red-500 hover:bg-red-600"
          onConfirm={handleDelete}
          onCancel={() => setDeletingCredit(null)}
        />
      )}
    </div>
  );
}
