import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

export async function GET() {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json(
        { error: 'Google Drive OAuth credentials are not fully configured' },
        { status: 500 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const tokenResponse = await oauth2Client.getAccessToken();
    const accessToken = tokenResponse.token;

    if (!accessToken) {
      throw new Error('Failed to retrieve access token from Google.');
    }

    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error('Failed to get access token:', error);
    return NextResponse.json({ error: error.message || 'Failed to get access token' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const MAX_SIZE = 500 * 1024 * 1024; // 500MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds the 500MB limit' }, { status: 400 });
    }

    // Check credentials
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const folderId = process.env.NEXT_PUBLIC_GDRIVE_FOLDER_ID;

    if (!clientId || !clientSecret || !refreshToken || !folderId) {
      return NextResponse.json(
        { error: 'Google Drive OAuth credentials are not fully configured in .env.local' },
        { status: 500 }
      );
    }

    // Setup Google OAuth2 Client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "https://developers.google.com/oauthplayground" // standard redirect URI for playground
    );

    // Set the refresh token
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Convert Web File to Node.js Readable Stream (Low memory streaming)
    const stream = Readable.from(file.stream());

    // Upload to Google Drive
    const driveResponse = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [folderId],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id',
    });

    const fileId = driveResponse.data.id;

    // Make the file publicly accessible (Anyone with link can view)
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Return our custom proxy URL so the gallery can bypass Google's block
    const photoUrl = `/api/image?id=${fileId}`;

    return NextResponse.json({ success: true, url: photoUrl, fileId });
  } catch (error) {
    console.error('Google Drive Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
