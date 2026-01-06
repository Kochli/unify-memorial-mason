import { z } from 'zod';

export const workerFormSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required'),
  phone: z.string().trim().optional().nullable(),
  role: z.enum(['installer', 'driver', 'stonecutter', 'other']),
  notes: z.string().trim().optional().nullable(),
  is_active: z.boolean().default(true),
});

export type WorkerFormData = z.infer<typeof workerFormSchema>;

export const workerAvailabilitySchema = z.object({
  worker_id: z.string().uuid(),
  mon_available: z.boolean().default(true),
  tue_available: z.boolean().default(true),
  wed_available: z.boolean().default(true),
  thu_available: z.boolean().default(true),
  fri_available: z.boolean().default(true),
  sat_available: z.boolean().default(false),
  sun_available: z.boolean().default(false),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});

export type WorkerAvailabilityFormData = z.infer<typeof workerAvailabilitySchema>;

