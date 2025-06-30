import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Request } from 'express';

// Initialize the Google Sheets API client
const sheets = google.sheets('v4');

// Function to create a new Google Sheet
const createGoogleSheet = async (auth: OAuth2Client) => {
  try {
    const response = await sheets.spreadsheets.create({
      auth,
      requestBody: {
        properties: {
          title: 'New Spreadsheet',
        },
      },
    });

    return response.data;
  } catch (error) {
    throw new Error('Error creating Google Sheet');
  }
};

// Function to add data to a Google Sheet
const updateGoogleSheet = async (
  sheetId: string,
  auth: OAuth2Client,
  range: string,
  values: string[][],
) => {
  try {
    const response = await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: sheetId,
      range: range,
      valueInputOption: 'RAW',
      requestBody: {
        values: values,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error('Error updating Google Sheet');
  }
};

export const googleSheetsService = {
  createGoogleSheet,
  updateGoogleSheet,
};
