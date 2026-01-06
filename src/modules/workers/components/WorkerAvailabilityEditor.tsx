import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/use-toast';
import { workerAvailabilitySchema, type WorkerAvailabilityFormData } from '../schemas/worker.schema';
import { useWorkerWithAvailability, useUpsertWorkerAvailability } from '../hooks/useWorkers';

interface WorkerAvailabilityEditorProps {
  workerId: string;
}

const weekdays = [
  { key: 'mon_available' as const, label: 'Monday' },
  { key: 'tue_available' as const, label: 'Tuesday' },
  { key: 'wed_available' as const, label: 'Wednesday' },
  { key: 'thu_available' as const, label: 'Thursday' },
  { key: 'fri_available' as const, label: 'Friday' },
  { key: 'sat_available' as const, label: 'Saturday' },
  { key: 'sun_available' as const, label: 'Sunday' },
];

export const WorkerAvailabilityEditor: React.FC<WorkerAvailabilityEditorProps> = ({
  workerId,
}) => {
  const { data: workerData, isLoading } = useWorkerWithAvailability(workerId);
  const { mutate: upsertAvailability, isPending } = useUpsertWorkerAvailability();
  const { toast } = useToast();

  const availability = workerData?.worker_availability;

  const form = useForm<WorkerAvailabilityFormData>({
    resolver: zodResolver(workerAvailabilitySchema),
    defaultValues: {
      worker_id: workerId,
      mon_available: true,
      tue_available: true,
      wed_available: true,
      thu_available: true,
      fri_available: true,
      sat_available: false,
      sun_available: false,
      start_time: null,
      end_time: null,
      notes: null,
    },
  });

  useEffect(() => {
    if (availability) {
      form.reset({
        worker_id: workerId,
        mon_available: availability.mon_available,
        tue_available: availability.tue_available,
        wed_available: availability.wed_available,
        thu_available: availability.thu_available,
        fri_available: availability.fri_available,
        sat_available: availability.sat_available,
        sun_available: availability.sun_available,
        start_time: availability.start_time || null,
        end_time: availability.end_time || null,
        notes: availability.notes || null,
      });
    }
  }, [availability, workerId, form]);

  const onSubmit = (values: WorkerAvailabilityFormData) => {
    upsertAvailability(
      {
        worker_id: values.worker_id,
        mon_available: values.mon_available,
        tue_available: values.tue_available,
        wed_available: values.wed_available,
        thu_available: values.thu_available,
        fri_available: values.fri_available,
        sat_available: values.sat_available,
        sun_available: values.sun_available,
        start_time: values.start_time || null,
        end_time: values.end_time || null,
        notes: values.notes || null,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Availability updated',
            description: 'Worker availability has been saved successfully.',
          });
        },
        onError: (error: unknown) => {
          const description =
            error instanceof Error ? error.message : 'Failed to update availability.';
          toast({
            title: 'Error updating availability',
            description,
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (isLoading) {
    return <div className="p-4">Loading availability...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <div className="space-y-4">
          <FormLabel>Weekly Availability</FormLabel>
          {weekdays.map((day) => (
            <FormField
              key={day.key}
              control={form.control}
              name={day.key}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">{day.label}</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="time"
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
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional availability notes..."
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Availability'}
        </Button>
      </form>
    </Form>
  );
};

