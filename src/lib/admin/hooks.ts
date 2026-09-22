'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppointmentStatus, BusinessProfile } from '../types';
import { adminFetch } from './client';
import type {
  ProfessionalAccess,
  AdminAppointment,
  AdminBusiness,
  AdminProfessional,
  AdminService,
  Page,
} from './types';

/* Hooks del panel para módulos de administración. Cada mutación invalida lo que cambia. */

// ───────────── tipos ─────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  _count: { services: number };
}

export interface ServiceFull extends AdminService {
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  _count: { professionals: number };
}

export interface ProfessionalFull extends AdminProfessional {
  bio: string | null;
  specialties: string[];
  social: Record<string, string> | null;
  access: ProfessionalAccess;
  account: { email: string; isActive: boolean } | null;
}

export interface TimeOff {
  id: string;
  professionalId: string | null;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  professional: { id: string; name: string } | null;
}

export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
  appointmentsCount: number;
  lastAppointmentAt: string | null;
}

export interface CustomerDetail extends Omit<
  CustomerRow,
  'appointmentsCount' | 'lastAppointmentAt'
> {
  stats: {
    appointments: number;
    completed: number;
    cancelled: number;
    noShow: number;
    totalSpentCents: number;
    lastAppointmentAt: string | null;
  };
  nextAppointment: {
    id: string;
    startsAt: string;
    serviceNameSnapshot: string;
    professional: { name: string };
  } | null;
}

export interface CustomerAppointment {
  id: string;
  startsAt: string;
  status: AppointmentStatus;
  serviceNameSnapshot: string;
  priceCents: number;
  professional: { id: string; name: string };
}

export interface ChatMessage {
  id: string;
  sender: 'CUSTOMER' | 'STAFF' | 'SYSTEM';
  body: string;
  readAt: string | null;
  createdAt: string;
  user?: { name: string } | null;
}

export interface ConversationRow {
  id: string;
  channel: string;
  unreadForBusiness: number;
  lastMessageAt: string | null;
  customer: { id: string; name: string; phone: string };
  lastMessage: ChatMessage | null;
}

export interface PaymentRow {
  id: string;
  provider: string;
  providerReference: string;
  providerTransactionId: string | null;
  amountCents: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  appointment: {
    id: string;
    startsAt: string;
    serviceNameSnapshot: string;
    customer: { name: string; phone: string };
  };
}

export interface WompiConfig {
  provider: string;
  environment: 'SANDBOX' | 'PRODUCTION';
  publicKey: string;
  isEnabled: boolean;
  configuredSecrets: Record<'privateKey' | 'integritySecret' | 'eventsSecret', boolean>;
  usingEnvFallback: boolean;
  webhookUrl: string;
}

export interface Report {
  from: string;
  to: string;
  totals: {
    appointments: number;
    completed: number;
    cancelled: number;
    noShow: number;
    upcoming: number;
    revenueCents: number;
    averageTicketCents: number;
    cancellationRate: number;
  };
  byDay: { date: string; revenueCents: number; appointments: number }[];
  topServices: { name: string; count: number; revenueCents: number }[];
  topProfessionals: {
    professionalId: string;
    name: string;
    color: string;
    completed: number;
    revenueCents: number;
  }[];
}

export interface Settings {
  branding: BusinessProfile['branding'];
  social: BusinessProfile['social'];
  openingHours: BusinessProfile['openingHours'];
  booking: AdminBusiness['settings']['booking'];
}

export interface BusinessInfo {
  id: string;
  slug: string;
  name: string;
  type: BusinessProfile['type'];
  /** Estilo visual de todo el negocio (se elige al registrarse). */
  style: BusinessProfile['style'];
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
  logoUrl: string | null;
  heroImageUrl: string | null;
}

export interface SearchResults {
  customers: { id: string; name: string; phone: string }[];
  appointments: {
    id: string;
    startsAt: string;
    status: AppointmentStatus;
    serviceNameSnapshot: string;
    customer: { name: string };
    professional: { name: string };
  }[];
  professionals: { id: string; name: string; title: string | null }[];
  services: { id: string; name: string; priceCents: number; durationMinutes: number }[];
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, string> | null;
  readAt: string | null;
  createdAt: string;
}

// ───────────── utilidades ─────────────

