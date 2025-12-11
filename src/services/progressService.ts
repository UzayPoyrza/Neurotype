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
  created_at?: string; // Timestamp for sorting
}

/**
 * Find existing completion entry for same session, context_module, and date
 * Returns the entry ID if found, null otherwise
 */
async function findExistingCompletionByContext(
  userId: string,
  sessionId: string,
  contextModule: string | null,
  date: string
): Promise<{ id: string } | null> {
  try {
    // Normalize context_module: empty string becomes null, trim whitespace
    const normalizedContextModule = contextModule && contextModule.trim() ? contextModule.trim() : null;
    
    console.log('🔍 [findExistingCompletionByContext] Searching for existing entry:', {
      userId,
      sessionId,
      contextModule: normalizedContextModule,
      date,
      originalContextModule: contextModule,
    });

    let query = supabase
      .from('completed_sessions')
      .select('id, context_module')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .eq('completed_date', date);

    // Handle null context_module correctly
    // Also check for empty string as fallback (legacy data might have empty strings)
    if (normalizedContextModule === null) {
      query = query.or('context_module.is.null,context_module.eq.');
    } else {
      query = query.eq('context_module', normalizedContextModule);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      console.error('❌ [findExistingCompletionByContext] Error finding existing completion entry:', error);
      return null;
    }

    if (data && data.length > 0) {
      console.log('✅ [findExistingCompletionByContext] Found existing entry:', data[0]);
      return { id: data[0].id };
    }

    console.log('ℹ️ [findExistingCompletionByContext] No existing entry found');
    return null;
  } catch (error) {
    console.error('❌ [findExistingCompletionByContext] Exception:', error);
    return null;
  }
}

/**
 * Mark a session as completed
 * Logic:
 * - If same session + same context_module + same day: UPDATE existing entry
 * - If different day OR different context_module: CREATE new entry
 */
export async function markSessionCompleted(
  userId: string,
  sessionId: string,
  minutesCompleted: number,
  contextModule?: string,
  date?: string
): Promise<{ success: boolean; error?: string; wasUpdate?: boolean; updatedEntryId?: string }> {
  try {
    const completedDate = date || new Date().toISOString().split('T')[0];
    // Normalize context_module: empty string or undefined becomes null, trim whitespace
    const contextModuleValue = contextModule && contextModule.trim() ? contextModule.trim() : null;
    
    console.log('💾 [markSessionCompleted] Processing session completion:', {
      userId,
      sessionId,
      minutesCompleted,
      contextModule: contextModuleValue,
      completedDate,
    });

    // Debug: Check all entries for this session+date to see what's in the database
    const { data: allEntries } = await supabase
      .from('completed_sessions')
      .select('id, context_module, completed_date, minutes_completed')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .eq('completed_date', completedDate);
    
    console.log('🔍 [markSessionCompleted] All existing entries for this session+date:', allEntries);

    // Check if there's an existing entry with same session + context_module + date
    const existingEntry = await findExistingCompletionByContext(
      userId,
      sessionId,
      contextModuleValue,
      completedDate
    );
    
    console.log('🔍 [markSessionCompleted] Existing entry result:', existingEntry);

    if (existingEntry) {
      // Same session + same context_module + same day: UPDATE existing entry
      // Use upsert approach since RLS might block direct updates
      console.log('🔄 [markSessionCompleted] Upserting existing entry (same context_module + same day)', {
        entryId: existingEntry.id,
        newMinutesCompleted: minutesCompleted,
        oldMinutesCompleted: allEntries?.find(e => e.id === existingEntry.id)?.minutes_completed,
      });
      
      // Use upsert with conflict resolution on unique constraint
      // This works better with RLS policies than direct UPDATE
      const { data: upsertData, error: upsertError } = await supabase
        .from('completed_sessions')
        .upsert({
          id: existingEntry.id, // Include ID to update existing row
          user_id: userId,
          session_id: sessionId,
          context_module: contextModuleValue,
          completed_date: completedDate,
          minutes_completed: minutesCompleted,
          created_at: new Date().toISOString(), // Update timestamp to move it up in activity history
        }, {
          onConflict: 'id', // Conflict on ID to update existing row
          ignoreDuplicates: false,
        })
        .select();

      if (upsertError) {
        console.error('❌ [markSessionCompleted] Error upserting session:', upsertError);
        console.error('❌ [markSessionCompleted] Upsert error details:', {
          code: upsertError.code,
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint,
        });
        
        // Fallback: Delete and re-insert (works if RLS allows DELETE and INSERT)
        console.log('🔄 [markSessionCompleted] Trying delete + insert as fallback...');
        
        // First delete the old entry
        const { data: deleteData, error: deleteError, count: deleteCount } = await supabase
          .from('completed_sessions')
          .delete()
          .eq('id', existingEntry.id)
          .select(); // Select to see what was deleted

        if (deleteError) {
          console.error('❌ [markSessionCompleted] Delete failed:', deleteError);
          return { success: false, error: deleteError.message || upsertError.message };
        }

        if (!deleteData || deleteData.length === 0) {
          console.error('❌ [markSessionCompleted] Delete returned no rows - RLS may have blocked deletion');
          return { success: false, error: 'Delete blocked by RLS policy' };
        }

        console.log('✅ [markSessionCompleted] Old entry deleted successfully:', {
          deletedEntry: deleteData[0],
          deletedId: existingEntry.id,
        });
        
        // Then insert the new entry with updated values
        const { data: insertData, error: insertError } = await supabase
          .from('completed_sessions')
          .insert({
            user_id: userId,
            session_id: sessionId,
            context_module: contextModuleValue,
            completed_date: completedDate,
            minutes_completed: minutesCompleted,
            created_at: new Date().toISOString(), // New timestamp to move it up in activity history
          })
          .select();
        
        if (insertError) {
          console.error('❌ [markSessionCompleted] Insert after delete failed:', insertError);
          return { success: false, error: insertError.message };
        }
        
        console.log('✅ [markSessionCompleted] Session completion updated via delete+insert method', {
          updatedEntry: insertData?.[0],
        });
        return { success: true, wasUpdate: true, updatedEntryId: insertData?.[0]?.id };
      }

      if (!upsertData || upsertData.length === 0) {
        console.error('❌ [markSessionCompleted] Upsert returned no rows');
        return { success: false, error: 'Upsert returned no rows' };
      }

      console.log('✅ [markSessionCompleted] Session completion upserted successfully', {
        updatedEntry: upsertData[0],
        oldMinutesCompleted: allEntries?.find(e => e.id === existingEntry.id)?.minutes_completed,
        newMinutesCompleted: minutesCompleted,
      });
      return { success: true, wasUpdate: true, updatedEntryId: upsertData[0]?.id };
    } else {
      // Different day OR different context_module: CREATE new entry
      console.log('➕ [markSessionCompleted] Creating new entry (different day or different context_module)');
      
      const { error: insertError } = await supabase
        .from('completed_sessions')
        .insert({
          user_id: userId,
          session_id: sessionId,
          context_module: contextModuleValue,
          completed_date: completedDate,
          minutes_completed: minutesCompleted,
        });

      if (insertError) {
        console.error('❌ [markSessionCompleted] Error inserting session:', insertError);
        console.error('❌ [markSessionCompleted] Error code:', insertError.code);
        console.error('❌ [markSessionCompleted] Error message:', insertError.message);
        return { success: false, error: insertError.message };
      }

      console.log('✅ [markSessionCompleted] Session completion inserted successfully');
      return { success: true, wasUpdate: false };
    }
  } catch (error: any) {
    console.error('❌ [markSessionCompleted] Exception:', error);
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
      .order('created_at', { ascending: false }); // Sort by created_at (timestamp) for most recent first

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
      created_at: session.created_at, // Include created_at for sorting
    }));
  } catch (error) {
    console.error('Error in getUserCompletedSessions:', error);
    return [];
  }
}

