import { TiptapCollabProvider } from '@hocuspocus/provider'
import { useEffect, useState } from 'react'
import { Doc as YDoc } from 'yjs'
import {getCredential} from "@/lib/authHelper";
import { getCurrentAppConfig } from '@/lib/config';

function getProvider({ docId, token, yDoc, appId }: { docId: string; token: string; yDoc: YDoc; appId?: string }) {
  const config = getCurrentAppConfig(appId);

  console.log('Using app config in getProvider:', appId, config.name);

  return new TiptapCollabProvider({
    name: `${process.env.NEXT_PUBLIC_COLLAB_DOC_PREFIX}${docId}`,
    appId: config.collabAppId,
    token: token,
    document: yDoc,
  })
}

export const useCollaboration = ({ docId, enabled = true, appId }: { docId: string; enabled?: boolean; appId?: string }) => {
  const [provider, setProvider] = useState<
    | { state: 'loading' | 'idle'; provider: null; yDoc: null }
    | { state: 'loaded'; provider: TiptapCollabProvider; yDoc: YDoc }
  >(() => ({ state: enabled ? 'loading' : 'idle', provider: null, yDoc: null }))
  useEffect(() => {
    let isMounted = true
    // fetch data
    const dataFetch = async () => {
      try {
        setProvider(prev =>
          // Start loading if not already
          prev.state === 'loading'
            ? prev
            : {
                state: 'loading',
                provider: null,
                yDoc: null,
              },
        )

        const credential = getCredential();

        console.log(credential);

        // Get the collaboration token from the backend
        const apiUrl = appId ? `/api_document/collaboration?appId=${appId}` : '/api_document/collaboration';
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${credential}`,
          },
        })

        if (!response.ok) {
          throw new Error('No collaboration token provided, please set TIPTAP_COLLAB_SECRET in your environment')
        }
        const data = await response.json()

        if (!isMounted) {
          return
        }

        const { token } = data

        const yDoc = new YDoc()
        // set state when the data received
        setProvider({ state: 'loaded', provider: getProvider({ docId, token, yDoc, appId }), yDoc })
      } catch (e) {
        if (e instanceof Error) {
          console.error(e.message)
        }
        if (!isMounted) {
          return
        }
        setProvider({ state: 'idle', provider: null, yDoc: null })
        return
      }
    }

    // If enabled, fetch the data
    if (enabled) {
      dataFetch()
    }
    return () => {
      isMounted = false
    }
  }, [docId, enabled])

  return provider
}
