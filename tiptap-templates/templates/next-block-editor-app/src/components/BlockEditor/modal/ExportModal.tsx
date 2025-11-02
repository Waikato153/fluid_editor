import React, { useEffect, useState } from 'react';
import API from "@/lib/api";

import { memo } from 'react';
import { Box, Button, Typography, Modal, Checkbox, FormControlLabel,AlertColor } from '@mui/material';

import FormControl from '@mui/material/FormControl';
import {useSnackbar} from "@/components/SnackbarTips/SnackbarTips";

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

interface ExportModalProps {
    room?: string;
    isOpen: boolean;
    editor: any;
    showExportModal: (open: boolean) => void;
}


export const ExportModal = memo<ExportModalProps>(
    ({
    room,
    isOpen,
    editor,
    showExportModal
    }) =>

    {


      const handleOpen = () => {showExportModal(true)};
      const { showMessage } = useSnackbar();
      const handleClose = () => {
          if (isLoading) return
          showExportModal(false)
      };

      const [isLoading, setIsLoading] = useState(false)

      const handleExport = async () => {

        const html = editor.getHTML();

        if (isLoading) return;

        setIsLoading(true)

        try {
          // @ts-ignore
          const result = await API.generatePDf(html, room, isCoverPageChecked);
          setIsLoading(false)

          if (result == 0){
            showMessage('Export failed', 'error');
          }else{
            showMessage('Export success', 'success');
          }
        } catch (Error) {

        } finally {
          handleClose();
        }

    }


    const [isCoverPageChecked, setIsCoverPageChecked] = useState(false);

    const handleCoverPageChange = (
        event: React.SyntheticEvent<Element, Event>,
        checked: boolean
      ) => {
        setIsCoverPageChecked(checked);
      };


    return (
        <div>

        <Modal open={isOpen} onClose={handleClose}>
            <Box sx={style}>

                <Typography variant="h6" component="h2" sx={{ color: 'black' }}>
                    Export Settings
                </Typography>


                <FormControl sx={{ mt: 2, minWidth: 250  }}>
                    <FormControlLabel

                    checked={isCoverPageChecked}
                    onChange={handleCoverPageChange}


                    control={<Checkbox />} label="Cover Page" sx={{ color: 'black' }} />
                </FormControl>


                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <Button
                      loading={isLoading}
                          loadingPosition="start"
                      variant="contained" onClick={handleExport}>
                      Export
                  </Button>
                </Box>
            </Box>
        </Modal>
    </div>
    );
},
)

ExportModal.displayName = 'ExportModal'
