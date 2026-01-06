export interface Worker {
  id: string;
  full_name: string;
  phone: string | null;
  role: 'installer' | 'driver' | 'stonecutter' | 'other';
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkerAvailability {
  worker_id: string;
  mon_available: boolean;
  tue_available: boolean;
  wed_available: boolean;
  thu_available: boolean;
  fri_available: boolean;
  sat_available: boolean;
  sun_available: boolean;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  updated_at: string;
}

export interface WorkerWithAvailability extends Worker {
  availability?: WorkerAvailability | null;
}

export interface JobWorker {
  job_id: string;
  worker_id: string;
  created_at: string;
}

export interface WorkerInsert {
  full_name: string;
  phone?: string | null;
  role: 'installer' | 'driver' | 'stonecutter' | 'other';
  notes?: string | null;
  is_active?: boolean;
}

export interface WorkerUpdate {
  full_name?: string;
  phone?: string | null;
  role?: 'installer' | 'driver' | 'stonecutter' | 'other';
  notes?: string | null;
  is_active?: boolean;
}

export interface WorkerAvailabilityInsert {
  worker_id: string;
  mon_available?: boolean;
  tue_available?: boolean;
  wed_available?: boolean;
  thu_available?: boolean;
  fri_available?: boolean;
  sat_available?: boolean;
  sun_available?: boolean;
  start_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
}

