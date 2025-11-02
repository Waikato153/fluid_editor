import React, { useEffect, useState } from 'react';
import API from "@/lib/api";

import { memo } from 'react';
import {Box, Button, Typography, Modal, Checkbox, FormControlLabel, AlertColor, TextField, Grid, InputLabel} from '@mui/material';


import FormControl from '@mui/material/FormControl';

import { useSnackbar } from '@/components/SnackbarTips/SnackbarTips';

import { useFileInfo } from '@/hooks/useFileInfo';
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '30%',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

interface ExportModalProps {
  room?: string;
  isOpen: boolean;
  showMakeaCopyModal: (open: boolean) => void;
}


export const MakeaCopyModal = memo<ExportModalProps>(
  ({
     room,
     isOpen,
     showMakeaCopyModal
   }) =>

  {
    const { data: fileInfo} = useFileInfo();

    useEffect(() => {
      if (isOpen) {
        setDocumenttitle('Copy of NEW - ' + fileInfo.file.name);
        setError(false);
        setIsLoading(false);
      }
    }, [isOpen]);

    const { showMessage } = useSnackbar();
    const [error, setError] = useState(false);


    const handleClose = () => {
      if (isLoading) return
      showMakeaCopyModal(false)
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
        const titleData = {
           title: documenttitle,
        };

        let data = {
          'data': titleData,
          action: 'makeacopy',
          file_id: room,
          rtime: new Date().getTime()
        }

        console.log(JSON.stringify(data))

        // @ts-ignore
        let result = await API.saveExtraToEditor(room, data)


        if (result == true){
          handleClose()
          showMessage('Save success', 'success');
        }else{
          showMessage('Save failed', 'error');
        }

      } catch (error) {
        console.error('Error saving cover page:', error);
      } finally {
        setIsLoading(false)
      }
    }

    return (
      <div>

        <Modal open={isOpen} onClose={handleClose}>
          <Box sx={style}>
            <Typography variant="h6" component="h2" sx={{ color: 'black' }}>
              Copy Document
            </Typography>
            <p>This will be copied to your root directory.</p>
            <FormControl fullWidth sx={{ mt: 4, mb: 4 }}>
              <Grid spacing={3}>
                <Grid>
                  <TextField
                    fullWidth
                    id="cover-heading"
                    label="Document Title"
                    variant="outlined"
                    placeholder="Enter your document title"
                    value={documenttitle}
                    onChange={(e) => {setDocumenttitle(e.target.value); setError(false);}}
                    required
                    error={error}
                    helperText={error ? 'Document Title is required.' : ' '}

                  />
                </Grid>

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
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          </Box>
        </Modal>
      </div>
    );
  },
)

MakeaCopyModal.displayName = 'MakeaCopyModal'
