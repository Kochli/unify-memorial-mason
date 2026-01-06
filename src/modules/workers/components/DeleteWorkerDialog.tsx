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
import { useUpdateWorker, type Worker } from '../hooks/useWorkers';

interface DeleteWorkerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: Worker;
}

export const DeleteWorkerDialog: React.FC<DeleteWorkerDialogProps> = ({
  open,
  onOpenChange,
  worker,
}) => {
  const { mutate: updateWorker, isPending } = useUpdateWorker();
  const { toast } = useToast();

  const handleDeactivate = () => {
    updateWorker(
      {
        id: worker.id,
        updates: { is_active: false },
      },
      {
        onSuccess: () => {
          toast({
            title: 'Worker deactivated',
            description: `${worker.full_name} has been deactivated. They will no longer appear in active worker lists.`,
          });
          onOpenChange(false);
        },
        onError: (error: unknown) => {
          const description =
            error instanceof Error ? error.message : 'Failed to deactivate worker.';
          toast({
            title: 'Error deactivating worker',
            description,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate worker?</AlertDialogTitle>
          <AlertDialogDescription>
            This will deactivate{' '}
            <span className="font-semibold">{worker.full_name}</span>. They will be hidden from
            active worker lists but their historical assignments will be preserved. You can
            reactivate them later by editing their profile.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={handleDeactivate} disabled={isPending}>
              {isPending ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

