import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from "next/cache";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';


// Function to generate MD5 hash from file buffer
const generateMD5Hash = (buffer: Uint8Array): string => {
  const hash = crypto.createHash('md5');
  hash.update(buffer);
  return hash.digest('hex');
};


const writeFileAsync = (path: string, data: Uint8Array, encoding: string) => {
  return new Promise<string>((resolve, reject) => {
    // @ts-ignore
    fs.writeFile(path, data, encoding, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(path);
      }
    });
  });
};

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Generate the MD5 hash of the file content
    const fileHash = generateMD5Hash(buffer);

    // Construct the new file name with the MD5 hash
    const fileExtension = path.extname(file.name);  // Retain the original file extension
    const newFileName = `${fileHash}${fileExtension}`;

    const filePath = path.join(process.cwd(), '../../../images', newFileName);

    const savedFilePath = await writeFileAsync(filePath, buffer, 'utf8');

    const origin = req.headers.get("origin");

    // 返回文件路径
    return NextResponse.json({ status: "success", filePath: `${origin}/api_document/upload?file=${newFileName}` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ status: "fail", error: e });
  }
}

export function GET(req: NextRequest): Promise<NextResponse> {
  return new Promise((resolve, reject) => {
    try {
      // 从查询参数中获取文件名
      const { searchParams } = new URL(req.url);
      const fileName = searchParams.get('file');
      const Type = searchParams.get('type')??'images';

      if (!fileName) {
        resolve(NextResponse.json({ status: "fail", error: "File name is required." }, { status: 400 }));
        return;
      }


      const filePath = path.join(process.cwd(), '../../../images', fileName);

      fs.access(filePath, (err) => {
        if (err) {
          console.error('Error accessing file:', err);
          resolve(NextResponse.json({ status: "fail", error: "File not found." }, { status: 404 }));
          return;
        } else {

        }

        fs.readFile(filePath, (err, data) => {
          if (err) {
            console.error('Error reading file:', err);
            resolve(NextResponse.json({ status: "fail", error: "Could not read file.", details: err.message }, { status: 500 }));
            return;
          }


          // Determine content type based on file extension (you can expand this for other formats)
          const extname = path.extname(filePath).toLowerCase();
          let contentType = 'application/octet-stream';  // Default binary content type

          if (extname === '.jpg' || extname === '.jpeg') {
            contentType = 'image/jpeg';
          } else if (extname === '.png') {
            contentType = 'image/png';
          } else if (extname === '.gif') {
            contentType = 'image/gif';
          } else if (extname === '.webp') {
            contentType = 'image/webp';
          }

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
