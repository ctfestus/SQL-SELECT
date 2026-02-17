import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oxksmvkuimqvagazbove.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94a3Ntdmt1aW1xdmFnYXpib3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDAwMjIsImV4cCI6MjA4NTk3NjAyMn0._eQtbdKfQGjub2-tU9qh4rYIMHMVYWUd2Kdn-gmRKAQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);