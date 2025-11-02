import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { status: "fail", error: "snapshot is required." },
        { status: 400 }
      );
    }

    const authString = req.headers.get('authorization');
    if (!authString) {
      return NextResponse.json(
        { status: "fail", error: "Authorization header is required." },
        { status: 401 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_PHP_API_BASE_URL;
    const phpApiUrl = `${baseUrl}editor/snapshotdetail/${id}`;

    console.log(phpApiUrl)

    const response = await fetch(phpApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/html',
        'Authorization': authString,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(response
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { status: "fail", error: "Unexpected error.", details: error.message },
      { status: 500 }
    );
  }
}
