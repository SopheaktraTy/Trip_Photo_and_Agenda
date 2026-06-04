import { NextResponse } from 'next/server';
import { google } from 'googleapis';

/**
 * GET /api/upload?filename=xxx&mimeType=yyy
 *
 * 1. Exchanges refresh token → access token (server-side, secrets never leave server)
 * 2. Initiates a Google Drive resumable upload session server-side
 * 3. Returns { uploadUrl, accessToken } to the browser
 *
 * The browser then PUT the file directly to `uploadUrl` — bypassing Vercel's
 * 4.5 MB serverless body limit entirely.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const mimeType = searchParams.get('mimeType') || 'application/octet-stream';

    const clientId     = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const folderId     = process.env.NEXT_PUBLIC_GDRIVE_FOLDER_ID;

    if (!clientId || !clientSecret || !refreshToken || !folderId) {
      return NextResponse.json(
        { error: 'Google Drive OAuth credentials are not fully configured' },
        { status: 500 }
      );
    }

    // --- 1. Get access token ---
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { token: accessToken } = await oauth2Client.getAccessToken();
    if (!accessToken) throw new Error('Failed to retrieve access token from Google.');

    // --- 2. Initiate resumable upload session (server-side, no CORS issue) ---
    const initiateRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': mimeType,
        },
        body: JSON.stringify({
          name: filename || 'upload',
          parents: [folderId],
        }),
      }
    );

    if (!initiateRes.ok) {
      const errorText = await initiateRes.text();
      throw new Error(`Google Drive session initiation failed: ${errorText}`);
    }

    const uploadUrl = initiateRes.headers.get('Location');
    if (!uploadUrl) throw new Error('No upload URL returned from Google Drive.');

    // Return uploadUrl + accessToken so the client can upload the file directly
    // and then set permissions afterwards.
    return NextResponse.json({ uploadUrl, accessToken });
  } catch (error) {
    console.error('Upload session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create upload session' },
      { status: 500 }
    );
  }
}
