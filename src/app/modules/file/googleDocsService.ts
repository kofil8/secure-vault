import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Request } from 'express';

// Initialize the Google Docs API client
const docs = google.docs('v1');

// Function to create a new document
const createGoogleDoc = async (auth: OAuth2Client) => {
  try {
    const response = await docs.documents.create({
      auth,
    });

    // The created document ID and other details
    return response.data;
  } catch (error) {
    throw new Error('Error creating Google Doc');
  }
};

// Function to update content in a document
const updateGoogleDoc = async (
  docId: string,
  auth: OAuth2Client,
  content: string,
) => {
  try {
    const response = await docs.documents.batchUpdate({
      auth,
      documentId: docId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content,
            },
          },
        ],
      },
    });

    return response.data;
  } catch (error) {
    throw new Error('Error updating Google Doc');
  }
};

export const googleDocsService = {
  createGoogleDoc,
  updateGoogleDoc,
};
