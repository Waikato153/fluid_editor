import jsonwebtoken from 'jsonwebtoken'
import {NextRequest, NextResponse} from "next/server";
import { getCurrentAppConfig } from '@/lib/config';

export async function POST(req: NextRequest): Promise<Response> {
  const authString = req.headers.get('authorization');
  if (!authString) {
    return NextResponse.json(
      { status: "fail", error: "Authorization header is required." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const appId = searchParams.get('appId') || 'default';

  const config = getCurrentAppConfig(appId);

  console.log('Received auth string:', authString);
  console.log('Using app config:', appId, config.name);

  try {
    // Parse Basic authentication header
    const base64Credentials = authString.replace('Basic ', '');
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');

    // Separate JWT token from ":jwt" suffix
    const [jwtToken] = credentials.split(':jwt');

    if (!jwtToken) {
      throw new Error('Invalid JWT token format');
    }

    // Directly parse JWT token (using PHP secret key)
    const PHP_JWT_SECRET = process.env?.PHP_JWT_SECRET || 'example';
    const decoded = jsonwebtoken.verify(jwtToken, PHP_JWT_SECRET, { algorithms: ['HS256'] }) as any;

    // Extract user ID - based on your PHP JWT structure, it might be the uid field
    const userId = decoded.uid || decoded.sub || decoded.id;

    if (!userId) {
      return NextResponse.json(
        { status: "fail", error: "User ID not found in JWT token." },
        { status: 400 }
      );
    }

    // Use the app-specific collab secret
    const JWT_SECRET = config.collabSecret || process.env?.TIPTAP_COLLAB_SECRET;

    if (!JWT_SECRET) {
      return new Response(
        JSON.stringify({ error: 'No collaboration token provided, please set TIPTAP_COLLAB_SECRET in your environment' }),
        { status: 403 },
      )
    }

    // Generate collaboration JWT token
    const jwt = await jsonwebtoken.sign(
      {
        'sub': userId, // Use the extracted user ID
      },
      JWT_SECRET,
    )

    return new Response(JSON.stringify({ token: jwt }))

  } catch (error) {
    console.error('JWT verification error:', error);
    console.log('Falling back to PHP API verification...');

    // If JWT parsing fails, fallback to the original PHP API call method
    const baseUrl = process.env.NEXT_PUBLIC_PHP_API_BASE_URL;
    const phpApiUrl = `${baseUrl}editor/userinfo`;
    const response = await fetch(phpApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/html',
        'Authorization': authString,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { status: "fail", error: "Failed to fetch data.", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    if (!data || !data.id) {
      return NextResponse.json(
        { status: "fail", error: "Invalid user data received from the server. Please ensure you are logged in." },
        { status: 400 }
      );
    }

    const JWT_SECRET = config.collabSecret || process.env?.TIPTAP_COLLAB_SECRET;

    if (!JWT_SECRET) {
      return new Response(
        JSON.stringify({ error: 'No collaboration token provided, please set TIPTAP_COLLAB_SECRET in your environment' }),
        { status: 403 },
      )
    }

    const jwt = await jsonwebtoken.sign(
      {
        'sub': data.id, // user ID from the server
      },
      JWT_SECRET,
    )

    return new Response(JSON.stringify({ token: jwt }))
  }
}
