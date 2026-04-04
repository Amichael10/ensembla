import { useState } from 'react'
import { resolveChannelId } from '../../utils/youtube'
import { supabase } from '../../lib/supabase'

const AddChannel = ({ onChannelAdded, currentUserId }) => {
  const [input, setInput] = useState('')
  const [resolving, setResolving] = useState(false)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [description, setDescription] = useState('')

  const handleResolve = async () => {
    if (!input.trim()) return
    setResolving(true)
    setPreview(null)
    setError(null)

    const result = await resolveChannelId(input.trim())

    if (result.error) {
      setError(result.error)
    } else {
      setPreview(result)
    }
    setResolving(false)
  }

  const handleSave = async () => {
    if (!preview) return
    setSaving(true)

    const { error } = await supabase
      .from('youtube_channels')
      .insert({
        name: preview.name,
        channel_id: preview.channelId,
        channel_url: `https://www.youtube.com/channel/${preview.channelId}`,
        description: description || null,
        added_by: currentUserId,
        is_active: true
      })

    if (error) {
      setError(error.message.includes('unique') 
        ? 'This channel is already added.' 
        : error.message
      )
    } else {
      onChannelAdded?.()
      setInput('')
      setPreview(null)
      setDescription('')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-text-muted block mb-2">
          YouTube Channel URL or @handle
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleResolve()}
            placeholder="@EbonyLifeTV or youtube.com/channel/..."
            className="flex-1 bg-bg border border-border text-text-primary rounded-xl px-4 py-2 text-sm focus:border-gold focus:outline-none"
          />
          <button
            onClick={handleResolve}
            disabled={resolving || !input.trim()}
            className="bg-surface-2 text-text-primary px-4 py-2 rounded-xl text-sm hover:bg-surface transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {resolving ? 'Looking up...' : 'Find Channel'}
          </button>
        </div>
      </div>

      {/* Channel preview */}
      {preview && (
        <div className="p-4 bg-surface-2 rounded-xl border border-border space-y-3">
          <div className="flex items-center gap-3">
            {preview.thumbnail && (
              <img
                src={preview.thumbnail}
                alt={preview.name}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <p className="text-text-primary font-semibold">
                {preview.name}
              </p>
              <p className="text-text-muted text-xs">
                {parseInt(preview.subscriberCount || 0).toLocaleString()} subscribers · {' '}
                {parseInt(preview.videoCount || 0).toLocaleString()} videos
              </p>
            </div>
            <span className="ml-auto text-green-400 text-sm">✓ Found</span>
          </div>

          <div>
            <label className="text-sm text-text-muted block mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Official EbonyLife trailers"
              className="w-full bg-bg border border-border text-text-primary rounded-xl px-4 py-2 text-sm focus:border-gold focus:outline-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gold text-dark font-semibold py-2 rounded-xl text-sm hover:bg-gold/90 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add Channel'}
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm bg-red-900/20 px-4 py-2 rounded-xl">
          {error}
        </p>
      )}
    </div>
  )
}

export default AddChannel