// types/company-config.ts

export type SlideItem = {
  image_url: string;
  title: string;
  subtitle: string;
};

export type CompanyConfig = {
  id?: number;
  // Identitas
  company_name: string;
  company_short: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  // Aplikasi
  app_name: string;
  tagline: string;
  logo_url: string;
  // Branding
  primary_color: string;
  accent_color: string;
  // Login
  login_theme: 'ThemeModern' | 'ThemeMinimal' | 'ThemeDark' | 'ThemeFullBg' | 'ThemeNebula' | 'ThemeCard';
  login_slides: SlideItem[];
};

export type LoginConfig = Pick<
  CompanyConfig,
  | 'app_name'
  | 'tagline'
  | 'company_name'
  | 'logo_url'
  | 'primary_color'
  | 'accent_color'
  | 'login_theme'
  | 'login_slides'
>;

export const DEFAULT_CONFIG: CompanyConfig = {
  company_name: 'PT Yusen Logistics Interlink Indonesia',
  company_short: 'Yusen Logistics',
  address: '',
  phone: '',
  email: '',
  website: '',
  app_name: 'YuTrackWMS',
  tagline: 'Track Everything in Warehouse',
  logo_url: '/images/wms.png',
  primary_color: '#041F5F',
  accent_color: '#1A50C8',
  login_theme: 'ThemeModern',
  login_slides: [],
};