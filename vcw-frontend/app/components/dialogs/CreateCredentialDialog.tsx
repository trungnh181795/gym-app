import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import CredentialForm from '../forms/CredentialForm';
import type { CredentialFormData } from '../../schemas';

interface CreateCredentialDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CredentialFormData) => Promise<void>;
  initialData?: Partial<CredentialFormData>;
  title?: string;
  isEdit?: boolean;
}

export default function CreateCredentialDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  title = 'Create New Credential',
  isEdit = false,
}: CreateCredentialDialogProps) {
  const handleSubmit = async (data: CredentialFormData) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      // Let the form handle the error display
      throw error;
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <CredentialForm
          onSubmit={handleSubmit}
          initialData={initialData}
          isEdit={isEdit}
          showCancelButton={true}
          onCancel={handleClose}
          submitButtonText={isEdit ? 'Update' : 'Create'}
        />
      </DialogContent>
    </Dialog>
  );
}