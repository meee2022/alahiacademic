import { createClient } from '@insforge/sdk';
import { readFileSync } from 'fs';

const projectConfig = JSON.parse(readFileSync('.insforge/project.json', 'utf-8'));
const client = createClient({
  baseUrl: projectConfig.oss_host,
  anonKey: projectConfig.api_key
});

async function checkColumns() {
  console.log('Checking Member table columns...');
  try {
    const { data, error } = await client.database.from('Member').select('*').limit(1);
    if (error) {
      console.log('Error selecting member:', error.message);
    } else if (data && data.length > 0) {
      console.log('Member fields found:', Object.keys(data[0]));
      if (Object.keys(data[0]).includes('nationalId')) {
        console.log('nationalId column EXISTS!');
      } else {
        console.log('nationalId column DOES NOT EXIST.');
      }
    } else {
      console.log('No members found to check columns, but table exists.');
    }
  } catch (err) {
    console.error('Column check failed:', err);
  }
}

checkColumns();
