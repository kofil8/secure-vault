import { oAuth2Client } from './googleAuth';
import { google } from 'googleapis';

// Get the Google OAuth2 URL for user authentication
export const getAuthUrl = () => {
  const scopes = [
    'https://www.googleapis.com/auth/documents', // Scope for Google Docs
    'https://www.googleapis.com/auth/spreadsheets', // Scope for Google Sheets
  ];

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });

  return authUrl;
};
