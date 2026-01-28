/**
 * Emotional Feedback Service
 * Handles in-session emotional feedback entries
 */

import { supabase } from './supabase';
import type { EmotionalFeedbackLabel } from '../types';
import { getLocalDateString } from '../utils/dateUtils';

export interface EmotionalFeedback {
  id?: string;
  user_id: string;
  session_id: string;
  context_module?: string;
  label: EmotionalFeedbackLabel;
  timestamp_seconds: number;
  feedback_date: string;
}

/**
 * Add emotional feedback entry
 */
export async function addEmotionalFeedback(
  userId: string,
  sessionId: string,
  label: EmotionalFeedbackLabel,
  timestampSeconds: number,
  contextModule?: string,
  date?: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const feedbackDate = date || getLocalDateString();

    const { data, error } = await supabase
      .from('emotional_feedback')
      .insert({
        user_id: userId,
        session_id: sessionId,
        context_module: contextModule || null,
        label,
        timestamp_seconds: timestampSeconds,
        feedback_date: feedbackDate,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error adding emotional feedback:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error: any) {
    console.error('Error in addEmotionalFeedback:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's emotional feedback history
 */
export async function getUserEmotionalFeedback(
  userId: string,
  limit?: number
): Promise<EmotionalFeedback[]> {
  try {
    let query = supabase
      .from('emotional_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }); // Sort by created_at for most recent first

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching emotional feedback:', error);
      return [];
    }

    return (data || []).map(feedback => ({
      id: feedback.id,
      user_id: feedback.user_id,
      session_id: feedback.session_id,
      context_module: feedback.context_module,
      label: feedback.label as EmotionalFeedbackLabel,
      timestamp_seconds: feedback.timestamp_seconds,
      feedback_date: feedback.feedback_date,
    }));
  } catch (error) {
    console.error('Error in getUserEmotionalFeedback:', error);
    return [];
  }
}

/**
 * Get user's emotional feedback history with session details in a single query
 * This is more efficient than fetching sessions separately
 */
export async function getUserEmotionalFeedbackWithSessions(
  userId: string,
  limit?: number
): Promise<Array<{
  feedback: EmotionalFeedback;
  session: {
    id: string;
    title: string;
    duration_min: number;
    modality: string;
    goal: string;
    module_id?: string;
  } | null;
}>> {
  try {
    let query = supabase
      .from('emotional_feedback')
      .select(`
        *,
        sessions:session_id (
          id,
          title,
          duration_min,
          technique
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching emotional feedback with sessions:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      feedback: {
        id: item.id,
        user_id: item.user_id,
        session_id: item.session_id,
        context_module: item.context_module,
        label: item.label as EmotionalFeedbackLabel,
        timestamp_seconds: item.timestamp_seconds,
        feedback_date: item.feedback_date,
      },
      session: item.sessions ? {
        id: item.sessions.id,
        title: item.sessions.title,
        duration_min: item.sessions.duration_min,
        modality: item.sessions.technique, // Map technique to modality
        goal: 'anxiety' as any, // Default goal (sessions don't have goal column)
        module_id: item.context_module || undefined, // Use context_module from feedback
      } : null,
    }));
  } catch (error) {
    console.error('Error in getUserEmotionalFeedbackWithSessions:', error);
    return [];
  }
}

/**
 * Remove emotional feedback entry
 */
export async function removeEmotionalFeedback(
  userId: string,
  feedbackId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('emotional_feedback')
      .delete()
      .eq('id', feedbackId)
      .eq('user_id', userId); // Ensure user can only delete their own feedback

    if (error) {
      console.error('Error removing emotional feedback:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in removeEmotionalFeedback:', error);
    return { success: false, error: error.message };
  }
}



