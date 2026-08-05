import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://owgmqbetyzfgowhcpbwi.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Z21xYmV0eXpmZ293aGNwYndpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2OTkxNzYsImV4cCI6MjEwMTI3NTE3Nn0.rCoVo2MRA28LsW7EEg4HNmYIjFyFZb9A3pFJ4NvI2pw';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});