/**
 * Calculate current streak from completed sessions
 * Returns the number of consecutive days with at least one completed session
 * starting from today/yesterday going backwards
 */
export function calculateCurrentStreak(completedSessions: CompletedSession[]): number {
  if (completedSessions.length === 0) return 0;

  // Get unique dates (one entry per day is enough for streak)
  const uniqueDates = Array.from(
    new Set(completedSessions.map(s => s.completed_date))
  ).sort((a, b) => b.localeCompare(a)); // Sort descending (most recent first)

  if (uniqueDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Check if user completed a session today or yesterday
  // (allow 1 day gap for timezone/edge cases)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const mostRecentDate = uniqueDates[0];
  
  // If most recent session is more than 1 day ago, streak is broken
  if (mostRecentDate !== todayStr && mostRecentDate !== yesterdayStr) {
    return 0;
  }

  // Count consecutive days starting from most recent
  let streak = 0;
  let expectedDate = new Date(mostRecentDate);
  expectedDate.setHours(0, 0, 0, 0);

  for (const dateStr of uniqueDates) {
    const sessionDate = new Date(dateStr);
    sessionDate.setHours(0, 0, 0, 0);

    // Check if this date matches expected date (allowing for consecutive days)
    const daysDiff = Math.floor(
      (expectedDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (daysDiff > 0) {
      // Gap found, streak broken
      break;
    }
  }

  return streak;
}

/**
 * Calculate user streak from completed sessions
 */
export async function calculateUserStreak(userId: string): Promise<number> {
  try {
    // Fetch all completed sessions
    const allSessions = await getUserCompletedSessions(userId);
    
    // Calculate streak from completed sessions
    const streak = calculateCurrentStreak(allSessions);
    
    console.log(`🔥 [calculateUserStreak] Calculated streak: ${streak} days`);
    
    return streak;
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
      created_at: session.created_at,
    }));
  } catch (error) {
    console.error('Error in getCompletedSessionsByDateRange:', error);
    return [];
  }
}

