'use client'

import 'iframe-resizer/js/iframeResizer.contentWindow'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'

import { BlockEditor } from '@/components/BlockEditor'
import { createPortal } from 'react-dom'
import { Surface } from '@/components/ui/Surface'
import { Toolbar } from '@/components/ui/Toolbar'
import { Icon } from '@/components/ui/Icon'
import { useCollaboration } from '@/hooks/useCollaboration'

import API from '@/lib/api';
import { useSelector, useDispatch } from 'react-redux';
import { setFileInfo, setFileInfoLoading, setFileInfoError } from '@/lib/slices/fileInfoSlice';
import { setReadOnly } from '@/lib/slices/editorSlice'
import { RootState } from '@/lib/store';
import { TiptapCollabProvider } from '@hocuspocus/provider'
import { Doc as YDoc } from 'yjs'

const useDarkmode = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    //typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false,
    false
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setIsDarkMode(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  const toggleDarkMode = useCallback(() => setIsDarkMode(isDark => !isDark), [])
  const lightMode = useCallback(() => setIsDarkMode(false), [])
  const darkMode = useCallback(() => setIsDarkMode(true), [])

  return {
    isDarkMode,
    toggleDarkMode,
    lightMode,
    darkMode,
  }
}

export default function Document({ params }: { params: { room: string } }) {
  const { isDarkMode, darkMode, lightMode } = useDarkmode()
  const [aiToken, setAiToken] = useState<string | null | undefined>()
  const [convertToken, setConvertToken] = useState<string | null | undefined>()
  const [fileInfoReady, setFileInfoReady] = useState(false)
  const searchParams = useSearchParams()
  const appId = searchParams?.get('appId') || 'default'
  console.log('App ID:', appId);

  const { data: fileInfo, loading, error: fileInfoError } = useSelector((state: RootState) => state.fileInfo);

  const dispatch = useDispatch();

  // Only instantiate providerState after fileInfo is ready
  const shouldEnableCollab = fileInfoReady && parseInt(searchParams?.get('noCollab') as string) !== 1
  
  const collabState = useCollaboration({
    docId: params.room,
    enabled: shouldEnableCollab,
    appId: appId,
  })

  // Provide initial state when fileInfo is not ready
  const providerState: 
    | { state: 'loading' | 'idle'; provider: null; yDoc: null }
    | { state: 'loaded'; provider: TiptapCollabProvider; yDoc: YDoc } 
    = fileInfoReady 
      ? collabState 
      : { state: 'idle', provider: null, yDoc: null }

  // Step 1: Highest priority - Fetch file info (includes duplication logic)
  useEffect(() => {
    let isMounted = true;
    
    const fetchFileInfo = async () => {
      try {
        setFileInfoReady(false); // Mark as started
        dispatch(setFileInfoLoading(true));
        dispatch(setFileInfoError(null));

        // Persist the URL/cookie token before making authenticated requests.
        const token = await API.sendTokenToServer();
        if (!token) {
          throw new Error('Authorization Token is required. Please login and try again.');
        }
        
        // This calls backend /api_document/file, which completes duplication before returning
        const data = await API.getFileInfo(params.room, appId);
        
        if (!isMounted) return;
        
        dispatch(setFileInfo(data));
        
        // ===== Test breakpoint: Check if Tiptap document is created =====
        console.log('✅ FileInfo fetched, backend duplication completed');
        console.log('📋 Response data:', data);
        console.log('🔍 Please check if document exists on Tiptap server now');
        console.log(`📄 Document ID: doc_${params.room}`);
        console.log('⏸️  Program paused, waiting for your inspection...');
        
        // Pause execution here
        //debugger; // This triggers a breakpoint in browser dev tools
        
        // Code below won't execute until you continue in dev tools
        console.log('▶️  Continuing with subsequent logic');
        
      } catch (error) {
        if (!isMounted) return;

        if (error instanceof Error) {
          dispatch(setFileInfoError(error.message));
        } else {
          dispatch(setFileInfoError('Unknown error'));
        }

        dispatch(setFileInfo(null));
      } finally {
        if (!isMounted) return;
        
        dispatch(setFileInfoLoading(false));
        setFileInfoReady(true); // Mark as complete, allow subsequent logic to proceed
      }
    };

    fetchFileInfo();
    
    return () => {
      isMounted = false;
    };
  }, [params.room, appId, dispatch]);


  useEffect(() => {
    const queryReadOnly = searchParams?.get('readonly');
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const hashReadOnly = hashParams.get('readonly');
    const isReadOnly = queryReadOnly == '1' || hashReadOnly == '1';
    
    dispatch(setReadOnly(isReadOnly));
  }, [searchParams, dispatch]);

  // Step 2: Fetch AI token only after fileInfoReady
  useEffect(() => {
    if (!fileInfoReady) return;

    const dataFetch = async () => {
      try {
        const response = await fetch('/api_document/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('No AI token provided, please set TIPTAP_AI_SECRET in your environment')
        }
        const data = await response.json()

        const { token } = data

        // set state when the data received
        setAiToken(token)
      } catch (e) {
        if (e instanceof Error) {
          console.error(e.message)
        }
        setAiToken(null)
        return
      }
    }

    dataFetch()
  }, [fileInfoReady])

  // Step 3: Fetch Convert token only after fileInfoReady and fileInfo success
  useEffect(() => {
    if (!fileInfoReady || !fileInfo || fileInfoError) return;

    const dataFetch = async () => {
      try {
        const response = await fetch('/api_document/getConvertToken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('No convert token provided, please set TIPTAP_CONVERT_SECRET in your environment');
        }
        const data = await response.json();
        const { token } = data;
        setConvertToken(token);
      } catch (e) {
        if (e instanceof Error) {
          console.error(e.message);
        }
        setConvertToken(null);
      }
    };

    dataFetch();
  }, [fileInfoReady, fileInfo, fileInfoError]);

  if (!fileInfoReady || loading || providerState.state === 'loading' || aiToken === undefined|| !fileInfo || convertToken === undefined) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-black bg-opacity-95 dark:bg-opacity-95 z-1000">
        <div className="flex flex-col items-center gap-4">
          {fileInfoError ? (
            <div className="text-red-500 dark:text-red-400 text-lg font-medium text-center max-w-md">
              {fileInfoError}
            </div>
          ) : (
            <div className="relative">

              <div className="w-16 h-16 border-4 border-blue-500/20 dark:border-blue-400/20 rounded-full"></div>

              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>

              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }



  const DarkModeSwitcher = createPortal(
    <Surface className="flex items-center gap-1 fixed bottom-6 right-6 z-[99999] p-1">
      <Toolbar.Button onClick={lightMode} active={!isDarkMode}>
        <Icon name="Sun" />
      </Toolbar.Button>
      <Toolbar.Button onClick={darkMode} active={isDarkMode}>
        <Icon name="Moon" />
      </Toolbar.Button>
    </Surface>,
    document.body,
  )

  return (
    <>
      {DarkModeSwitcher}
      <BlockEditor convertToken={convertToken ?? undefined}  aiToken={aiToken ?? undefined} ydoc={providerState.yDoc} provider={providerState.provider} />
    </>
  )
}
