import jsonwebtoken from 'jsonwebtoken'
import {NextRequest, NextResponse} from "next/server";

const JWT_SECRET = process.env?.TIPTAP_COLLAB_SECRET

export async function POST(req: NextRequest): Promise<Response> {


  const authString = req.headers.get('authorization');
  if (!authString) {
    return NextResponse.json(
      { status: "fail", error: "Authorization header is required." },
      { status: 401 }
    );
  }

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


  if (!JWT_SECRET) {
    return new Response(
      JSON.stringify({ error: 'No collaboration token provided, please set TIPTAP_COLLAB_SECRET in your environment' }),
      { status: 403 },
    )
  }
  const jwt = await jsonwebtoken.sign(
    {
      /* object to be encoded in the JWT */
      'sub': data.id, // user ID from the server
    },
    JWT_SECRET,
  )

  return new Response(JSON.stringify({ token: jwt }))
}
