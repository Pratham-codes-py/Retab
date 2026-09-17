import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
  console.log("Checking if check_staff_exists function exists...");
  
  const { data, error } = await supabase.rpc('check_staff_exists', {
    p_user_id: '00000000-0000-0000-0000-000000000000',
    p_cafe_id: '00000000-0000-0000-0000-000000000000'
  });
  
  if (error) {
    console.error("RPC Error:", error.message, error.details, error.hint);
  } else {
    console.log("RPC Data:", data);
  }
}

testRpc();
