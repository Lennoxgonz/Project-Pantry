export interface BaseProject {
  id: string;
  name: string;
  description: string | null;
  estimated_time: number | null;
  created_at: string;
  updated_at: string;
}
