import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL and Anon Key are not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Custom storage adapter for React Native using Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`❌ Error getting item from SecureStore (${key}):`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      // Check size warning but still try to store
      if (value.length > 2048) {
        console.warn(`⚠️ Large value (${value.length} bytes) being stored in SecureStore for key: ${key}`);
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`❌ Error setting item in SecureStore (${key}, ${value.length} bytes):`, error);
      throw error; // Re-throw so Supabase knows storage failed
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`❌ Error removing item from SecureStore (${key}):`, error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});