function useInvalidate(...keys: string[][]) {
  const qc = useQueryClient();
  return () => keys.forEach((k) => void qc.invalidateQueries({ queryKey: k }));
}

const json = (method: string, body?: unknown) => ({ method, body });

// ───────────── citas (lista con filtros) ─────────────

export function useAppointmentList(filters: Record<string, string | undefined>) {
  return useQuery({
    queryKey: ['appointments', 'list', filters],
    queryFn: () => adminFetch<Page<AdminAppointment>>('/appointments', { query: filters }),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

export function useAppointment(id: string | null) {
  return useQuery({
    queryKey: ['appointments', 'detail', id],
    queryFn: () => adminFetch<AdminAppointment>(`/appointments/${id}`),
    enabled: !!id,
  });
}

// ───────────── categorías y servicios ─────────────

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => adminFetch<Category[]>('/categories'),
  });
}

export function useServicesAll() {
  return useQuery({
    queryKey: ['services', 'all'],
    queryFn: () => adminFetch<ServiceFull[]>('/services'),
  });
}

export function useSaveCategory() {
  const invalidate = useInvalidate(['categories'], ['services']);
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id?: string;
      name?: string;
      isActive?: boolean;
      sortOrder?: number;
    }) =>
      adminFetch<Category>(
        id ? `/categories/${id}` : '/categories',
        json(id ? 'PATCH' : 'POST', body),
      ),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidate(['categories'], ['services']);
  return useMutation({
    mutationFn: (id: string) => adminFetch(`/categories/${id}`, json('DELETE')),
    onSuccess: invalidate,
  });
}

export function useSaveService() {
  const invalidate = useInvalidate(['services'], ['categories']);
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: Partial<ServiceFull> & { id?: string; categoryId?: string | null }) =>
      adminFetch<ServiceFull>(
        id ? `/services/${id}` : '/services',
        json(id ? 'PATCH' : 'POST', body),
      ),
    onSuccess: invalidate,
  });
}

export function useDeleteService() {
  const invalidate = useInvalidate(['services'], ['categories']);
  return useMutation({
    mutationFn: (id: string) => adminFetch(`/services/${id}`, json('DELETE')),
    onSuccess: invalidate,
  });
}

// ───────────── profesionales ─────────────

export function useProfessionalsAll() {
  return useQuery({
    queryKey: ['professionals', 'all'],
    queryFn: () => adminFetch<ProfessionalFull[]>('/professionals'),
  });
}

export function useSaveProfessional() {
  const invalidate = useInvalidate(['professionals']);
  return useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown> & { id?: string }) =>
      adminFetch<ProfessionalFull>(
        id ? `/professionals/${id}` : '/professionals',
        json(id ? 'PATCH' : 'POST', body),
      ),
    onSuccess: invalidate,
  });
}

export function useDeleteProfessional() {
  const invalidate = useInvalidate(['professionals']);
  return useMutation({
    mutationFn: (id: string) => adminFetch(`/professionals/${id}`, json('DELETE')),
    onSuccess: invalidate,
  });
}

export function useSetProfessionalServices() {
  const invalidate = useInvalidate(['professionals']);
  return useMutation({
    mutationFn: ({ id, serviceIds }: { id: string; serviceIds: string[] }) =>
      adminFetch(`/professionals/${id}/services`, json('PUT', { serviceIds })),
    onSuccess: invalidate,
  });
}

export function useSetWorkingHours() {
  const invalidate = useInvalidate(['professionals'], ['slots']);
  return useMutation({
    mutationFn: ({
      id,
      days,
    }: {
      id: string;
      days: { weekday: number; ranges: { start: string; end: string }[] }[];
    }) => adminFetch(`/professionals/${id}/working-hours`, json('PUT', { days })),
    onSuccess: invalidate,
  });
}

/** Invita al profesional: recibe un correo y elige su propia contraseña. */
export function useInviteProfessional() {
  const invalidate = useInvalidate(['professionals']);
  return useMutation({
    mutationFn: ({
      id,
      email,
      access,
    }: {
      id: string;
      email: string;
      access?: Partial<ProfessionalAccess>;
    }) => adminFetch(`/professionals/${id}/invite`, json('POST', { email, access })),
    onSuccess: invalidate,
  });
}

