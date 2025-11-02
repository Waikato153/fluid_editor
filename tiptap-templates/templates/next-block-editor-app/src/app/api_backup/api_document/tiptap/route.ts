import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';


export async function POST(req: NextRequest) {
  const content = await req.text();


  if (!content) {
    return NextResponse.json({ error: 'No content provided' }, { status: 400 });
  }

  // @ts-ignore
  const headersList = req.headers;

  const authstring = req.headers.get('authorization');



   try {

     const baseUrl = process.env.NEXT_PUBLIC_PHP_API_BASE_URL;
     const phpApiUrl = `${baseUrl}editor/save_tiptap`;


    const response = await fetch(phpApiUrl, {
      method: 'POST',
      // @ts-ignore
      headers: {
        'Content-Type': 'text/html',
        'Authorization': authstring,
      },
      body: content,
    });


    if (!response.ok) {
      throw new Error(`PHP API returned an error: ${response.statusText}`);
    }

     const data = await response.json();

     return NextResponse.json(data, { status: 200 });


  } catch (error) {
    console.error('file save error:' + error);
    return NextResponse.json({ error: error}, { status: 500 });
  }
}


export function GET(req: NextRequest): Promise<NextResponse> {
  return new Promise((resolve, reject) => {
    try {
      const { searchParams } = new URL(req.url);
      const fileName = searchParams.get('file');

      if (!fileName) {
        resolve(NextResponse.json({ status: "fail", error: "File name is required." }, { status: 400 }));
        return;
      }


      const filePath = path.join(process.cwd(), '../../../upload/', fileName);

      fs.access(filePath, (err) => {
        if (err) {
          console.error('Error accessing file:', err);
          resolve(NextResponse.json({ status: "fail", error: "File not found." }, { status: 404 }));
          return;
        } else {
          console.log('File exists and is accessible.');
        }

        fs.readFile(filePath, (err, data) => {
          if (err) {
            console.error('Error reading file:', err);
            resolve(NextResponse.json({ status: "fail", error: "Could not read file.", details: err.message }, { status: 500 }));
            return;
          }
          console.log('File content read successfully.');

          // Determine content type based on file extension (you can expand this for other formats)
          const extname = path.extname(filePath).toLowerCase();
          let contentType = 'application/pdf';


          // Return image as response with proper content type
          resolve(
            new NextResponse(data, {
              status: 200,
              headers: {
                'Content-Type': contentType,  // Set the correct content type for the image
              },
            })
          );
        });
      });

    } catch (error) {
      if (error instanceof  Error) {
        reject(NextResponse.json(
          { status: "fail", error: "An unexpected error occurred.", details: error.message || "Unknown error" },
          { status: 500 }
        ));
      } else {
        reject(NextResponse.json(
          { status: "fail", error: "An unexpected error occurred.", details: "Unknown error" },
          { status: 500 }
        ));
      }



    }
  });
}
