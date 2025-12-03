/**
 * Liked Sessions Service
 * Handles favorited/liked sessions
 */

import { supabase } from './supabase';

/**
 * Toggle like status for a session
 */
export async function toggleLikedSession(
  userId: string,
  sessionId: string
): Promise<{ success: boolean; isLiked: boolean; error?: string }> {
  try {
    console.log('💾 Attempting to toggle like for session:', sessionId, 'user:', userId);
    
    // First check if already liked
    const { data: existing, error: checkError } = await supabase
      .from('liked_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking like status:', checkError);
    }

    if (existing) {
      // Unlike: delete the record
      console.log('🗑️ Unliking session:', sessionId);
      const { error } = await supabase
        .from('liked_sessions')
        .delete()
        .eq('user_id', userId)
        .eq('session_id', sessionId);

      if (error) {
        console.error('❌ Error unliking session:', error);
        return { success: false, isLiked: true, error: error.message };
      }

      console.log('✅ Successfully unliked session in database:', sessionId);
      return { success: true, isLiked: false };
    } else {
      // Like: insert new record
      console.log('❤️ Liking session:', sessionId);
      const { error } = await supabase
        .from('liked_sessions')
        .insert({
          user_id: userId,
          session_id: sessionId,
        });

      if (error) {
        console.error('❌ Error liking session:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        return { success: false, isLiked: false, error: error.message };
      }

      console.log('✅ Successfully added like to database!');
      console.log('✅ Session ID:', sessionId);
      console.log('✅ User ID:', userId);
      return { success: true, isLiked: true };
    }
  } catch (error: any) {
    console.error('❌ Error in toggleLikedSession:', error);
    return { success: false, isLiked: false, error: error.message };
  }
}

/**
 * Check if session is liked
 */
export async function isSessionLiked(
  userId: string,
  sessionId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('liked_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .limit(1);

    if (error) {
      console.error('Error checking liked status:', error);
      return false;
    }

    return (data || []).length > 0;
  } catch (error) {
    console.error('Error in isSessionLiked:', error);
    return false;
  }
}

/**
 * Get all liked session IDs for a user
 */
export async function getLikedSessionIds(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('liked_sessions')
      .select('session_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching liked sessions:', error);
      return [];
    }

    return (data || []).map(item => item.session_id);
  } catch (error) {
    console.error('Error in getLikedSessionIds:', error);
    return [];
  }
}

