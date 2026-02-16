export interface MasterCarton {
  id: number;
  carton_code: string;
  carton_name: string;
  description: string;
  length: number;
  width: number;
  height: number;
  max_weight: number;
  tare_weight: number;
  volume: number;
  is_default: boolean;
  material: string;
  dimensions?: string;
  display_name?: string;
}