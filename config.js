// config.js — שומרים
const SUPABASE_URL = 'https://fsvyryhtnogzyycijukp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdnlyeWh0bm9nenl5Y2lqdWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzA3MjQsImV4cCI6MjA4ODc0NjcyNH0.l2JD0pJ6CgCveN1aZUoWxN16eRoWl19ZWNx8GVXJZqk';

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ROLES = { CHILD: 'child', PARENT: 'parent' };
const URGENCY = { LOW: 'low', HIGH: 'high', CRITICAL: 'critical' };
const STATUS = { OPEN: 'open', HANDLED: 'handled', ESCALATED: 'escalated' };
const SESSION_KEY = 'shomrim_sess';

const EMERGENCY_NUMBERS = { police: '100', ambulance: '101', fire: '102' };
