import { createClient } from '@insforge/sdk';
import { readFileSync } from 'fs';

const projectConfig = JSON.parse(readFileSync('.insforge/project.json', 'utf-8'));
const client = createClient({
  baseUrl: projectConfig.oss_host,
  anonKey: projectConfig.api_key
});

async function checkStorage() {
  console.log('Checking storage bucket "members-docs"...');
  try {
    // There is no listBuckets in @insforge/sdk yet, but we can try to upload a tiny dummy file or just check if we can list files (if it exists)
    // Actually, let's just try to see if we get a 404 when trying to interact with it.
    const { data, error } = await client.storage.from('members-docs').list('');
    if (error) {
      console.log('Error listing bucket:', error.message);
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log('BUCKET "members-docs" DOES NOT EXIST.');
      }
    } else {
      console.log('Bucket "members-docs" exists!');
    }
  } catch (err) {
    console.error('Storage check failed:', err);
  }
}

checkStorage();
