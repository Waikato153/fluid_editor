'use client'
// components/SnackbarTips.tsx
import { Snackbar, Alert, AlertColor } from '@mui/material';
import { createContext, useContext, useState, ReactNode, use } from 'react';

// 创建 Context
const SnackbarContext = createContext<{
  showMessage: (message: string, severity: AlertColor) => void;
}>({
  showMessage: () => {},
});


export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('success');

  const showMessage = (msg: string, sev: AlertColor) => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <SnackbarContext.Provider value={{ showMessage }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right'  }}
      >
        <Alert variant="filled" onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};


export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};


export const tipsShow = (message: string, severity: AlertColor) => {
  const { showMessage } = useSnackbar();
  showMessage(message, severity);
};