export function useResendInvitation() {
  const invalidate = useInvalidate(['professionals']);
  return useMutation({
    mutationFn: (id: string) => adminFetch(`/professionals/${id}/invite/resend`, json('POST', {})),
    onSuccess: invalidate,
  });
}

export function useRevokeAccess() {
  const invalidate = useInvalidate(['professionals']);
  return useMutation({
    mutationFn: (id: string) => adminFetch(`/professionals/${id}/access`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}

export function useUpdateAccess() {
  const invalidate = useInvalidate(['professionals']);
  return useMutation({
    mutationFn: ({ id, access }: { id: string; access: ProfessionalAccess }) =>
      adminFetch(`/professionals/${id}/access`, json('PATCH', { access })),
    onSuccess: invalidate,
  });
}

// ───────────── Suscripción con la plataforma ─────────────

export interface Subscription {
  subscriptionStatus: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
  subscriptionPlan: 'MONTHLY' | 'YEARLY' | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  daysLeft: number;
  prices: { MONTHLY: number; YEARLY: number };
  canPayOnline: boolean;
  payments: {
    id: string;
    plan: 'MONTHLY' | 'YEARLY';
    amountCents: number;
    currency: string;
    paidAt: string | null;
  }[];
}

export function useSubscription(enabled = true) {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: () => adminFetch<Subscription>('/subscription'),
    enabled,
    staleTime: 60_000,
  });
}

export function useSubscriptionCheckout() {
  return useMutation({
    mutationFn: (plan: 'MONTHLY' | 'YEARLY') =>
      adminFetch<{ url: string }>('/subscription/checkout', json('POST', { plan })),
  });
}

export function useVerifySubscription() {
  const invalidate = useInvalidate(['subscription']);
  return useMutation({
    mutationFn: (transactionId: string) =>
      adminFetch<Subscription>('/subscription/verify', json('POST', { transactionId })),
    onSuccess: invalidate,
  });
}

export function useTimeOff(professionalId?: string) {
  return useQuery({
    queryKey: ['time-off', professionalId ?? 'all'],
    queryFn: () => adminFetch<TimeOff[]>('/time-off', { query: { professionalId } }),
  });
}

export function useSaveTimeOff() {
  const invalidate = useInvalidate(['time-off'], ['slots']);
  return useMutation({
    mutationFn: (body: {
      professionalId: string | null;
      startsAt: string;
      endsAt: string;
      reason?: string;
    }) =>
      adminFetch<TimeOff & { conflictingAppointments: number }>('/time-off', json('POST', body)),
    onSuccess: invalidate,
  });
}

export function useDeleteTimeOff() {
  const invalidate = useInvalidate(['time-off'], ['slots']);
  return useMutation({
    mutationFn: (id: string) => adminFetch(`/time-off/${id}`, json('DELETE')),
    onSuccess: invalidate,
  });
}

// ───────────── clientes ─────────────

export function useCustomers(q: string, page: number) {
  return useQuery({
    queryKey: ['customers', 'list', q, page],
    queryFn: () =>
      adminFetch<Page<CustomerRow>>('/customers', {
        query: { q: q || undefined, page: String(page), pageSize: '30' },
      }),
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: ['customers', 'detail', id],
    queryFn: () => adminFetch<CustomerDetail>(`/customers/${id}`),
    enabled: !!id,
  });
}

export function useCustomerHistory(id: string | null) {
  return useQuery({
    queryKey: ['customers', 'history', id],
    queryFn: () =>
      adminFetch<Page<CustomerAppointment>>(`/customers/${id}/appointments`, {
        query: { pageSize: '50' },
      }),
    enabled: !!id,
  });
}

export function useSaveCustomer() {
  const invalidate = useInvalidate(['customers']);
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id?: string;
      name?: string;
      phone?: string;
      email?: string | null;
      notes?: string | null;
    }) =>
      adminFetch<CustomerRow>(
        id ? `/customers/${id}` : '/customers',
        json(id ? 'PATCH' : 'POST', body),
      ),
    onSuccess: invalidate,
  });
}

// ───────────── mensajes ─────────────

