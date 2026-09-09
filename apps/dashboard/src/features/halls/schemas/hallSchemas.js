import { z } from 'zod';

export const createHallSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  city: z.string().min(1, 'City is required'),
  area: z.string().optional(),
  address: z.string().optional(),
  capacity: z.coerce.number().int().positive('Capacity must be positive'),
  depositAmount: z.coerce.number().positive('Deposit amount must be positive'),
  currency: z.string().default('YER'),
  description: z.string().optional(),
  morningPrice: z.coerce.number().positive('Morning price must be positive'),
  eveningPrice: z.coerce.number().positive('Evening price must be positive'),
  fullDayPrice: z.coerce.number().positive('Full day price must be positive'),
});

export const updateHallSchema = createHallSchema.partial();
