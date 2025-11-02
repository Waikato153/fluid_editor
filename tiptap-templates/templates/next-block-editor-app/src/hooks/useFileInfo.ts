// hooks/useFileInfo.ts
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

export const useFileInfo = () => {
  return useSelector((state: RootState) => state.fileInfo);
};

export const useReadOnly   = () => {
  return useSelector((state: RootState) => state.editor.isReadOnly);
};
