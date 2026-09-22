/** Tipos de las respuestas públicas de la API (ver back: /api/docs). */

export type BusinessType = 'BARBERSHOP' | 'SALON' | 'SPA' | 'NAILS' | 'AESTHETICS' | 'OTHER';
export type BrandPreset = 'studio' | 'barber' | 'spa' | 'nails' | 'beauty';

export interface OpeningDay {
  weekday: number;
  closed: boolean;
  open: string;
  close: string;
}

export interface BusinessProfile {
  slug: string;
  name: string;
  type: BusinessType;
  description: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  currency: string;
  locale: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  branding: {
    preset: BrandPreset;
    primaryColor: string;
    secondaryColor: string;
    fontPreset: 'editorial' | 'modern' | 'classic';
    heroTitle: string;
    heroSubtitle: string;
    animations: boolean;
  };
  social: Partial<Record<'instagram' | 'facebook' | 'tiktok' | 'whatsapp' | 'website', string>>;
  openingHours: OpeningDay[];
  onlinePayments?: boolean;
  booking: {
    slotStepMinutes: number;
    minAdvanceMinutes: number;
    maxAdvanceDays: number;
    cancellationWindowHours: number;
    paymentMode: 'NONE' | 'OPTIONAL' | 'REQUIRED';
  };
}

export interface PublicService {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMinutes: number;
  imageUrl: string | null;
  category: { slug: string; name: string } | null;
}

export interface CatalogGroup {
  slug: string;
  name: string;
  description: string | null;
  services: PublicService[];
}

export interface PublicProfessional {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  bio: string | null;
  photoUrl: string | null;
  specialties: string[];
  social: Record<string, string> | null;
  services: { id: string; slug: string; name: string }[];
}

export interface Slot {
  time: string;
  startsAt: string;
  endsAt: string;
  professionalIds: string[];
}

export interface DaySlots {
  date: string;
  timezone: string;
  durationMinutes: number;
  slots: Slot[];
}

export interface AvailabilityDay {
  date: string;
  available: boolean;
  slots: number;
}

export type AppointmentStatus =
  'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface PublicAppointment {
  id: string;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  serviceName: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  timezone: string;
  notes: string | null;
  customer: { name: string };
  professional: { name: string; title: string | null; photoUrl: string | null };
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  canCancel: boolean;
  cancelDeadline: string;
}

export interface BookingPayload {
  serviceId: string;
  professionalId: string | null;
  startsAt: string;
  customer: { name: string; phone: string; email?: string };
  notes?: string;
}

export interface PublicMessage {
  id: string;
  sender: 'CUSTOMER' | 'STAFF' | 'SYSTEM';
  body: string;
  readAt: string | null;
  createdAt: string;
}
