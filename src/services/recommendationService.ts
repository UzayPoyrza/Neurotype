/**
 * Recommendation Service
 * Handles daily recommendations
 */

import { supabase } from './supabase';
import { getSessionsByModality, getAllSessions } from './sessionService';

export interface DailyRecommendation {
  id?: string;
  user_id: string;
  recommendation_date: string;
  session_id: string;
  module_id: string;
  is_recommended: boolean;
  display_order: number;
}

/**
 * Get today's recommendations for a user and module
 * Returns maximum of 4 recommendations
 */
export async function getDailyRecommendations(
  userId: string,
  moduleId: string,
  date?: string
): Promise<DailyRecommendation[]> {
  try {
    const recommendationDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .eq('recommendation_date', recommendationDate)
      .order('display_order', { ascending: true })
      .limit(4); // Limit to exactly 4 recommendations

    if (error) {
      console.error('Error fetching daily recommendations:', error);
      return [];
    }

    const recommendations = (data || []).map(rec => ({
      id: rec.id,
      user_id: rec.user_id,
      recommendation_date: rec.recommendation_date,
      session_id: rec.session_id,
      module_id: rec.module_id,
      is_recommended: rec.is_recommended,
      display_order: rec.display_order,
    }));

    // Log if we have more than 4 (shouldn't happen with limit, but just in case)
    if (recommendations.length > 4) {
      console.warn('⚠️ [Recommendations] Found more than 4 recommendations, limiting to 4');
      return recommendations.slice(0, 4);
    }

    return recommendations;
  } catch (error) {
    console.error('Error in getDailyRecommendations:', error);
    return [];
  }
}

/**
 * Check if recommendations exist for a date
 */
export async function recommendationsExistForDate(
  userId: string,
  date: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('daily_recommendations')
      .select('id')
      .eq('user_id', userId)
      .eq('recommendation_date', date)
      .limit(1);

    if (error) {
      console.error('Error checking recommendations:', error);
      return false;
    }

    return (data || []).length > 0;
  } catch (error) {
    console.error('Error in recommendationsExistForDate:', error);
    return false;
  }
}

/**
 * Check if valid recommendations exist for today for a specific module (4 recommendations with 1 recommended)
 */
export async function validRecommendationsExistForToday(
  userId: string,
  moduleId: string
): Promise<{ exists: boolean; date?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_recommendations')
      .select('recommendation_date, is_recommended')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .eq('recommendation_date', today)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error checking valid recommendations:', error);
      return { exists: false };
    }

    if (!data || data.length === 0) {
      return { exists: false };
    }

    // Check if we have exactly 4 recommendations with 1 being recommended
    const hasRecommended = data.some(rec => rec.is_recommended === true);
    const count = data.length;
    const recommendedCount = data.filter(rec => rec.is_recommended === true).length;

    console.log(`🔍 [Recommendations] Validation check for module ${moduleId}: count=${count}, hasRecommended=${hasRecommended}, recommendedCount=${recommendedCount}`);

    // Must have exactly 4 recommendations with exactly 1 being recommended
    if (count === 4 && hasRecommended && recommendedCount === 1) {
      console.log('✅ [Recommendations] Valid recommendations found (4 total, 1 recommended)');
      return { exists: true, date: today };
    }

    // If recommendations exist but don't meet criteria, return the date so we can regenerate
    if (count > 0) {
      console.log(`⚠️ [Recommendations] Invalid recommendations found: count=${count}, recommendedCount=${recommendedCount}. Will regenerate.`);
    }
    return { exists: false, date: data[0]?.recommendation_date };
  } catch (error) {
    console.error('Error in validRecommendationsExistForToday:', error);
    return { exists: false };
  }
}

/**
 * Save recommendations (used by backend recommendation algorithm)
 * Note: This uses service_role key in backend, not anon key
 */
