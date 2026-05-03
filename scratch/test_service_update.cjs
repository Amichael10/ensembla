
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing channel_videos update with SERVICE_ROLE_KEY...');
  const { data: vids, error: fetchErr } = await supabase
    .from('channel_videos')
    .select('id, title, is_hidden')
    .limit(1);
    
  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }
  
  if (vids.length === 0) {
    console.log('No videos found');
    return;
  }
  
  const v = vids[0];
  console.log(`Initial state: id=${v.id}, title=${v.title}, is_hidden=${v.is_hidden}`);
  
  const { error: updateErr } = await supabase
    .from('channel_videos')
    .update({ is_hidden: !v.is_hidden })
    .eq('id', v.id);
    
  if (updateErr) {
    console.error('Update error:', updateErr);
  } else {
    console.log('Update successful');
    const { data: v2 } = await supabase
      .from('channel_videos')
      .select('is_hidden')
      .eq('id', v.id)
      .single();
    console.log(`New state: is_hidden=${v2.is_hidden}`);
  }
}

test();
