/**
 * Session Service
 * Handles fetching sessions from database
 */

import { supabase } from './supabase';
import type { Session } from '../types';

/**
 * Get all active sessions
 */
export async function getAllSessions(): Promise<Session[]> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id,
        title,
        duration_min,
        technique,
        description,
        why_it_works,
        audio_url,
        thumbnail_url,
        is_active
      `)
      .eq('is_active', true)
      .order('title');

    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }

    return (data || []).map(session => ({
      id: session.id,
      title: session.title,
      durationMin: session.duration_min,
      modality: session.technique as any, // Will map technique correctly
      goal: 'anxiety' as any, // Temporary - will get from session_modalities
      description: session.description || undefined,
      whyItWorks: session.why_it_works || undefined,
      isRecommended: false,
      isTutorial: false,
    }));
  } catch (error) {
    console.error('Error in getAllSessions:', error);
    return [];
  }
}

/**
 * Get a single session by ID
 */
export async function getSessionById(sessionId: string): Promise<Session | null> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id,
        title,
        duration_min,
        technique,
        description,
        why_it_works,
        audio_url,
        thumbnail_url,
        is_active
      `)
      .eq('id', sessionId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error('Error fetching session:', error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      durationMin: data.duration_min,
      modality: data.technique as any,
      goal: 'anxiety' as any,
      description: data.description || undefined,
      whyItWorks: data.why_it_works || undefined,
      isRecommended: false,
      isTutorial: false,
    };
  } catch (error) {
    console.error('Error in getSessionById:', error);
    return null;
  }
}

/**
 * Get sessions by modality (module)
 */
export async function getSessionsByModality(modality: string): Promise<Session[]> {
  try {
    const { data, error } = await supabase
      .from('session_modalities')
      .select(`
        session_id,
        sessions (
          id,
          title,
          duration_min,
          technique,
          description,
          why_it_works,
          audio_url,
          thumbnail_url,
          is_active
        )
      `)
      .eq('modality', modality);

    if (error) {
      console.error('Error fetching sessions by modality:', error);
      return [];
    }

    return (data || [])
      .filter(item => {
        const session = item.sessions as any;
        return session && session.is_active === true;
      })
      .map(item => {
        const session = item.sessions as any;
        return {
          id: session.id,
          title: session.title,
          durationMin: session.duration_min,
          modality: session.technique as any,
          goal: 'anxiety' as any,
          description: session.description || undefined,
          whyItWorks: session.why_it_works || undefined,
          isRecommended: false,
          isTutorial: false,
        };
      });
  } catch (error) {
    console.error('Error in getSessionsByModality:', error);
    return [];
  }
}

/**
 * Get all modules (modalities) that a session belongs to
 */
export async function getSessionModules(sessionId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('session_modalities')
      .select('modality')
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error fetching session modules:', error);
      return [];
    }

    return (data || []).map(item => item.modality);
  } catch (error) {
    console.error('Error in getSessionModules:', error);
    return [];
  }
}

/**
 * Get sessions by technique
 */
export async function getSessionsByTechnique(technique: string): Promise<Session[]> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('technique', technique)
      .eq('is_active', true)
      .order('title');

    if (error) {
      console.error('Error fetching sessions by technique:', error);
      return [];
    }

    return (data || []).map(session => ({
      id: session.id,
      title: session.title,
      durationMin: session.duration_min,
      modality: session.technique as any,
      goal: 'anxiety' as any,
      description: session.description || undefined,
      whyItWorks: session.why_it_works || undefined,
      isRecommended: false,
      isTutorial: false,
    }));
  } catch (error) {
    console.error('Error in getSessionsByTechnique:', error);
    return [];
  }
}