export function useUnreadMessages(enabled = true) {
  return useQuery({
    queryKey: ['conversations', 'unread'],
    queryFn: () => adminFetch<{ unread: number }>('/conversations/unread').then((r) => r.unread),
    refetchInterval: 15_000,
    enabled,
  });
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations', 'list'],
    queryFn: () => adminFetch<ConversationRow[]>('/conversations'),
    refetchInterval: 10_000,
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: ['conversations', 'thread', id],
    queryFn: () =>
      adminFetch<{
        conversation: { id: string; customer: { id: string; name: string; phone: string } };
        messages: ChatMessage[];
      }>(`/conversations/${id}/messages`),
    enabled: !!id,
    refetchInterval: 8_000,
  });
}

export function useSendMessage() {
  const invalidate = useInvalidate(['conversations']);
  return useMutation({
    mutationFn: ({ conversationId, body }: { conversationId: string; body: string }) =>
      adminFetch<ChatMessage>(`/conversations/${conversationId}/messages`, json('POST', { body })),
    onSuccess: invalidate,
  });
}

export function useStartConversation() {
  const invalidate = useInvalidate(['conversations']);
  return useMutation({
    mutationFn: (body: { customerId: string; body: string }) =>
      adminFetch<{ conversationId: string }>('/conversations', json('POST', body)),
    onSuccess: invalidate,
  });
}

export function useMarkConversationRead() {
  const invalidate = useInvalidate(['conversations']);
  return useMutation({
    mutationFn: (id: string) => adminFetch(`/conversations/${id}/read`, json('POST')),
    onSuccess: invalidate,
  });
}

// ───────────── avisos ─────────────

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => adminFetch<{ items: NotificationItem[]; unread: number }>('/notifications'),
    refetchInterval: 20_000,
    enabled,
  });
}

export function useMarkNotificationsRead() {
  const invalidate = useInvalidate(['notifications']);
  return useMutation({
    mutationFn: () => adminFetch('/notifications/read', json('POST')),
    onSuccess: invalidate,
  });
}

// ───────────── pagos ─────────────

export function usePayments(status?: string) {
  return useQuery({
    queryKey: ['payments', status ?? 'all'],
    queryFn: () =>
      adminFetch<Page<PaymentRow>>('/payments', { query: { status, pageSize: '100' } }),
  });
}

export function useWompiConfig(enabled: boolean) {
  return useQuery({
    queryKey: ['payments', 'wompi'],
    queryFn: () => adminFetch<WompiConfig>('/payments/settings/wompi'),
    enabled,
  });
}

export function useSaveWompi() {
  const invalidate = useInvalidate(['payments']);
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      adminFetch<WompiConfig>('/payments/settings/wompi', json('PUT', body)),
    onSuccess: invalidate,
  });
}

export function useMarkRefunded() {
  const invalidate = useInvalidate(['payments']);
  return useMutation({
    mutationFn: (id: string) => adminFetch(`/payments/${id}/refunded`, json('POST')),
    onSuccess: invalidate,
  });
}

// ───────────── reportes, búsqueda ─────────────

export function useReport(from: string, to: string) {
  return useQuery({
    queryKey: ['reports', from, to],
    queryFn: () => adminFetch<Report>('/reports', { query: { from, to } }),
    placeholderData: keepPreviousData,
  });
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ['search', q],
    queryFn: () => adminFetch<SearchResults>('/search', { query: { q } }),
    enabled: q.trim().length >= 2,
    staleTime: 15_000,
  });
}

// ───────────── configuración ─────────────

export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: () => adminFetch<Settings>('/settings') });
}

export function useBusinessInfo() {
  return useQuery({
    queryKey: ['business', 'info'],
    queryFn: () => adminFetch<BusinessInfo>('/business'),
  });
}

export function useSaveSettings() {
  const invalidate = useInvalidate(['settings'], ['business'], ['slots']);
  return useMutation({
    mutationFn: ({
      section,
      value,
    }: {
      section: 'branding' | 'social' | 'openingHours' | 'booking';
      value: unknown;
    }) => adminFetch<Settings>(`/settings/${section}`, json('PATCH', value)),
    onSuccess: invalidate,
  });
}

export function useSaveBusiness() {
  const invalidate = useInvalidate(['business']);
  return useMutation({
    mutationFn: (body: Partial<BusinessInfo>) =>
      adminFetch<BusinessInfo>('/business', json('PATCH', body)),
    onSuccess: invalidate,
  });
}

/** Sube una imagen y devuelve su URL pública. */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await adminFetch<{ url: string }>('/uploads', { method: 'POST', body: form });
  return res.url;
}
