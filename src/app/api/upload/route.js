import { NextResponse } from 'next/server';

/**
 * Edge Runtime — no 4.5 MB body-size limit, no CORS issues.
 *
 * POST /api/upload?filename=xxx&mimeType=yyy
 *   Accepts raw binary file as the request body.
 *   Creates a Google Drive resumable-upload session server-side,
 *   pipes the file to Google Drive, sets it public, then returns
 *   { url, fileId }.
 */
export const runtime = 'edge';

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID     || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN || '',
      grant_type:    'refresh_token',
    }),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error('Failed to get Google access token: ' + JSON.stringify(data));
  }
  return data.access_token;
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'upload';
    const mimeType = searchParams.get('mimeType') || 'application/octet-stream';
    const folderId = process.env.NEXT_PUBLIC_GDRIVE_FOLDER_ID;

    // Validate env
    if (
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET ||
      !process.env.GOOGLE_REFRESH_TOKEN ||
      !folderId
    ) {
      return NextResponse.json(
        { error: 'Google Drive credentials are not configured on the server.' },
        { status: 500 }
      );
    }

    // 1. Exchange refresh token for access token (server-side, secrets safe)
    const accessToken = await getAccessToken();

    // 2. Read the raw file body
    const fileBuffer = await request.arrayBuffer();
    const fileSize = fileBuffer.byteLength;

    // 3. Initiate a Google Drive resumable upload session (server-side → no CORS)
    const sessionRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id',
      {
        method: 'POST',
        headers: {
          Authorization:            `Bearer ${accessToken}`,
          'Content-Type':           'application/json; charset=UTF-8',
          'X-Upload-Content-Type':  mimeType,
          'X-Upload-Content-Length': String(fileSize),
        },
        body: JSON.stringify({ name: filename, parents: [folderId] }),
      }
    );

    if (!sessionRes.ok) {
      const errText = await sessionRes.text();
      throw new Error(`Google Drive session creation failed: ${errText}`);
    }

    const uploadUrl = sessionRes.headers.get('Location');
    if (!uploadUrl) throw new Error('Google Drive did not return an upload URL.');

    // 4. Upload the file to Google Drive (server-side → no CORS)
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type':   mimeType,
        'Content-Length': String(fileSize),
      },
      body: fileBuffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Google Drive upload failed (${uploadRes.status}): ${errText}`);
    }

    const driveData = await uploadRes.json();
    const fileId = driveData.id;
    if (!fileId) throw new Error('Google Drive did not return a file ID.');

    // 5. Make the file publicly readable
    const permRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
      }
    );
    if (!permRes.ok) {
      console.warn('Could not set public permission:', await permRes.text());
    }

    // 6. Return the proxy URL (our /api/image route bypasses Google's viewer block)
    return NextResponse.json({
      success: true,
      url: `/api/image?id=${fileId}`,
      fileId,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
