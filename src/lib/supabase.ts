import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types matching our local schema
export interface CloudMenuItem {
  id: string;
  name: string;
  price: number;
  category: 'veg' | 'non-veg';
  active: boolean;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CloudOrder {
  id: string;
  menu_item_id: string;
  quantity: number;
  total_price: number;
  timestamp: string;
  device_id: string | null;
  created_at: string;
}
