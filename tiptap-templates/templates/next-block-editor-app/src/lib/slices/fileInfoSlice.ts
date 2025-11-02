// lib/slices/fileInfoSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FileInfoState {
  data: any;
  loading: boolean;
  error: string | null;
}

const initialState: FileInfoState = {
  data: null,
  loading: false,
  error: null,
};

const fileInfoSlice = createSlice({
  name: 'fileInfo',
  initialState,
  reducers: {
    setFileInfo: (state, action: PayloadAction<any>) => {
      state.data = action.payload;
    },
    setFileInfoLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setFileInfoError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setFileInfo, setFileInfoLoading, setFileInfoError } = fileInfoSlice.actions;
export default fileInfoSlice.reducer;