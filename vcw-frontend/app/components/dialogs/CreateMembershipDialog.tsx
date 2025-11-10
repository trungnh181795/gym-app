import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import MembershipForm from '../forms/MembershipForm';
import type { MembershipFormData } from '../../schemas';

interface CreateMembershipDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MembershipFormData) => Promise<void>;
  initialData?: Partial<MembershipFormData>;
  title?: string;
  isEdit?: boolean;
}

export default function CreateMembershipDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  title = 'Add New Membership',
  isEdit = false,
}: CreateMembershipDialogProps) {
  const handleSubmit = async (data: MembershipFormData) => {
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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <MembershipForm
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