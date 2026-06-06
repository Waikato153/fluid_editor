import { Buffer } from 'node:buffer';

import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

import { getCurrentAppConfig, isValidAppConfig } from '@/lib/config';
import { createTiptapDocManager } from '@/lib/tiptapDoc';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room');
    const appId = searchParams.get('appId') ?? 'default';

    if (!room) {
      return NextResponse.json(
        { status: "fail", error: "Room name is required." },
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
    const appConfig = getCurrentAppConfig(appId);

    if (!isValidAppConfig(appConfig) || !appConfig.collabSecret) {
      return NextResponse.json(
        { status: "fail", error: "Invalid Tiptap app configuration." },
        { status: 500 }
      );
    }

    // Fetch file info from PHP (includes document copy flag if needed)
    const baseUrl = process.env.NEXT_PUBLIC_PHP_API_BASE_URL;
    const phpApiUrl = `${baseUrl}editor/file/${room}/${appId}`;
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




    // Check if document needs to be duplicated
    // PHP response fields: usecontent (whether to use old content), old_appid (source appId), old_file_id (source file ID)
    if (data.usecontent && data.old_appid && data.old_file_id) {
      console.log('📋 Document duplication detected');
      console.log(`   Source: AppID=${data.old_appid}, FileID=${data.old_file_id}`);
      console.log(`   Target: AppID=${appId}, FileID=${room}`);

      // Create manager with source appId to get source document
      const sourceDocManager = createTiptapDocManager({ appId: data.old_appid });
      const sourceDocId = `doc_${data.old_file_id}`;

      console.log(`📥 Fetching document from source App (${data.old_appid})...`);
      const sourceDoc = await sourceDocManager.getDocument(sourceDocId);

      if (!sourceDoc.success || !sourceDoc.data) {
        console.error('❌ Failed to get source document:', sourceDoc.error);
        data.copyDone = false;
        data.copyError = `Failed to get source document: ${sourceDoc.error}`;
      } else {
        console.log(`✅ Source document fetched successfully, size: ${sourceDoc.data.byteLength} bytes`);

        // Create manager with target appId to save to target
        const targetDocManager = createTiptapDocManager({ appId: appId });
        const targetDocId = `doc_${room}`;

        console.log(`📤 Saving to target App (${appId})...`);

        // Step 1: Delete target document if exists (to ensure clean copy)
        const deleteResult = await targetDocManager.deleteDocument(targetDocId);
        console.log('Delete existing target result:', deleteResult);

        // Step 2: Create new document with source content
        const saveResult = await targetDocManager.saveDocument(
          targetDocId,
          sourceDoc.data,
          false
        );
        console.log('Save result:', saveResult);

        // Step 3: Verify - immediately read back the target document and compare
        const verifyDoc = await targetDocManager.getDocument(targetDocId);
        console.log('🔍 Verification after save:', {
          sourceSize: sourceDoc.data.byteLength,
          targetSize: verifyDoc.data?.byteLength,
          match: sourceDoc.data.byteLength === verifyDoc.data?.byteLength,
          verifySuccess: verifyDoc.success,
        });

        if (saveResult.success) {
          console.log('✅ Tiptap document duplicated successfully');
          data.copyDone = true;
        } else {
          console.error('❌ Failed to save target document:', saveResult.error);
          data.copyDone = false;
          data.copyError = `Failed to save target document: ${saveResult.error}`;
        }
      }
    } else {
      // No duplication needed, mark as completed
      data.copyDone = true;
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { status: "fail", error: "Unexpected error.", details: error.message },
      { status: 500 }
    );
  }
}
