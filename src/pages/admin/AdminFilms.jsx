import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

export default function AdminFilms() {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFilm, setEditingFilm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormState = {
    title: '',
    year: new Date().getFullYear(),
    synopsis: '',
    poster: '',
    backdrop: '',
    genres: '',
    runtime: '',
    language: 'English',
    nfvcb_rating: '18',
    status: 'released',
    trailer_source: 'youtube',
    trailer_youtube_id: '',
    director: '',
    cast: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchFilms();
  }, []);

  const fetchFilms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('films')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFilms(data || []);
    } catch (error) {
      console.error('Error fetching films:', error);
      toast.error('Failed to load films');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (film = null) => {
    if (film) {
      setEditingFilm(film);
      setFormData({
        ...film,
        genres: film.genres ? film.genres.join(', ') : '',
        cast: film.cast ? film.cast.join(', ') : '',
        trailer_source: film.trailer_source || 'youtube',
        trailer_youtube_id: film.trailer_youtube_id || ''
      });
    } else {
      setEditingFilm(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFilm(null);
    setFormData(initialFormState);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Process array fields
      const processedData = {
        ...formData,
        genres: formData.genres.split(',').map(g => g.trim()).filter(Boolean),
        cast: formData.cast.split(',').map(c => c.trim()).filter(Boolean),
        year: parseInt(formData.year) || null,
        runtime: parseInt(formData.runtime) || null,
        trailer_youtube_id: formData.trailer_source === 'youtube' ? formData.trailer_youtube_id : null
      };

      if (editingFilm) {
        const { data, error } = await supabase
          .from('films')
          .update(processedData)
          .eq('id', editingFilm.id)
          .select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Update failed due to permissions or missing record.');
        toast.success('Film updated successfully');
      } else {
        const { data, error } = await supabase
          .from('films')
          .insert([processedData])
          .select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error('Insert failed due to permissions. Are you sure you have admin rights?');
        toast.success('Film added successfully');
      }

      handleCloseModal();
      fetchFilms();
    } catch (error) {
      console.error('Error saving film:', error);
      toast.error(error.message || 'Failed to save film');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this film?')) return;
    
    try {
      const { error } = await supabase
        .from('films')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Film deleted successfully');
      fetchFilms();
    } catch (error) {
      console.error('Error deleting film:', error);
      toast.error('Failed to delete film');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary font-clash">Films</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-gold text-dark font-semibold px-4 py-2 rounded-xl hover:bg-gold/90 transition-all"
        >
          + Add Film
        </button>
      </div>

      <div className="bg-surface rounded-2xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-2 text-text-muted uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Film</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Trailer</th>
                <th className="px-6 py-4 font-medium">Views</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-text-muted">
                    Loading films...
                  </td>
                </tr>
              ) : films.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-text-muted">
                    No films found. Add your first film to get started.
                  </td>
                </tr>
              ) : (
                films.map((film) => (
                  <tr key={film.id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {film.poster ? (
                          <img src={film.poster} alt={film.title} className="w-10 h-14 object-cover rounded bg-surface-2" />
                        ) : (
                          <div className="w-10 h-14 bg-surface-2 rounded flex items-center justify-center text-text-muted text-xs">
                            No Img
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-text-primary">{film.title}</div>
                          <div className="text-text-muted text-xs">{film.year} • {film.director || 'Unknown Director'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        film.status === 'released' ? 'bg-green-900/30 text-green-400 border border-green-800/50' :
                        film.status === 'post-production' ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50' :
                        'bg-surface-2 text-text-muted border border-border'
                      }`}>
                        {film.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {film.trailer_source === 'youtube' && film.trailer_youtube_id ? (
                        <span className="inline-flex items-center gap-1.5 text-red-400 bg-red-900/20 px-2 py-1 rounded text-xs font-medium border border-red-900/30">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          {film.trailer_youtube_id}
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {film.view_count ? film.view_count.toLocaleString() : '0'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenModal(film)}
                        className="text-gold hover:text-gold/80 font-medium text-sm mr-4 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(film.id)}
                        className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-text-primary font-clash">
                {editingFilm ? 'Edit Film' : 'Add New Film'}
              </h2>
              <button onClick={handleCloseModal} className="text-text-muted hover:text-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gold uppercase tracking-wider">Basic Info</h3>
                  
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Title *</label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-text-muted mb-1">Year</label>
                      <input
                        type="number"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-gold transition-colors appearance-none"
                      >
                        <option value="announced">Announced</option>
                        <option value="filming">Filming</option>
                        <option value="post-production">Post-Production</option>
                        <option value="released">Released</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-text-muted mb-1">Synopsis</label>
                    <textarea
                      name="synopsis"
                      rows="4"
                      value={formData.synopsis}
                      onChange={handleChange}
                      className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-gold transition-colors resize-none"
                    ></textarea>
                  </div>
                </div>

                {/* Media & Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gold uppercase tracking-wider">Media & Details</h3>
                  
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Poster URL</label>
                    <input
                      type="url"
                      name="poster"
                      value={formData.poster}
                      onChange={handleChange}
                      className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Backdrop URL</label>
                    <input
                      type="url"
                      name="backdrop"
                      value={formData.backdrop}
                      onChange={handleChange}
                      className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-text-muted mb-1">Trailer Source</label>
                      <select
                        name="trailer_source"
                        value={formData.trailer_source}
                        onChange={handleChange}
                        className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-gold transition-colors appearance-none"
                      >
                        <option value="youtube">YouTube</option>
                        <option value="external">External Link</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                    {formData.trailer_source === 'youtube' && (
                      <div>
                        <label className="block text-sm text-text-muted mb-1">YouTube ID</label>
                        <input
                          type="text"
                          name="trailer_youtube_id"
                          placeholder="e.g. dQw4w9WgXcQ"
                          value={formData.trailer_youtube_id}
                          onChange={handleChange}
                          className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-gold transition-colors"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-semibold text-gold uppercase tracking-wider mb-4">Credits & Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Director</label>
                    <input
                      type="text"
                      name="director"
                      value={formData.director}
                      onChange={handleChange}
                      className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Cast (comma separated)</label>
                    <input
                      type="text"
                      name="cast"
                      placeholder="Actor 1, Actor 2, Actor 3"
                      value={formData.cast}
                      onChange={handleChange}
                      className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Genres (comma separated)</label>
                    <input
                      type="text"
                      name="genres"
                      placeholder="Drama, Thriller, Action"
                      value={formData.genres}
                      onChange={handleChange}
                      className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-text-muted mb-1">Runtime (min)</label>
                      <input
                        type="number"
                        name="runtime"
                        value={formData.runtime}
                        onChange={handleChange}
                        className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1">Language</label>
                      <input
                        type="text"
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                        className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-muted mb-1">Rating</label>
                      <input
                        type="text"
                        name="nfvcb_rating"
                        value={formData.nfvcb_rating}
                        onChange={handleChange}
                        className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 rounded-xl text-text-primary hover:bg-surface-2 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gold text-dark font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingFilm ? 'Update Film' : 'Add Film'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
