import React, { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/shared/components/ui/drawer';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useToast } from '@/shared/hooks/use-toast';
import { workerFormSchema, type WorkerFormData } from '../schemas/worker.schema';
import { useUpdateWorker, type Worker } from '../hooks/useWorkers';
import { WorkerAvailabilityEditor } from './WorkerAvailabilityEditor';

interface EditWorkerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: Worker;
}

export const EditWorkerDrawer: React.FC<EditWorkerDrawerProps> = ({
  open,
  onOpenChange,
  worker,
}) => {
  const { mutate: updateWorker, isPending } = useUpdateWorker();
  const { toast } = useToast();

  const defaultValues = useMemo<WorkerFormData>(
    () => ({
      full_name: worker.full_name || '',
      phone: worker.phone || '',
      role: worker.role,
      notes: worker.notes || '',
      is_active: worker.is_active,
    }),
    [worker]
  );

  const form = useForm<WorkerFormData>({
    resolver: zodResolver(workerFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const onSubmit = (values: WorkerFormData) => {
    updateWorker(
      {
        id: worker.id,
        updates: {
          full_name: values.full_name,
          phone: values.phone || null,
          role: values.role,
          notes: values.notes || null,
          is_active: values.is_active,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: 'Worker updated',
            description: 'Worker has been updated successfully.',
          });
          onOpenChange(false);
        },
        onError: (error: unknown) => {
          const description =
            error instanceof Error ? error.message : 'Failed to update worker.';
          toast({
            title: 'Error updating worker',
            description,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[96vh] overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>Edit Worker</DrawerTitle>
          <DrawerDescription>Update worker information and availability.</DrawerDescription>
        </DrawerHeader>
        <Tabs defaultValue="details" className="p-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+44 20 1234 5678"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="installer">Installer</SelectItem>
                          <SelectItem value="driver">Driver</SelectItem>
                          <SelectItem value="stonecutter">Stonecutter</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about this worker..."
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <DrawerFooter>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Updating...' : 'Update Worker'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                </DrawerFooter>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="availability">
            <WorkerAvailabilityEditor workerId={worker.id} />
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
};

