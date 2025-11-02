import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tabs,
  Tab,
  Box,
  Grid,
  TextField,
  CircularProgress, Snackbar, Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { Editor } from '@tiptap/react';
import API from "@/lib/api";
import RemoveIcon from "@mui/icons-material/Remove";
import {useSnackbar} from "@/components/SnackbarTips/SnackbarTips";

export type MetaDialogProps = {
  editor: Editor;
  room?: string
};
// @ts-ignore
function DynamicForm({editor, room, dform} : { editor: Editor; room: string|undefined; dform: any[]}) {
  const [fields, setFields] = useState(dform);

  // 处理输入框变化
  // @ts-ignore
  const handleChange = (index, e) => {
    const updatedFields = [...fields];
    // @ts-ignore
    updatedFields[index][e.target.name] = e.target.value;
    setFields(updatedFields);
  };

  const handleAddField = () => {
    setFields([...fields, { key: '', value: '' }]);
  };
  const { showMessage } = useSnackbar();
  const [loading, setLoading] = React.useState(false);
  // @ts-ignore
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(fields);
    setLoading(true);

    let data = {
      'data': fields,
      action: 'variable',
      file_id: room,
      rtime: new Date().getTime()
    }

    await API.saveExtraToEditor(room, data)

    setLoading(false);
    showMessage('Save Success!', 'success');
  };
  // @ts-ignore
  const canInsert = (index) => {
    return fields[index].key && fields[index].value;
  };


  const [open, setOpen] = React.useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  // @ts-ignore
  const handleRemoveField = (index) => {
    const updatedFields = [...fields];
    updatedFields.splice(index, 1);
    setFields(updatedFields);
  };
  // @ts-ignore
  const handleInsertEditor = (dname)  => {
      editor.commands.insertContent(` {{{${dname}}}} `);
  }

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        {fields.map((field, index) => (
          <Grid
            container
            spacing={2}
            key={index}
            component="div"
          >
            <Grid
              component="div"
            >
              <TextField
                label="Key"
                name="key"
                value={field.key}
                onChange={(e) => handleChange(index, e)}
                fullWidth
              />
            </Grid>
            <Grid
              component="div"
            >
              <TextField
                label="Value"
                name="value"
                value={field.value}
                onChange={(e) => handleChange(index, e)}
                fullWidth
              />
            </Grid>
            <Grid
              component="div"
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {canInsert(index) && (

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleInsertEditor(field.key)}
                  >
                    Insert
                  </Button>

              )}



                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <IconButton color="secondary" onClick={() => handleRemoveField(index)}>
                      <RemoveIcon />
                    </IconButton>
                  </Box>

              {index === fields.length - 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <IconButton color="primary" onClick={handleAddField}>
                    <AddIcon />
                  </IconButton>
                </Box>
              )}
            </Grid>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ marginTop: 2 }}>
        <Button
          loading={loading}
          type="submit" variant="contained" color="primary">
          Save
        </Button>
      </Box>
    </form>
  );
}

function DynamicTable({editor,  rows,  loading }: {editor: Editor; rows: any[]; loading: boolean }) {
  const handleAdd = (name: string) => {
    console.log(`Add button clicked for ID: ${name}`);

    editor.commands.insertContent(` ${name} `);
  };

  return (
    <TableContainer>
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Value</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.id}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.value}</TableCell>
              <TableCell align="right">
                <Button variant="contained" color="primary" onClick={() => handleAdd(row.name)}>
                  Insert
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function DynamicTextTable({editor,  rows,  loading }: {editor: Editor; rows: any[]; loading: boolean }) {
  const handleAdd = (id: number) => {
    console.log(`Add button clicked for ID: ${id}`);

    let idplaceHolder = ` {{{{textsinippet_${id}}}}} `;

    editor.commands.insertContent(`${idplaceHolder}`);
  };

  return (
    <TableContainer>
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Date Added</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.id}</TableCell>
              <TableCell>{row.title}</TableCell>
              <TableCell>{row.attempt_last}</TableCell>
              <TableCell align="right">
                <Button variant="contained" color="primary" onClick={() => handleAdd(row.id)}>
                  Insert
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}


function DialogWithTable({ editor, room }: MetaDialogProps) {
  const handleClose = () => {
    setValue(0);
    setOpen(false);
  };
  const [open, setOpen] = useState(false);

  const [rows, setRows] = useState([]);
  const [texts, setTexts] = useState([]);
  const [dform, setDform] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleShowModal = () => setOpen(true);

    window.addEventListener('show-modal', handleShowModal);
    return () => {
      window.removeEventListener('show-modal', handleShowModal);
    };
  }, []);

  useEffect(() => {
    // Fetch data when the dialog opens
    if (open) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await API.getSettings(room);
          if (typeof response['table'] != undefined) {
            setRows(response['table']);
          }

          if (typeof response['form'] != undefined) {
            setDform(response['form']);
          }

          setTexts(response['meta'])

        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [open]);

  const handleCloseModal = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (open) {
      setValue(0); // 确保打开时默认显示第一个选项卡
    }
  }, [open]);

  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  }

  function a11yProps(index: number) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <div>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>
          Meta Tag
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: 0,
              right: 10,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                <Tab label="Account Level" {...a11yProps(0)} />
                <Tab label="Document Level" {...a11yProps(1)} />
                <Tab label="Text Snippet" {...a11yProps(2)} />
              </Tabs>
            </Box>
            <CustomTabPanel value={value} index={0}>
              <DynamicTable editor={editor} rows={rows} loading={loading} />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
              <DynamicForm editor={editor} room={room} dform={dform} />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={2}>
              <DynamicTextTable editor={editor} rows={texts} loading={loading} />
            </CustomTabPanel>
          </Box>

        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="primary" variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default DialogWithTable;
