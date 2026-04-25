// === RESERVATION TYPES ===
// Types pour l'intégration avec reservation-api

export type ReservationStatus = 'pending' | 'pending_payment' | 'confirmed' | 'cancelled' | 'no_show' | 'completed';

export type CardImprintStatus = 'pending' | 'authorized' | 'captured' | 'released' | 'failed';

export interface CardImprint {
  status: CardImprintStatus;
  amount: number; // in cents
  currency: string;
  cardLast4?: string | null;
  cardBrand?: string | null;
  authorizedAt?: string | null;
  capturedAt?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
  disputedAt?: string | null;
  disputeReason?: string | null;
  stripeDisputeId?: string | null;
}

export interface StripeConnectStatus {
  connected: boolean;
  onboardingComplete: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted?: boolean;
  requirementsDue?: string[];
  disabledReason?: string | null;
}

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
  cancellationDeadlineHours: number;
  reminderEnabled: boolean;
  reminderHoursBefore: number;
  requireCardGuarantee: boolean;
  noShowFeeAmount: number | null;
  noShowFeeCurrency: string;
  customEmailMessage: string | null;
  notifyProfessionalOnNewReservation: boolean;
  notifyProfessionalOnCancellation: boolean;
}

export interface ReservationProfessionalProfile {
  id: string;
  email: string;
  businessName: string;
  slug: string;
  phone?: string | null;
  address?: string | null;
  // IANA timezone name ("Europe/Paris", "America/Montreal"...) — utilisée pour tout affichage
  // de date/heure côté front afin de refléter le fuseau réel du resto.
  timezone: string;
  // false = lien public /book/:slug désactivé temporairement
  bookingEnabled: boolean;
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
  cardImprint?: CardImprint | null;
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

export interface CreateManualReservationDto {
  serviceId: string;
  date: string;       // YYYY-MM-DD
  timeSlot: string;   // HH:mm
  partySize: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
  forceOverCapacity?: boolean;
}

export interface UpdateReservationSettingsDto {
  minNoticeHours?: number;
  maxAdvanceDays?: number;
  minPartySize?: number;
  maxPartySize?: number;
  cancellationDeadlineHours?: number;
  reminderEnabled?: boolean;
  reminderHoursBefore?: number;
  requireCardGuarantee?: boolean;
  noShowFeeAmount?: number | null;
  noShowFeeCurrency?: string;
  customEmailMessage?: string | null;
  notifyProfessionalOnNewReservation?: boolean;
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
  | 'reservation.completed'
  | 'reservation.updated'
  | 'reservation.dispute_opened';

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
    cardImprint?: CardImprint | null;
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
