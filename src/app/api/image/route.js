import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse('Missing image ID', { status: 400 });
  }

  try {
    // We fetch the public Google Drive file
    // By doing this server-side, we bypass Google's strict browser cookie/CORS blocks!
    const response = await fetch(`https://drive.google.com/uc?export=view&id=${id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow', // Follow the 302 redirects automatically
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from Google Drive: ${response.statusText}`);
    }

    // Get the raw image bytes
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return the bytes as a proper image file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        // Cache for 1 year so we don't spam Google Drive
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}