export async function saveRecommendations(
  userId: string,
  moduleId: string,
  date: string,
  recommendations: { session_id: string; is_recommended: boolean; display_order: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const insertData = recommendations.map(rec => ({
      user_id: userId,
      module_id: moduleId,
      recommendation_date: date,
      ...rec,
    }));

    const { error } = await supabase
      .from('daily_recommendations')
      .upsert(insertData, {
        onConflict: 'user_id,module_id,recommendation_date,session_id',
      });

    if (error) {
      console.error('Error saving recommendations:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in saveRecommendations:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate placeholder recommendations (4 random sessions, 1 marked as recommended)
 * This is a placeholder until the real recommendation algorithm is implemented
 */
export async function generatePlaceholderRecommendations(
  userId: string,
  moduleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🎲 [Recommendations] Generating placeholder recommendations for module:', moduleId);
    
    // Get sessions for the module
    const moduleSessions = await getSessionsByModality(moduleId);
    
    // If not enough sessions for this module, get all sessions as fallback
    let availableSessions = moduleSessions;
    if (moduleSessions.length < 4) {
      console.log('⚠️ [Recommendations] Not enough sessions for module, using all sessions');
      const allSessions = await getAllSessions();
      availableSessions = allSessions;
    }
    
    if (availableSessions.length === 0) {
      console.error('❌ [Recommendations] No sessions available');
      return { success: false, error: 'No sessions available' };
    }
    
    // Shuffle and pick 4 random sessions
    const shuffled = [...availableSessions].sort(() => Math.random() - 0.5);
    const selectedSessions = shuffled.slice(0, 4);
    
    console.log('🎲 [Recommendations] Selected sessions:', selectedSessions.map(s => s.title));
    
    // Create recommendations: first one is recommended, others are alternatives
    const today = new Date().toISOString().split('T')[0];
    const recommendations = selectedSessions.map((session, index) => ({
      session_id: session.id,
      is_recommended: index === 0, // First one is recommended
      display_order: index + 1,
    }));
    
    console.log('💾 [Recommendations] Saving recommendations to database...');
    const result = await saveRecommendations(userId, moduleId, today, recommendations);
    
    if (result.success) {
      console.log('✅ [Recommendations] Recommendations saved successfully');
      console.log('📋 [Recommendations] Recommended session:', selectedSessions[0].title);
      console.log('📋 [Recommendations] Alternative sessions:', selectedSessions.slice(1).map(s => s.title).join(', '));
    } else {
      console.error('❌ [Recommendations] Failed to save recommendations:', result.error);
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ [Recommendations] Error generating recommendations:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Ensure recommendations exist for today
 * Checks if valid recommendations exist, and generates them if needed
 * @param forceRegenerate - If true, regenerate recommendations even if they exist for today (used when module changes)
 */
export async function ensureDailyRecommendations(
  userId: string,
  moduleId: string,
  forceRegenerate: boolean = false
): Promise<{ success: boolean; generated: boolean; error?: string }> {
  try {
    console.log('🔍 [Recommendations] Checking if recommendations exist for today...');
    console.log('🔍 [Recommendations] Module:', moduleId, 'Force regenerate:', forceRegenerate);
    
    const checkResult = await validRecommendationsExistForToday(userId, moduleId);
    const today = new Date().toISOString().split('T')[0];
    
    // If recommendations exist for today and we're not forcing regeneration, return early
    if (!forceRegenerate && checkResult.exists && checkResult.date === today) {
      console.log('✅ [Recommendations] Valid recommendations already exist for today for module:', moduleId);
      return { success: true, generated: false };
    }
    
    // Need to generate new recommendations
    console.log('🔄 [Recommendations] Generating new recommendations for module:', moduleId);
    
    // Delete old recommendations for today and this module if they exist
    // Always delete if we're going to regenerate (either invalid existing ones or force regenerate)
    if (checkResult.date === today || forceRegenerate || !checkResult.exists) {
      console.log('🗑️ [Recommendations] Removing old recommendations for today and module:', moduleId);
      const { error: deleteError } = await supabase
        .from('daily_recommendations')
        .delete()
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .eq('recommendation_date', today);
      
      if (deleteError) {
        console.error('⚠️ [Recommendations] Error deleting old recommendations:', deleteError);
      } else {
        console.log('✅ [Recommendations] Old recommendations deleted successfully');
      }
    }
    
    // Generate new recommendations
    const result = await generatePlaceholderRecommendations(userId, moduleId);
    
    return {
      success: result.success,
      generated: true,
      error: result.error,
    };
  } catch (error: any) {
    console.error('❌ [Recommendations] Error ensuring recommendations:', error);
    return { success: false, generated: false, error: error.message };
  }
}

