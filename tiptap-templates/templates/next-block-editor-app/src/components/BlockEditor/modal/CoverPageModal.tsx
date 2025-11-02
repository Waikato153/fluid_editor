import React, { useEffect, useState, useRef } from 'react';
import API from "@/lib/api";
import { Editor } from '@tinymce/tinymce-react';
import { memo } from 'react';
import {Box, Button, Typography, Modal, Checkbox, FormControlLabel, AlertColor, TextField, Grid, InputLabel} from '@mui/material';


import FormControl from '@mui/material/FormControl';
import DatePickerComponent from '../components/DatePickerComponent';
import dayjs from 'dayjs';


//import SimpleEditor from "../components/SimpleEditor";
import {useSnackbar} from "@/components/SnackbarTips/SnackbarTips";

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '40%',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

interface ExportModalProps {
  room?: string;
  isOpen: boolean;
  showCoverPageModal: (open: boolean) => void;
}

export const CoverPageModal = memo<ExportModalProps>(
  ({
     room,
     isOpen,
     showCoverPageModal
   }) =>

  {

    const editorRef = useRef(null);
    const [editorReady, setEditorReady] = useState(false);

    useEffect(() => {
      if (editorReady && isOpen) {
        const fetchData = async () => {
          try {
            const response = await API.getSettings(room);
            if (typeof response['cover_page'] !== undefined) {
              setContent(response['cover_page']['cover_content']);
              setCoverHeading(response['cover_page']['cover_heading']);
              setcoverSubHeading(response['cover_page']['cover_subheading']);
              setcoverAuthor(response['cover_page']['cover_author']);
              if (response['cover_page']['cover_date']) {
                setcoverDate(dayjs(response['cover_page']['cover_date'], 'DD/MM/YYYY'));
              }
              if (editorRef.current) {
                // @ts-ignore
                editorRef?.current?.setContent(response['cover_page']['cover_content']);
              }
            }
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchData();
      }
    }, [editorReady, isOpen]);

    const { showMessage } = useSnackbar();
    const handleOpen = () => {showCoverPageModal(true)};
    const handleClose = () => {
      if (isLoading) return
      showCoverPageModal(false)
    };

    const [isLoading, setIsLoading] = useState(false)

    const [coverHeading, setCoverHeading] = React.useState('');
    const [coverSubHeading, setcoverSubHeading] = React.useState('');
    const [coverAuthor, setcoverAuthor] = React.useState('');
    const [coverDate, setcoverDate] = React.useState(dayjs());

    const [content, setContent] = React.useState('');

    const setShortContent = (content: string) => {
      setContent(content);
    }


    const handleSave = async () => {
      setIsLoading(true)
      try {
        // @ts-ignore
        const shortContent = editorRef.current.getContent();

        const coverPageData = {
          cover_heading: coverHeading,
          cover_subheading: coverSubHeading,
          cover_author: coverAuthor,
          cover_date: coverDate.format('DD/MM/YYYY'),
          cover_content: shortContent
        };

        let data = {
          'data': coverPageData,
          action: 'coverpage',
          file_id: room,
          rtime: new Date().getTime()
        }

        // @ts-ignore
        let result = await API.saveExtraToEditor(room, data)


        if (result == true){
          showMessage('Save success', 'success');
        }else{
          showMessage('Save failed', 'error');
        }


      } catch (error) {
        console.error('Error saving cover page:', error);
      } finally {
        setIsLoading(false)
        handleClose()
      }
    }


    return (
      <div>

        <Modal open={isOpen} onClose={handleClose} sx={{zIndex: 2000111}}>
          <Box sx={style}>

            <Typography variant="h6" component="h2" sx={{ color: 'black' }}>
              Cover Page Settings
            </Typography>

            <FormControl fullWidth sx={{ mt: 2, mb: 2 }} >
              <Grid container spacing={2} direction="column">
                <Grid>
                  <TextField
                    fullWidth
                    id="cover-heading"
                    label="Document Title"
                    variant="outlined"
                    placeholder="Enter your document title"
                    value={coverHeading}
                    onChange={(e) => setCoverHeading(e.target.value)}
                    InputProps={{
                      sx: {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.dark',
                        },
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        color: 'text.secondary',
                        '&.Mui-focused': {
                          color: 'primary.main',
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid>
                  <TextField
                    fullWidth
                    id="cover-subheading"
                    label="Subtitle"
                    variant="outlined"
                    placeholder="subtitle"
                    value={coverSubHeading}
                    onChange={(e) => setcoverSubHeading(e.target.value)}
                    InputProps={{
                      sx: {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.dark',
                        },
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        color: 'text.secondary',
                        '&.Mui-focused': {
                          color: 'primary.main',
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid>


                  <FormControl fullWidth>
                    <InputLabel htmlFor="simple-editor-label" >
                      Short Description
                    </InputLabel>
                    <Editor
                      apiKey='abhnq88gx82bxduiimml80k0x5g2kd0h2muyz6zm35qie1rw'
                      onInit={ (_evt: any, editor: any) => {
                        editorRef.current = editor;
                        setEditorReady(true);
                      }}
                      initialValue=""
                      init={{
                        height: 200,
                        menubar: false,
                        statusbar: false,
                        placeholder: 'Type here...',
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                        ],
                        toolbar: 'undo redo | blocks | ' +
                          'bold italic forecolor | alignleft aligncenter ' +
                          'alignright alignjustify | bullist numlist outdent indent | ' +
                          'removeformat | help'
                      }}
                    />
                  </FormControl>

              </Grid>

                <Grid>
                  <TextField
                    fullWidth
                    id="cover-author"
                    label="Author"
                    variant="outlined"
                    placeholder="Author"
                    value={coverAuthor}
                    onChange={(e) => setcoverAuthor(e.target.value)}
                    InputProps={{
                      sx: {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.dark',
                        },
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        color: 'text.secondary',
                        '&.Mui-focused': {
                          color: 'primary.main',
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid >
                  <DatePickerComponent
                    value={coverDate}
                    onChange={(newValue) => setcoverDate(newValue??dayjs())}
                  />
                </Grid>
              </Grid>
            </FormControl>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                loading={isLoading}
                loadingPosition="start"
                variant="contained" onClick={handleSave}>
                Save
              </Button>
            </Box>
          </Box>
        </Modal>
      </div>
    );
  },
)

CoverPageModal.displayName = 'CoverPageModal'
