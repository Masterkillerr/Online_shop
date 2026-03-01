// js/supabase-test.js
// Simple script to verify Supabase connection
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('producto') // replace with an existing table if needed
            .select('id')
            .limit(1);
        if (error) {
            console.error('❌ Supabase connection error:', error.message);
        } else {
            console.log('✅ Supabase connection successful. Sample data:', data);
        }
    } catch (e) {
        console.error('❌ Unexpected error while testing Supabase:', e);
    }
}

testConnection();
