import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import fs from 'fs';

// Correctly reference the path to the credentials file
const credentialsPath = path.resolve(__dirname, 'credentials.json');

// Read and parse the credentials JSON file
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

// Set up OAuth2Client using the loaded credentials
const oAuth2Client = new OAuth2Client(
  credentials.web.client_id,
  credentials.web.client_secret,
  credentials.web.redirect_uris[0], // Redirect URI as specified in your credentials
);

// Now the oAuth2Client can be used for further Google API interaction
export { oAuth2Client };
