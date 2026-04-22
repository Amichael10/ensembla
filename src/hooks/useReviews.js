import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useReviews = (filmId, currentUser) => {
    const [reviews, setReviews] = useState([])
    const [userReview, setUserReview] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!filmId) return
        fetchReviews()
    }, [filmId])

    const fetchReviews = async () => {
        setLoading(true)
        try {
            // Remove the users join to prevent 500 errors due to restricted access
            const { data, error } = await supabase
                .from('reviews')
                .select('*') 
                .eq('film_id', filmId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Fetch reviews error:', error);
                throw error;
            }

            setReviews(data || [])

            if (currentUser?.id) {
                const existing = data?.find(r => r.user_id === currentUser.id)
                setUserReview(existing || null)
            }
        } catch (error) {
            console.error('Critical Fetch Fail:', error);
        } finally {
            setLoading(false)
        }
    }

    const submitReview = async (rating, bodyContent) => {
        if (!currentUser?.id) return false

        try {
            if (userReview) {
                // UPDATE existing
                const { error } = await supabase
                    .from('reviews')
                    .update({ 
                       rating, 
                       body: bodyContent,
                       updated_at: new Date().toISOString()
                    })
                    .eq('id', userReview.id)
                if (error) throw error;
            } else {
                // INSERT new
                const { error } = await supabase
                    .from('reviews')
                    .insert({
                        user_id: currentUser.id,
                        film_id: filmId,
                        rating,
                        body: bodyContent
                    })
                if (error) throw error;
            }

            await fetchReviews()
            return true
        } catch (err) {
            console.error('Submit review error:', err);
            return false
        }
    }

    const deleteReview = async (reviewId) => {
        await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId)

        await fetchReviews()
    }

    return {
        reviews,
        userReview,
        loading,
        submitReview,
        deleteReview,
        refetch: fetchReviews
    }
}