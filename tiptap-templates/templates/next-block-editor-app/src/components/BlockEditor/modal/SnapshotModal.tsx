import React, { useEffect, useState, useRef } from 'react';
import API from "@/lib/api";
import { getCredential } from "@/lib/authHelper";
import { Editor } from '@tinymce/tinymce-react';
import { memo } from 'react';
import {Box, Button, Typography, Modal, Checkbox, FormControlLabel, AlertColor, TextField, Grid, InputLabel, CircularProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions} from '@mui/material';

import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import {EditorContent, useEditor} from "@tiptap/react";
import {CommentsKit} from "@tiptap-pro/extension-comments";
import StarterKit from "@tiptap/starter-kit";
import { ExtensionKit } from '@/extensions/extension-kit'
import {useSnackbar} from "@/components/SnackbarTips/SnackbarTips";

interface SnapshotData {
  id: number;
  created_at: string;
  name: string;

}

interface ExportModalProps {
  room?: string;
  isOpen: boolean;
  onClose: () => void;
  parentEditor: any,
  provider: any;
}

export const SnapShotModal = memo<ExportModalProps>(
  ({
     room,
     isOpen,
     onClose,
     provider,
     parentEditor,
     }) => {
    const [snapshots, setSnapshots] = useState<SnapshotData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
    const [rowCount, setRowCount] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<SnapshotData | null>(null);
    const [currentSnapshotContent, setCurrentSnapshotContent] = useState([]);

    // 获取快照数据
    const fetchSnapshots = async (page = 0, pageSize = 25) => {
      if (!room) return;

      setLoading(true);
      setError(null);

      try {
        // 传递分页参数给API
        const data = await API.getSnapshot(room, page, pageSize);
        setSnapshots(data.list || []);
        setRowCount(data.total || 0); // 设置总行数
      } catch (err) {

        setError('Data Fetched Error');
      } finally {
        setLoading(false);
      }
    };

    // 当Modal打开时获取数据
    useEffect(() => {
      if (isOpen && room) {
        fetchSnapshots(paginationModel.page, paginationModel.pageSize);
      }
    }, [isOpen, room]);

    // 处理分页变化
    const handlePaginationModelChange = (newPaginationModel: any) => {
      setPaginationModel(newPaginationModel);
      fetchSnapshots(newPaginationModel.page, newPaginationModel.pageSize);
    };

    // @ts-ignore
    const editor = useEditor({
      editable: false,
      extensions: [
        ...ExtensionKit({
          provider
        }),
        provider
          ? CommentsKit.configure({
            provider,

          }): undefined,
        StarterKit,
      ],
    })

    const fetchSnapshotDetail = async (snapshotId: number) => {
      try {
        editor.commands.setContent("Loading...")
        const data = await API.getSnapshotDetail(snapshotId);
        if (editor && data.content) {
          setCurrentSnapshotContent(data.content);
          editor.commands.setContent(data.content.content_html);
        }
      } catch (err) {
        console.error('fail to fetch snapshot:', err);
      }
    };

    const handleActionClick = (row: SnapshotData) => {
      setSelectedRow(row);
      setDialogOpen(true);
    };


    const handleDialogClose = () => {
      setDialogOpen(false);
      setSelectedRow(null);
      setCurrentSnapshotContent([]);
      editor.commands.setContent('');
    };
    const { showMessage } = useSnackbar();
    const RevertToThis = () => {
      if (selectedRow && parentEditor && currentSnapshotContent) {
        // @ts-ignore
        parentEditor.commands.setContent(currentSnapshotContent.content_html);
        // @ts-ignore
        API.saveTip(currentSnapshotContent.content_html, currentSnapshotContent.content_json, room);
        handleDialogClose();
        onClose();
        showMessage('Your Operation is Successful', 'success');
      }
    }

    useEffect(() => {
      if (dialogOpen && selectedRow && editor) {
        fetchSnapshotDetail(selectedRow.id);
      }
    }, [dialogOpen, selectedRow, editor]);

    const columns: GridColDef[] = [
      { field: 'id', headerName: 'ID', width: 100, flex: 0.2 },
      { field: 'name', headerName: 'Name', width: 100, flex: 0.2 },
      { field: 'created_at', headerName: 'Created At', width: 200, flex: 0.3 },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 120,
        flex: 0.3,
        sortable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
            <Button
              startIcon={<ImageSearchIcon />}
              variant="contained"
              size="small"
              onClick={() => handleActionClick(params.row)}
              sx={{
                '&:focus': {
                  outline: 'none',
                },
                '&:focus-visible': {
                  outline: 'none',
                }
              }}
            >
              View
            </Button>
          </Box>
        ),
      },
    ];

    return (
      <div>
        <Modal
          open={isOpen}
          onClose={onClose}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Paper sx={{
            height: 600,
            width: '90%',
            maxWidth: 1000,
            margin: 'auto',
            outline: 'none',
            padding: 2,
            overflow: 'hidden'
          }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" component="h2">
                SnapShot
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography color="error">{error}</Typography>
              </Box>
            ) : (
              <Box sx={{ height: 520, width: '100%' }}>
                <DataGrid
                  rows={snapshots}
                  columns={columns}
                  paginationModel={paginationModel}
                  onPaginationModelChange={handlePaginationModelChange}
                  pageSizeOptions={[10, 25, 50, 100]}
                  sx={{
                    border: 0,
                    '& .MuiDataGrid-row.Mui-selected': {
                      backgroundColor: 'transparent',
                    },
                    '& .MuiDataGrid-row.Mui-selected:hover': {
                      backgroundColor: 'transparent',
                    },
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: 'transparent',
                    },
                    '& .MuiDataGrid-cell:focus': {
                      outline: 'none',
                    },
                    '& .MuiDataGrid-cell:focus-within': {
                      outline: 'none',
                    },
                    '& .MuiDataGrid-row:focus': {
                      outline: 'none',
                    },
                    '& .MuiDataGrid-row:focus-within': {
                      outline: 'none',
                    }
                  }}
                  loading={loading}
                  disableColumnMenu
                  disableRowSelectionOnClick
                  paginationMode="server"
                  rowCount={rowCount}
                />
              </Box>
            )}
          </Paper>
        </Modal>

        {/* 详情Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleDialogClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
             Detail - {selectedRow?.created_at || 'Unknown'}
          </DialogTitle>
          <DialogContent>
            <div className="main">
              <EditorContent editor={editor} className="flex-1 overflow-y-auto p-6" />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} color="primary">
              Close
            </Button>
            <Button onClick={RevertToThis} variant="contained" color="primary">
              Revert
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  },
)

SnapShotModal.displayName = 'SnapShotModal'
