import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

import { PDFDocument } from 'pdf-lib';

const mergePDFs = async (pdfBlob1: Blob, pdfBlob2: Blob): Promise<Blob> => {
  const pdfDoc1 = await PDFDocument.load(await pdfBlob1.arrayBuffer());
  const pdfDoc2 = await PDFDocument.load(await pdfBlob2.arrayBuffer());

  const mergedPdf = await PDFDocument.create();


  const copiedPages1 = await mergedPdf.copyPages(pdfDoc1, pdfDoc1.getPageIndices());
  copiedPages1.forEach((page) => mergedPdf.addPage(page));


  const copiedPages2 = await mergedPdf.copyPages(pdfDoc2, pdfDoc2.getPageIndices());
  copiedPages2.forEach((page) => mergedPdf.addPage(page));

  const mergedPdfBytes = await mergedPdf.save();
  return new Blob([mergedPdfBytes], { type: 'application/pdf' });
};


function md5Encrypt(input: string) {
  return crypto.createHash('md5').update(input).digest('hex');
}

const writeFileAsync = (path: string, data: string, encoding: string) => {
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

const savePDf = async (content: string, room: string, authstring: string) => {


}

export async function POST(req: NextRequest) {

  const contentRaw = await req.text();


  if (!contentRaw) {
    return NextResponse.json({ error: 'No content provided' }, { status: 400 });
  }

  const contentJson = JSON.parse(contentRaw);

  const content = contentJson['html'];
  const room = contentJson['room'];
  const coverPage = contentJson['coverPage'];

  // @ts-ignore
  const headersList = req.headers;

  const authstring = req.headers.get('authorization');

  const origin = req.headers.get("origin");

  const baseUrl = process.env.NEXT_PUBLIC_PHP_API_BASE_URL;
  const phpApiUrl = `${baseUrl}editor/setting/${room}`;

  const responseSetting = await fetch(phpApiUrl, {
    method: 'GET',
    // @ts-ignore,
    headers: {
      'Content-Type': 'text/html',
      'Authorization': authstring,
    },
  });

  const settingData = await responseSetting.json();



  const filePathL = path.join(process.cwd(), '/.next/static/css');

  const files = fs.readdirSync(filePathL);

  let cssString = '';

  files.forEach(file => {
    let fullPath = origin + "/_next/static/css/" + file;
    // Check if the current path is a file and ends with .css
    cssString += `<link rel="stylesheet" href="${fullPath}">`;

  });

  let coverPageSetting = settingData['cover_page'];

  let coverHtml = ''
  if (coverPage) {
      coverHtml = coverPageSetting['html_content'];
  }


  let newContent = '' +
    '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
    '  <meta charset="utf-8">' +
    '  <meta http-equiv="X-UA-Compatible" content="IE=edge">' +
    '  <meta http-equiv="cleartype" content="on">' +
    cssString +

    '</head><body>' +
    '<div class="ProseMirror tiptap">';
  newContent  = newContent + content;
  newContent  = newContent + '</div></body></html>';


  let accountSetting = settingData['table'];

  // @ts-ignore
  accountSetting.forEach(item => {
    newContent = newContent.replace(new RegExp(item['name'], 'g'), item['value']);
  });

  let documentSetting = settingData['form'];

  // @ts-ignore
  documentSetting.forEach(item => {
    let key = item['key'];

    if (key) {
      let regName = `\\{\\{\\{${key}\\}\\}\\}`;

      newContent = newContent.replace(new RegExp(regName, 'g'), item['value']);
    }
  });

  let textSnipet = settingData['meta'];
  // @ts-ignore
  textSnipet.forEach(item => {
    let id = item['id'];
    let regName = `{{{{textsinippet_${id}}}}}`;
    newContent = newContent.replace(new RegExp(regName, 'g'), item['content']);
  });


  let fileName = settingData['filename'];

  if (!fileName) {
    fileName = `${room}.pdf`;
  } else {
    fileName = `${fileName}.pdf`;
  }



  const tipTapName = `${room}.html`;
  const filePath = path.join(process.cwd(), '../../../html', tipTapName);
  await writeFileAsync(filePath, newContent, 'utf8');


  let coverPageName = '';
  if (coverHtml) {
    coverPageName = `${room}_coverpage.html`;
    const coverPath = path.join(process.cwd(), '../../../html', coverPageName);
    await writeFileAsync(coverPath, coverHtml, 'utf8');
  }

  const cloudflare = "https://browser-worker.winter-sunset-6f36.workers.dev?url=";
  try {

    const newUrl = origin + "/api_document/export?file="+tipTapName;
    const tipUrl = cloudflare + newUrl;
    const response = await fetch(tipUrl, {
      method: 'POST',
      // @ts-ignore
      headers: {
        'Content-Type': 'text/html', // 根据你的 PHP 接口需要设置头部
        'Authorization': authstring, // 如果需要身份验证
      }
    });

    if (!response.ok) {
      throw new Error(`PHP API returned an error: ${response.statusText}`);
    }

    const pdfBlob = await response.blob();

    // if attached with cover page.
    if (coverPageName != '') {
      const tapUrl = origin + "/api_document/export?file=" + coverPageName;
      const coverUrl = cloudflare + tapUrl;

      const responseCover = await fetch(coverUrl, {
        method: 'POST',
        // @ts-ignore
        headers: {
          'Content-Type': 'text/html',
          'Authorization': authstring,
        }
      });



      if (!responseCover.ok) {
        throw new Error(`CloudFlare API returned an error: ${response.statusText}`);
      }

      const pdfBlobCover = await responseCover.blob();


      const finalPdfBlob = await mergePDFs(pdfBlobCover, pdfBlob);

      return new NextResponse(finalPdfBlob, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=${fileName}`, // Ensure proper formatting
        },
      });
    } else {
        return new NextResponse(pdfBlob, {
          headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename=${fileName}`, // Ensure proper formatting
          },
        });

    }


  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Error generating PDF' }, { status:500 });
  }
}


export function GET(req: NextRequest): Promise<NextResponse> {
  return new Promise((resolve, reject) => {
    try {
      // 从查询参数中获取文件名
      const { searchParams } = new URL(req.url);
      const fileName = searchParams.get('file');

      if (!fileName) {
        resolve(NextResponse.json({ status: "fail", error: "File name is required." }, { status: 400 }));
        return;
      }
      const filePath = path.join(process.cwd(), '../../../html/', fileName);

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
          let contentType = 'text/html';


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
