import { z } from 'zod';

export const permitFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  link: z.string().trim().optional().or(z.literal('')),
  note: z.string().trim().optional().or(z.literal('')),
});

export type PermitFormFormData = z.infer<typeof permitFormSchema>;

