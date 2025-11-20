/**
 * Recommendation Service
 * Handles daily recommendations
 */

import { supabase } from './supabase';

export interface DailyRecommendation {
  id?: string;
  user_id: string;
  recommendation_date: string;
  session_id: string;
  is_recommended: boolean;
  display_order: number;
}

/**
 * Get today's recommendations for a user
 */
export async function getDailyRecommendations(
  userId: string,
  date?: string
): Promise<DailyRecommendation[]> {
  try {
    const recommendationDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('recommendation_date', recommendationDate)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching daily recommendations:', error);
      return [];
    }

    return (data || []).map(rec => ({
      id: rec.id,
      user_id: rec.user_id,
      recommendation_date: rec.recommendation_date,
      session_id: rec.session_id,
      is_recommended: rec.is_recommended,
      display_order: rec.display_order,
    }));
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
 * Save recommendations (used by backend recommendation algorithm)
 * Note: This uses service_role key in backend, not anon key
 */
export async function saveRecommendations(
  userId: string,
  date: string,
  recommendations: { session_id: string; is_recommended: boolean; display_order: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const insertData = recommendations.map(rec => ({
      user_id: userId,
      recommendation_date: date,
      ...rec,
    }));

    const { error } = await supabase
      .from('daily_recommendations')
      .upsert(insertData, {
        onConflict: 'user_id,recommendation_date,session_id',
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

