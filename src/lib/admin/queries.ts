'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppointmentStatus } from '../types';
import { adminFetch } from './client';
import type {
  AdminAppointment,
  AdminBusiness,
  AdminCustomer,
  AdminProfessional,
  AdminService,
  AdminSlot,
  DashboardSummary,
  Page,
} from './types';

/** Cada 30 s: las reservas hechas desde la web aparecen solas en el panel. */
const LIVE = 30_000;

export const keys = {
  business: ['business'] as const,
  professionals: ['professionals'] as const,
  services: ['services'] as const,
  dashboard: (date?: string) => ['dashboard', date ?? 'today'] as const,
  appointments: (from: string, to: string, professionalId?: string) =>
    ['appointments', from, to, professionalId ?? 'all'] as const,
  customers: (q: string) => ['customers', q] as const,
  slots: (serviceId: string, professionalId: string, date: string) =>
    ['slots', serviceId, professionalId, date] as const,
};

export function useBusiness() {
  return useQuery({
    queryKey: keys.business,
    queryFn: () => adminFetch<AdminBusiness>('/business'),
    staleTime: 5 * 60_000,
  });
}

export function useProfessionals() {
  return useQuery({
    queryKey: keys.professionals,
    queryFn: () =>
      adminFetch<AdminProfessional[]>('/professionals', { query: { includeInactive: 'false' } }),
    staleTime: 5 * 60_000,
  });
}

export function useServices() {
  return useQuery({
    queryKey: keys.services,
    queryFn: () => adminFetch<AdminService[]>('/services', { query: { includeInactive: 'false' } }),
    staleTime: 5 * 60_000,
  });
}

export function useDashboard(date?: string) {
  return useQuery({
    queryKey: keys.dashboard(date),
    queryFn: () => adminFetch<DashboardSummary>('/dashboard/summary', { query: { date } }),
    refetchInterval: LIVE,
  });
}

/** Citas que se cruzan con el rango [from, to) (ISO). */
export function useAppointments(from: string, to: string, professionalId?: string) {
  return useQuery({
    queryKey: keys.appointments(from, to, professionalId),
    queryFn: () =>
      adminFetch<Page<AdminAppointment>>('/appointments', {
        query: { from, to, professionalId, pageSize: '500' },
      }).then((p) => p.items),
    refetchInterval: LIVE,
    placeholderData: (prev) => prev,
  });
}

export function useCustomerSearch(q: string) {
  return useQuery({
    queryKey: keys.customers(q),
    queryFn: () =>
      adminFetch<Page<AdminCustomer>>('/customers', { query: { q, pageSize: '6' } }).then(
        (p) => p.items,
      ),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
  });
}

export function useSlots(serviceId?: string, professionalId?: string, date?: string) {
  return useQuery({
    queryKey: keys.slots(serviceId ?? '', professionalId ?? '', date ?? ''),
    queryFn: () =>
      adminFetch<{ slots: AdminSlot[] }>('/availability', {
        query: { serviceId, professionalId, date },
      }).then((r) => r.slots),
    enabled: !!serviceId && !!professionalId && !!date,
  });
}

/** Tras cualquier cambio en citas: refrescar agenda, calendario y huecos libres. */
function useInvalidateAgenda() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ['appointments'] });
    void qc.invalidateQueries({ queryKey: ['dashboard'] });
    void qc.invalidateQueries({ queryKey: ['slots'] });
  };
}

export function useChangeStatus() {
  const invalidate = useInvalidateAgenda();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: AppointmentStatus;
      reason?: string;
    }) =>
      adminFetch<AdminAppointment>(`/appointments/${id}/status`, {
        method: 'POST',
        body: { status, reason },
      }),
    onSuccess: invalidate,
  });
}

export interface NewAppointmentInput {
  serviceId: string;
  professionalId: string;
  startsAt: string;
  customerId?: string;
  customer?: { name: string; phone: string; email?: string };
  notes?: string;
  internalNotes?: string;
  allowOutsideHours?: boolean;
}

export function useCreateAppointment() {
  const invalidate = useInvalidateAgenda();
  return useMutation({
    mutationFn: (input: NewAppointmentInput) =>
      adminFetch<AdminAppointment>('/appointments', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateAppointment() {
  const invalidate = useInvalidateAgenda();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: { id: string } & Partial<NewAppointmentInput> & Record<string, unknown>) =>
      adminFetch<AdminAppointment>(`/appointments/${id}`, { method: 'PATCH', body }),
    onSuccess: invalidate,
  });
}
