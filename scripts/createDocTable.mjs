import { createClient } from '@insforge/sdk';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('.insforge/project.json', 'utf-8'));
const client = createClient({
  baseUrl: config.oss_host,
  anonKey: config.api_key
});

async function main() {
  // Try to create the table by inserting a dummy row first
  // If table doesn't exist, we'll get an error
  const { error: checkErr } = await client.database
    .from('MemberDocument')
    .select('id')
    .limit(1);

  if (checkErr) {
    console.log('MemberDocument table does not exist yet.');
    console.log('ERROR:', checkErr.message);
    console.log('');
    console.log('Please create it manually in your InsForge/Supabase dashboard:');
    console.log('Table name: MemberDocument');
    console.log('Columns:');
    console.log('  - id: UUID (primary key, default: gen_random_uuid())');
    console.log('  - memberId: UUID (required)');
    console.log('  - fileName: TEXT (required)');
    console.log('  - fileUrl: TEXT (required)');
    console.log('  - fileKey: TEXT (required)');
    console.log('  - fileSize: INT (default: 0)');
    console.log('  - createdAt: TIMESTAMPTZ (default: now())');
  } else {
    console.log('MemberDocument table already exists!');
  }
}

main().catch(console.error);
