import { useCallback, useMemo, useState } from 'react'
import {useReadOnly} from "@/hooks/useFileInfo";

export type SidebarState = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const useSidebar = (): SidebarState => {
  const isReadOnly = useReadOnly();

  let expand = false;
  if (isReadOnly) {
    expand = true
  }

  const [isOpen, setIsOpen] = useState(expand)
  return useMemo(() => {
    return {
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen(prev => !prev),
    }
  }, [isOpen])
}
