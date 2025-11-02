import React, { useEffect, useState, useRef } from 'react';

import { memo } from 'react';
import {Box, Button, Typography, Modal, Checkbox, FormControlLabel, AlertColor, TextField, Grid, InputLabel} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import FormControl from '@mui/material/FormControl';
import { useSnackbar } from '@/components/SnackbarTips/SnackbarTips';
import {Editor} from "@tiptap/react";

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '30%',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 2,
};

interface ExportModalProps {
  editor:Editor,
  createThread: (documenttitle: string) => boolean;
}


export const CommentModal = memo<ExportModalProps>(
  ({
     editor,
     createThread,
   }) =>

  {

    const dispatch = useDispatch();
    const inputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
      const handleShowModal = () => {
        setOpen(true);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      };

      window.addEventListener('show-comment-modal', handleShowModal);
      return () => {
        window.removeEventListener('show-comment-modal', handleShowModal);
      };
    }, []);

    const { showMessage } = useSnackbar();
    const [error, setError] = useState(false);


    const handleClose = () => {
      if (isLoading) return
      setOpen(false)
    };

    const [isLoading, setIsLoading] = useState(false)
    const [documenttitle, setDocumenttitle] = React.useState('');


    const handleSave = async () => {
      if (documenttitle.trim() === '') {
        setError(true);
        return;
      }
      setError(false);
      setIsLoading(true)

      try {

        const result = createThread(documenttitle);

        if (result == true){
          handleClose()
          showMessage('Comment success', 'success');
          setDocumenttitle('')
        }else{
          showMessage('Comment failed', 'error');
        }

      } catch (error) {
        console.error('Error saving cover page:', error);
      } finally {
        setIsLoading(false)
      }
    }

    return (
      <div>
        <Modal open={open} onClose={handleClose} sx={{zIndex: 2000111}}>
          <Box sx={style}>
            <Typography variant="h6" component="h2" sx={{ color: 'black' }}>
              Comment
            </Typography>

            <FormControl fullWidth sx={{ mt: 4 }}>
              <Grid spacing={3}>

                  <TextField
                    inputRef={inputRef}
                    multiline
                    rows={4}
                    fullWidth
                    id="cover-heading"
                    label="Comment"
                    variant="outlined"
                    placeholder="Enter your comment"
                    value={documenttitle}
                    onChange={(e) => {setDocumenttitle(e.target.value); setError(false);}}
                    required
                    error={error}
                    helperText={error ? 'Comment is required.' : ' '}
                  />


              </Grid>
            </FormControl>
            <Box sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1
            }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isLoading}
                sx={{
                  minWidth: '120px',
                  height: '40px',
                }}
              >
                {isLoading ? 'Saving...' : 'Comment'}
              </Button>
            </Box>
          </Box>
        </Modal>
      </div>
    );
  },
)

CommentModal.displayName = 'CommentModal'
