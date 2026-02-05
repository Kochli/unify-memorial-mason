import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import { useDeletePermitForm } from '../hooks/usePermitForms';
import type { PermitForm } from '../api/permitForms.api';

interface DeletePermitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permitForm: PermitForm;
}

export const DeletePermitFormDialog: React.FC<DeletePermitFormDialogProps> = ({
  open,
  onOpenChange,
  permitForm,
}) => {
  const { mutate: deletePermitForm, isPending } = useDeletePermitForm();
  const { toast } = useToast();

  const handleDelete = () => {
    deletePermitForm(permitForm.id, {
      onSuccess: () => {
        toast({
          title: 'Permit form deleted',
          description: `${permitForm.name} has been removed.`,
        });
        onOpenChange(false);
      },
      onError: (error: unknown) => {
        const description =
          error instanceof Error ? error.message : 'Failed to delete permit form.';
        toast({
          title: 'Error deleting permit form',
          description,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete permit form?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Orders referencing this permit form will be updated
            to have no permit form selected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-2 text-sm">
          <span className="font-semibold">{permitForm.name}</span>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

