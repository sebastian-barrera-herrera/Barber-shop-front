import type { AppointmentStatus, BusinessProfile } from '../types';

export type Role = 'OWNER' | 'ADMIN' | 'PROFESSIONAL';

/** Qué ve un profesional en el panel; lo define el dueño. */
export interface ProfessionalAccess {
  agenda: 'own' | 'all';
  clients: boolean;
  messages: boolean;
  reports: boolean;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  businessId: string;
  professionalId: string | null;
  access: ProfessionalAccess | null;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'ONLINE' | 'OTHER';

export interface AdminAppointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  source: 'WEB' | 'ADMIN';
  serviceNameSnapshot: string;
  priceCents: number;
  durationMinutes: number;
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: PaymentMethod | null;
  notes: string | null;
  internalNotes: string | null;
  cancelReason: string | null;
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    notes?: string | null;
  };
  professional: { id: string; name: string; color: string; photoUrl?: string | null };
  service: { id: string; name: string };
}

export interface AdminBusiness {
  id: string;
  slug: string;
  name: string;
  /** Estilo visual del negocio: también viste este panel. */
  style: BusinessProfile['style'];
  timezone: string;
  currency: string;
  country: string;
  settings: {
    branding: BusinessProfile['branding'];
    openingHours: BusinessProfile['openingHours'];
    booking: BusinessProfile['booking'] & { bufferMinutes: number; autoConfirm: boolean };
  };
}

export interface AdminProfessional {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  color: string;
  photoUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  services: { id: string; name: string; slug: string }[];
  workingHours: { weekday: number; ranges: { start: string; end: string }[] }[];
}

export interface AdminService {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  durationMinutes: number;
  isActive: boolean;
  category: { id: string; name: string; slug: string } | null;
}

export interface AdminCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  appointmentsCount: number;
  lastAppointmentAt: string | null;
}

export interface DashboardSummary {
  date: string;
  timezone: string;
  today: {
    appointments: number;
    pending: number;
    completed: number;
    cancelled: number;
    noShow: number;
    revenueCents: number;
    expectedRevenueCents: number;
    newCustomers: number;
  };
  activeProfessionals: number;
  agenda: AdminAppointment[];
  revenueByDay: { date: string; revenueCents: number; appointments: number }[];
  popularServices: { serviceId: string; name: string; count: number }[];
}

export interface AdminSlot {
  time: string;
  startsAt: string;
  endsAt: string;
  professionalIds: string[];
}
