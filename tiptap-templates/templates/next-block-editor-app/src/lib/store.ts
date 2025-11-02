// lib/store.ts
import { configureStore } from '@reduxjs/toolkit';
import fileInfoReducer from './slices/fileInfoSlice';
import editorReducer from './slices/editorSlice';

export const store = configureStore({
  reducer: {
    fileInfo: fileInfoReducer,
    editor: editorReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;