/**
 * Progress Service
 * Handles completed sessions, progress tracking, and streaks
 */

import { supabase } from './supabase';

export interface CompletedSession {
  id?: string;
  user_id: string;
  session_id: string;
  context_module?: string;
  completed_date: string;
  minutes_completed: number;
}

/**
 * Mark a session as completed
 */
export async function markSessionCompleted(
  userId: string,
  sessionId: string,
  minutesCompleted: number,
  contextModule?: string,
  date?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const completedDate = date || new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('completed_sessions')
      .insert({
        user_id: userId,
        session_id: sessionId,
        context_module: contextModule || null,
        completed_date: completedDate,
        minutes_completed: minutesCompleted,
      });

    if (error) {
      // If it's a duplicate, that's okay - session already completed today
      if (error.code === '23505') {
        return { success: true };
      }
      console.error('Error marking session completed:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in markSessionCompleted:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if session is completed on a specific date
 */
export async function isSessionCompleted(
  userId: string,
  sessionId: string,
  date?: string
): Promise<boolean> {
  try {
    const checkDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('completed_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .eq('completed_date', checkDate)
      .limit(1);

    if (error) {
      console.error('Error checking session completion:', error);
      return false;
    }

    return (data || []).length > 0;
  } catch (error) {
    console.error('Error in isSessionCompleted:', error);
    return false;
  }
}

/**
 * Get user's completed sessions
 */
export async function getUserCompletedSessions(
  userId: string,
  limit?: number
): Promise<CompletedSession[]> {
  try {
    let query = supabase
      .from('completed_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching completed sessions:', error);
      return [];
    }

    return (data || []).map(session => ({
      id: session.id,
      user_id: session.user_id,
      session_id: session.session_id,
      context_module: session.context_module,
      completed_date: session.completed_date,
      minutes_completed: parseFloat(session.minutes_completed) || 0,
    }));
  } catch (error) {
    console.error('Error in getUserCompletedSessions:', error);
    return [];
  }
}

/**
 * Calculate user streak (using database function)
 */
export async function calculateUserStreak(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('calculate_user_streak', {
      user_uuid: userId,
    });

    if (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error in calculateUserStreak:', error);
    return 0;
  }
}

/**
 * Get completed sessions for a specific date range
 */
export async function getCompletedSessionsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<CompletedSession[]> {
  try {
    const { data, error } = await supabase
      .from('completed_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('completed_date', startDate)
      .lte('completed_date', endDate)
      .order('completed_date', { ascending: false });

    if (error) {
      console.error('Error fetching completed sessions by date range:', error);
      return [];
    }

    return (data || []).map(session => ({
      id: session.id,
      user_id: session.user_id,
      session_id: session.session_id,
      context_module: session.context_module,
      completed_date: session.completed_date,
      minutes_completed: parseFloat(session.minutes_completed) || 0,
    }));
  } catch (error) {
    console.error('Error in getCompletedSessionsByDateRange:', error);
    return [];
  }
}

