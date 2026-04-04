import { supabase } from '../lib/supabase'
import { batchFetchVideoStats, fetchVideoStats, fetchRecentVideosFromChannel } from './youtube'

// ─────────────────────────────────────────
// Sync ALL films that have a YouTube ID
// Call this from the admin panel "Sync" button
// ─────────────────────────────────────────
export const syncAllFilmStats = async (onProgress = null) => {
  try {
    // 0. First, fetch new trailers from trusted channels
    onProgress?.({ stage: 'fetching', total: 0, done: 0, currentFilm: 'Checking channels for new trailers...' })
    const newTrailersResult = await syncNewTrailersFromChannels(onProgress)
    
    // 1. Get all films with a YouTube ID
    const { data: films, error } = await supabase
      .from('films')
      .select('id, title, trailer_youtube_id')
      .eq('trailer_source', 'youtube')
      .not('trailer_youtube_id', 'is', null)

    if (error) throw error
    if (!films || films.length === 0) {
      return { success: true, synced: 0, message: newTrailersResult.message || 'No films to sync' }
    }

    onProgress?.({ stage: 'fetching', total: films.length, done: 0, currentFilm: 'Fetching stats from YouTube...' })

    // 2. Batch fetch all stats (50 at a time — very quota efficient)
    const videoIds = films.map(f => f.trailer_youtube_id)
    const stats = await batchFetchVideoStats(videoIds)

    onProgress?.({ stage: 'saving', total: films.length, done: 0 })

    // 3. Save each film's stats to Supabase
    let synced = 0
    const errors = []

    for (const film of films) {
      const filmStats = stats[film.trailer_youtube_id]
      if (!filmStats) continue

      try {
        // Insert into youtube_stats history table
        await supabase.from('youtube_stats').insert({
          film_id: film.id,
          youtube_video_id: film.trailer_youtube_id,
          view_count: filmStats.viewCount,
          like_count: filmStats.likeCount,
          comment_count: filmStats.commentCount,
          synced_at: new Date().toISOString()
        })

        // Update cached view count on films table
        await supabase
          .from('films')
          .update({ view_count: filmStats.viewCount })
          .eq('id', film.id)

        synced++
        onProgress?.({ 
          stage: 'saving', 
          total: films.length, 
          done: synced,
          currentFilm: film.title 
        })

      } catch (err) {
        errors.push({ film: film.title, error: err.message })
      }
    }

    return {
      success: true,
      synced,
      errors,
      message: `${newTrailersResult.message} Synced stats for ${synced} existing films.`
    }

  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ─────────────────────────────────────────
// Fetch new trailers from trusted channels
// ─────────────────────────────────────────
export const syncNewTrailersFromChannels = async (onProgress = null) => {
  try {
    const { data: channels } = await supabase.from('youtube_channels').select('*').eq('is_active', true)
    if (!channels || channels.length === 0) return { success: true, message: 'No active channels.' }
    
    let totalAdded = 0
    
    for (const channel of channels) {
      onProgress?.({ stage: 'fetching', total: channels.length, done: 0, currentFilm: `Checking ${channel.name}...` })
      
      const videos = await fetchRecentVideosFromChannel(channel.channel_id, 10)
      
      for (const video of videos) {
        // Check if this video already exists in films
        const { data: existing } = await supabase.from('films').select('id').eq('trailer_youtube_id', video.videoId).maybeSingle()
        if (existing) continue
        
        // Add as a pending film
        const newFilm = {
          title: video.title,
          synopsis: video.description?.substring(0, 500),
          poster: video.thumbnail,
          backdrop: video.thumbnail,
          trailer_source: 'youtube',
          trailer_youtube_id: video.videoId,
          status: 'announced', // Pending review
          year: new Date(video.publishedAt).getFullYear(),
          view_count: video.viewCount,
          language: 'English',
          nfvcb_rating: '18'
        }
        
        await supabase.from('films').insert([newFilm])
        totalAdded++
      }
    }
    
    return { success: true, message: totalAdded > 0 ? `Found and added ${totalAdded} new trailers for review.` : 'No new trailers found.' }
  } catch (error) {
    console.error('syncNewTrailersFromChannels error:', error)
    return { success: false, error: error.message, message: 'Error fetching from channels.' }
  }
}

// ─────────────────────────────────────────
// Sync a SINGLE film's stats
// Call this from the film detail admin action
// ─────────────────────────────────────────
export const syncSingleFilmStats = async (filmId) => {
  try {
    const { data: film } = await supabase
      .from('films')
      .select('id, title, trailer_youtube_id, trailer_source')
      .eq('id', filmId)
      .single()

    if (!film?.trailer_youtube_id || film.trailer_source !== 'youtube') {
      return { success: false, message: 'No YouTube ID for this film' }
    }

    const stats = await fetchVideoStats(film.trailer_youtube_id)
    if (!stats) {
      return { success: false, message: 'Could not fetch from YouTube' }
    }

    await supabase.from('youtube_stats').insert({
      film_id: film.id,
      youtube_video_id: film.trailer_youtube_id,
      view_count: stats.viewCount,
      like_count: stats.likeCount,
      comment_count: stats.commentCount,
      synced_at: new Date().toISOString()
    })

    await supabase
      .from('films')
      .update({ view_count: stats.viewCount })
      .eq('id', film.id)

    return { 
      success: true, 
      stats,
      message: `Synced: ${stats.viewCount.toLocaleString()} views` 
    }

  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ─────────────────────────────────────────
// Queue trailer candidates for admin review
// Called after searching — never saves directly
// ─────────────────────────────────────────
export const queueTrailerForReview = async (filmId, candidates) => {
  try {
    // Clear previous pending candidates for this film
    await supabase
      .from('trailer_review_queue')
      .delete()
      .eq('film_id', filmId)
      .eq('status', 'pending')

    // Insert new candidates
    const rows = candidates.map(c => ({
      film_id: filmId,
      youtube_video_id: c.videoId,
      video_title: c.title,
      video_thumbnail: c.thumbnail,
      channel_name: c.channelTitle,
      duration: c.duration,
      view_count: c.viewCount,
      source: 'search',
      status: 'pending'
    }))

    const { error } = await supabase
      .from('trailer_review_queue')
      .insert(rows)

    if (error) throw error
    return { success: true }

  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ─────────────────────────────────────────
// Approve a trailer from the review queue
// Sets it as the official trailer on the film
// ─────────────────────────────────────────
export const approveTrailer = async (queueId, filmId, videoId, adminUserId) => {
  try {
    // Mark as approved in queue
    await supabase
      .from('trailer_review_queue')
      .update({
        status: 'approved',
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', queueId)

    // Reject all other candidates for this film
    await supabase
      .from('trailer_review_queue')
      .update({ status: 'rejected' })
      .eq('film_id', filmId)
      .eq('status', 'pending')

    // Save to the actual films record
    await supabase
      .from('films')
      .update({
        trailer_youtube_id: videoId,
        trailer_source: 'youtube'
      })
      .eq('id', filmId)

    // Immediately sync stats for this film
    await syncSingleFilmStats(filmId)

    return { success: true }

  } catch (error) {
    return { success: false, error: error.message }
  }
}