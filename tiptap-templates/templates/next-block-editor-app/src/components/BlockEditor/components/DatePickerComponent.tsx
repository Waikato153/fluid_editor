import React, { useState } from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TextField } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';

export default function DatePickerComponent({ 
  value = dayjs(), 
  onChange 
}: { 
  value?: Dayjs | null, 
  onChange?: (newValue: Dayjs | null) => void 
}) {
  const [open, setOpen] = useState(false);

  const handleChange = (newValue: Dayjs | null) => {
    onChange?.(newValue);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker 
        label="Document Date" 
        value={value}
        onChange={handleChange}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        format="DD/MM/YYYY"
        slotProps={{
          textField: {
            fullWidth: true,
            variant: 'outlined',
            placeholder: 'Select Document Date',
            onClick: () => setOpen(true),
            InputProps: {
              sx: {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.dark',
                },
              }
            },
            InputLabelProps: {
              sx: {
                color: 'text.secondary',
                '&.Mui-focused': {
                  color: 'primary.main',
                }
              }
            }
          }
        }}
      />
    </LocalizationProvider>
  );
}
