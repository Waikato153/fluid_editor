// lib/slices/editorSlice.ts
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isReadOnly: false,
  isCommentModalShown: false,
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setReadOnly: (state, action) => {
      state.isReadOnly = action.payload;
    },
    setCommentModalShown: (state, action) => {
      state.isCommentModalShown = action.payload;
    },
  },
});

export const { setReadOnly, setCommentModalShown } = editorSlice.actions;
export default editorSlice.reducer;
