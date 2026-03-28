// === RESERVATION TYPES ===
// Types pour l'intégration avec reservation-api

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'completed';

export interface ReservationService {
  id: string;
  name: string;
  maxCapacity: number;
  slotIntervalMinutes: number;
  serviceDurationMinutes: number;
  color?: string | null;
  isActive: boolean;
  reservationsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationSchedule {
  id: string;
  serviceId: string;
  service?: ReservationService;
  dayOfWeek: number; // 1=Lundi ... 7=Dimanche
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  createdAt: string;
  updatedAt: string;
}

export interface ReservationOverride {
  id: string;
  date: string; // YYYY-MM-DD
  isClosed: boolean;
  startTime?: string | null; // HH:MM
  endTime?: string | null;   // HH:MM
  serviceId?: string | null;
  service?: ReservationService | null;
  reason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationSettings {
  minNoticeHours: number;
  maxAdvanceDays: number;
  minPartySize: number;
  maxPartySize: number;
  autoConfirm: boolean;
  cancellationDeadlineHours: number;
  reminderEnabled: boolean;
  reminderHoursBefore: number;
  requireCardGuarantee: boolean;
  customEmailMessage: string | null;
  notifyProfessionalOnNewReservation: boolean;
  notifyProfessionalOnConfirmation: boolean;
  notifyProfessionalOnCancellation: boolean;
}

export interface ReservationProfessionalProfile {
  id: string;
  email: string;
  businessName: string;
  slug: string;
  phone?: string | null;
  address?: string | null;
  settings: ReservationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationGuest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
}

export interface Reservation {
  id: string;
  serviceId: string | null;
  service?: ReservationService | null;
  date: string;       // YYYY-MM-DD or ISO string
  timeSlot: string;   // HH:MM
  partySize: number;
  status: ReservationStatus;
  guest: ReservationGuest;
  guestId: string;
  professionalId: string;
  notes?: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// === CREATE/UPDATE DTOs ===

export interface CreateReservationServiceDto {
  name: string;
  maxCapacity: number;
  slotIntervalMinutes: number;
  serviceDurationMinutes: number;
  color?: string;
  isActive?: boolean;
}

export interface UpdateReservationServiceDto {
  name?: string;
  maxCapacity?: number;
  slotIntervalMinutes?: number;
  serviceDurationMinutes?: number;
  color?: string;
  isActive?: boolean;
}

export interface CreateReservationScheduleDto {
  serviceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface UpdateReservationScheduleDto {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
}

export interface CreateReservationOverrideDto {
  date: string;
  isClosed: boolean;
  startTime?: string;
  endTime?: string;
  serviceId?: string;
  reason?: string;
}

export interface UpdateReservationOverrideDto {
  isClosed?: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface UpdateReservationSettingsDto {
  minNoticeHours?: number;
  maxAdvanceDays?: number;
  minPartySize?: number;
  maxPartySize?: number;
  autoConfirm?: boolean;
  cancellationDeadlineHours?: number;
  reminderEnabled?: boolean;
  reminderHoursBefore?: number;
  requireCardGuarantee?: boolean;
  customEmailMessage?: string | null;
  notifyProfessionalOnNewReservation?: boolean;
  notifyProfessionalOnConfirmation?: boolean;
  notifyProfessionalOnCancellation?: boolean;
}

// === API Response types ===

export interface ReservationApiResponse<T> {
  data: T;
}

export interface ReservationApiListResponse<T> {
  data: T[];
  meta?: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  };
}

// === Activation ===

export interface ReservationActivationResponse {
  success: boolean;
}

export interface ReservationTokenResponse {
  token: string | null;
  professionalId: string | null;
  slug: string | null;
}

// === WebSocket Event ===

export type ReservationEventType =
  | 'reservation.created'
  | 'reservation.confirmed'
  | 'reservation.cancelled'
  | 'reservation.no_show'
  | 'reservation.completed';

export interface ReservationWebSocketEvent {
  event: ReservationEventType;
  reservation: {
    id: string;
    professionalId: string;
    serviceId: string;
    guestId: string;
    date: string;
    timeSlot: string;
    partySize: number;
    status: ReservationStatus;
    notes: string | null;
    cancellationReason: string | null;
    cancelledAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  guest: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  service: {
    id: string;
    name: string;
    serviceDurationMinutes: number;
    color: string | null;
  };
}
