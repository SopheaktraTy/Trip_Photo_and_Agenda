import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse('Missing image ID', { status: 400 });
  }

  // Forward any Range header from the browser (critical for video on iOS Safari)
  const rangeHeader = request.headers.get('range');

  const fetchHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };
  if (rangeHeader) {
    fetchHeaders['Range'] = rangeHeader;
  }

  try {
    const response = await fetch(`https://drive.google.com/uc?export=view&id=${id}`, {
      headers: fetchHeaders,
      redirect: 'follow',
    });

    if (!response.ok && response.status !== 206) {
      throw new Error(`Failed to fetch from Google Drive: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentRange = response.headers.get('content-range');
    const acceptRanges = response.headers.get('accept-ranges') || 'bytes';

    // Build response headers
    const headers = {
      'Content-Type': contentType,
      'Accept-Ranges': acceptRanges,
      'Cache-Control': 'public, max-age=31536000, immutable',
    };

    if (contentRange) {
      headers['Content-Range'] = contentRange;
    }
    if (buffer.length) {
      headers['Content-Length'] = String(buffer.length);
    }

    // 206 Partial Content for range requests, 200 for full
    const status = rangeHeader && contentRange ? 206 : 200;

    return new NextResponse(buffer, { status, headers });
  } catch (error) {
    console.error('Proxy Error:', error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}
