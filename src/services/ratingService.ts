/**
 * Rating Service
 * Handles session ratings
 */

import { supabase } from './supabase';

export interface SessionRating {
  id?: string;
  user_id: string;
  session_id: string;
  context_module?: string;
  rating: number;
  date: string;
}

/**
 * Add a session rating
 */
export async function addSessionRating(
  userId: string,
  sessionId: string,
  rating: number,
  contextModule?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('session_ratings')
      .insert({
        user_id: userId,
        session_id: sessionId,
        rating,
        context_module: contextModule || null,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      });

    if (error) {
      console.error('Error adding session rating:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in addSessionRating:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's session ratings
 */
export async function getUserSessionRatings(
  userId: string,
  limit?: number
): Promise<SessionRating[]> {
  try {
    let query = supabase
      .from('session_ratings')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching session ratings:', error);
      return [];
    }

    return (data || []).map(rating => ({
      id: rating.id,
      user_id: rating.user_id,
      session_id: rating.session_id,
      context_module: rating.context_module,
      rating: rating.rating,
      date: rating.date,
    }));
  } catch (error) {
    console.error('Error in getUserSessionRatings:', error);
    return [];
  }
}

/**
 * Get rating for a specific session
 */
export async function getSessionRating(
  userId: string,
  sessionId: string
): Promise<SessionRating | null> {
  try {
    const { data, error } = await supabase
      .from('session_ratings')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      user_id: data.user_id,
      session_id: data.session_id,
      context_module: data.context_module,
      rating: data.rating,
      date: data.date,
    };
  } catch (error) {
    console.error('Error in getSessionRating:', error);
    return null;
  }
}

