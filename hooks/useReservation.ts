import { useState, useCallback, useEffect, useRef, useContext } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';
import { reservationBridgeApiService, reservationApiService } from '~/api/reservation.api';
import { SocketContext } from '~/hooks/useSocket/SockerProvider';
import { useToast } from '~/components/ToastProvider';
import {
  ReservationService,
  ReservationSchedule,
  ReservationOverride,
  ReservationProfessionalProfile,
  Reservation,
  CreateReservationServiceDto,
  UpdateReservationServiceDto,
  CreateReservationScheduleDto,
  UpdateReservationScheduleDto,
  CreateReservationOverrideDto,
  UpdateReservationOverrideDto,
  UpdateReservationSettingsDto,
  ReservationApiListResponse,
  ReservationWebSocketEvent,
  StripeConnectStatus,
} from '~/types/reservation.types';

const RESERVATION_EVENT = 'reservation_event';

function getToastForEvent(event: ReservationWebSocketEvent): { message: string; type: 'success' | 'info' | 'warning' | 'error' } {
  const name = `${event.guest.firstName} ${event.guest.lastName}`;
  switch (event.event) {
    case 'reservation.created':
      return { message: `Nouvelle réservation de ${name} le ${event.reservation.date} à ${event.reservation.timeSlot} (${event.reservation.partySize} pers.)`, type: 'info' };
    case 'reservation.confirmed':
      return { message: `Réservation de ${name} confirmée`, type: 'success' };
    case 'reservation.cancelled':
      return { message: `Réservation de ${name} annulée`, type: 'warning' };
    case 'reservation.no_show':
      return { message: `No-show : ${name}`, type: 'error' };
    case 'reservation.completed':
      return { message: `Réservation de ${name} terminée`, type: 'success' };
    case 'reservation.updated': {
      const cardStatus = event.reservation.cardImprint?.status;
      if (cardStatus === 'failed') {
        return { message: `Échec empreinte bancaire pour ${name}`, type: 'error' };
      }
      if (cardStatus === 'authorized') {
        return { message: `Empreinte bancaire autorisée pour ${name}`, type: 'success' };
      }
      return { message: `Réservation de ${name} mise à jour`, type: 'info' };
    }
    default:
      return { message: `Événement réservation : ${name}`, type: 'info' };
  }
}

interface ReservationState {
  isActivated: boolean;
  isLoading: boolean;
  token: string | null;
  professionalId: string | null;
  slug: string | null;
  profile: ReservationProfessionalProfile | null;
  stripeStatus: StripeConnectStatus | null;
  services: ReservationService[];
  schedules: ReservationSchedule[];
  overrides: ReservationOverride[];
  reservations: Reservation[];
  reservationsMeta: ReservationApiListResponse<Reservation>['meta'] | null;
}

export const useReservation = () => {
  const user = useSelector((state: RootState) => state.session.user);
  const sessionToken = useSelector((state: RootState) => state.session.sessionToken);
  const restaurantId = user?.accountId || '';
  const { showToast } = useToast();
  const socketContext = useContext(SocketContext);

  const [state, setState] = useState<ReservationState>({
    isActivated: false,
    isLoading: true,
    token: null,
    professionalId: null,
    slug: null,
    profile: null,
    stripeStatus: null,
    services: [],
    schedules: [],
    overrides: [],
    reservations: [],
    reservationsMeta: null,
  });

  const lastReservationParams = useRef<{ date?: string; status?: string; serviceId?: string; page?: number; limit?: number } | undefined>(undefined);

  // === INITIALIZATION: Fetch token from fork-it-api ===

  const initialize = useCallback(async () => {
    if (!restaurantId) return;

    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const tokenData = await reservationBridgeApiService.getToken(restaurantId);

      if (tokenData.token) {
        reservationApiService.setToken(tokenData.token);
        setState(prev => ({
          ...prev,
          isActivated: true,
          token: tokenData.token,
          professionalId: tokenData.professionalId,
          slug: tokenData.slug,
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isActivated: false,
          token: null,
          professionalId: null,
          slug: null,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Error fetching reservation token:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId && sessionToken) {
      initialize();
    }
  }, [initialize, restaurantId, sessionToken]);

  // === ACTIVATION ===

  const activate = useCallback(async () => {
    if (!restaurantId) return;
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await reservationBridgeApiService.activate(restaurantId);
      await initialize();
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [restaurantId, initialize]);

  const deactivate = useCallback(async () => {
    if (!restaurantId) return;
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await reservationBridgeApiService.deactivate(restaurantId);
      reservationApiService.setToken(null);
      setState(prev => ({
        ...prev,
        isActivated: false,
        token: null,
        professionalId: null,
        slug: null,
        profile: null,
        stripeStatus: null,
        services: [],
        schedules: [],
        overrides: [],
        reservations: [],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [restaurantId]);

  // === PROFILE ===

  const loadProfile = useCallback(async () => {
    try {
      const profile = await reservationApiService.getProfile();
      setState(prev => ({ ...prev, profile }));
      return profile;
    } catch (error) {
      console.error('Error loading profile:', error);
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (data: { businessName?: string; email?: string; phone?: string; address?: string }) => {
    const profile = await reservationApiService.updateProfile(data);
    setState(prev => ({ ...prev, profile }));
    return profile;
  }, []);

  // === SERVICES ===

  const loadServices = useCallback(async () => {
    try {
      const services = await reservationApiService.getServices();
      setState(prev => ({ ...prev, services }));
      return services;
    } catch (error) {
      console.error('Error loading services:', error);
      throw error;
    }
  }, []);

  const createService = useCallback(async (data: CreateReservationServiceDto) => {
    const service = await reservationApiService.createService(data);
    setState(prev => ({ ...prev, services: [...prev.services, service] }));
    return service;
  }, []);

  const updateService = useCallback(async (id: string, data: UpdateReservationServiceDto) => {
    const service = await reservationApiService.updateService(id, data);
    setState(prev => ({
      ...prev,
      services: prev.services.map(s => s.id === id ? service : s),
    }));
    return service;
  }, []);

  const deleteService = useCallback(async (id: string) => {
    await reservationApiService.deleteService(id);
    setState(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== id),
    }));
  }, []);

  // === SCHEDULES ===

  const loadSchedules = useCallback(async () => {
    try {
      const schedules = await reservationApiService.getSchedules();
      setState(prev => ({ ...prev, schedules }));
      return schedules;
    } catch (error) {
      console.error('Error loading schedules:', error);
      throw error;
    }
  }, []);

  const createSchedule = useCallback(async (data: CreateReservationScheduleDto) => {
    const schedule = await reservationApiService.createSchedule(data);
    setState(prev => ({ ...prev, schedules: [...prev.schedules, schedule] }));
    return schedule;
  }, []);

  const updateSchedule = useCallback(async (id: string, data: UpdateReservationScheduleDto) => {
    const schedule = await reservationApiService.updateSchedule(id, data);
    setState(prev => ({
      ...prev,
      schedules: prev.schedules.map(s => s.id === id ? schedule : s),
    }));
    return schedule;
  }, []);

  const deleteSchedule = useCallback(async (id: string) => {
    await reservationApiService.deleteSchedule(id);
    setState(prev => ({
      ...prev,
      schedules: prev.schedules.filter(s => s.id !== id),
    }));
  }, []);

  // === OVERRIDES ===

  const loadOverrides = useCallback(async (month?: number, year?: number) => {
    try {
      const overrides = await reservationApiService.getOverrides(month, year);
      setState(prev => ({ ...prev, overrides }));
      return overrides;
    } catch (error) {
      console.error('Error loading overrides:', error);
      throw error;
    }
  }, []);

  const createOverride = useCallback(async (data: CreateReservationOverrideDto) => {
    const override = await reservationApiService.createOverride(data);
    setState(prev => ({ ...prev, overrides: [...prev.overrides, override] }));
    return override;
  }, []);

  const updateOverride = useCallback(async (id: string, data: UpdateReservationOverrideDto) => {
    const override = await reservationApiService.updateOverride(id, data);
    setState(prev => ({
      ...prev,
      overrides: prev.overrides.map(o => o.id === id ? override : o),
    }));
    return override;
  }, []);

  const deleteOverride = useCallback(async (id: string) => {
    await reservationApiService.deleteOverride(id);
    setState(prev => ({
      ...prev,
      overrides: prev.overrides.filter(o => o.id !== id),
    }));
  }, []);

  // === SETTINGS ===

  const updateSettings = useCallback(async (data: UpdateReservationSettingsDto) => {
    const profile = await reservationApiService.updateSettings(data);
    setState(prev => ({ ...prev, profile }));
    return profile;
  }, []);

  // === RESERVATIONS ===

  const loadReservations = useCallback(async (params?: {
    date?: string;
    status?: string;
    serviceId?: string;
    page?: number;
    limit?: number;
  }) => {
    lastReservationParams.current = params;
    try {
      const result = await reservationApiService.getReservations(params);
      setState(prev => ({
        ...prev,
        reservations: result.data,
        reservationsMeta: result.meta || null,
      }));
      return result;
    } catch (error) {
      console.error('Error loading reservations:', error);
      throw error;
    }
  }, []);

  const confirmReservation = useCallback(async (id: string) => {
    const reservation = await reservationApiService.confirmReservation(id);
    setState(prev => ({
      ...prev,
      reservations: prev.reservations.map(r => r.id === id ? { ...r, ...reservation, cardImprint: reservation.cardImprint ?? r.cardImprint } : r),
    }));
    return reservation;
  }, []);

  const cancelReservation = useCallback(async (id: string, reason?: string) => {
    const reservation = await reservationApiService.cancelReservation(id, reason);
    setState(prev => ({
      ...prev,
      reservations: prev.reservations.map(r => r.id === id ? { ...r, ...reservation, cardImprint: reservation.cardImprint ?? r.cardImprint } : r),
    }));
    return reservation;
  }, []);

  const noShowReservation = useCallback(async (id: string, charge?: boolean) => {
    const reservation = await reservationApiService.noShowReservation(id, charge);
    setState(prev => ({
      ...prev,
      reservations: prev.reservations.map(r => r.id === id ? { ...r, ...reservation, cardImprint: reservation.cardImprint ?? r.cardImprint } : r),
    }));
    return reservation;
  }, []);

  const completeReservation = useCallback(async (id: string) => {
    const reservation = await reservationApiService.completeReservation(id);
    setState(prev => ({
      ...prev,
      reservations: prev.reservations.map(r => r.id === id ? { ...r, ...reservation, cardImprint: reservation.cardImprint ?? r.cardImprint } : r),
    }));
    return reservation;
  }, []);

  // === STRIPE CONNECT ===

  const loadStripeStatus = useCallback(async () => {
    try {
      const stripeStatus = await reservationApiService.getStripeStatus();
      setState(prev => ({ ...prev, stripeStatus }));
      return stripeStatus;
    } catch (error) {
      console.error('Error loading Stripe status:', error);
      throw error;
    }
  }, []);

  const getStripeConnectLink = useCallback(async (returnUrl: string) => {
    return reservationApiService.getStripeConnectLink(returnUrl);
  }, []);

  const disconnectStripe = useCallback(async () => {
    await reservationApiService.disconnectStripe();
    setState(prev => ({
      ...prev,
      stripeStatus: { connected: false, accountId: null, chargesEnabled: false, payoutsEnabled: false },
    }));
  }, []);

  // === WEBSOCKET: écoute temps réel des événements de réservation ===

  const showToastRef = useRef(showToast);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);

  useEffect(() => {
    if (!socketContext?.socket || !socketContext.isConnected) return;

    const socket = socketContext.socket.getSocket();
    if (!socket) return;

    const handler = (data: ReservationWebSocketEvent) => {
      const { reservation: resData, guest, service } = data;

      const fullReservation: Reservation = {
        id: resData.id,
        serviceId: resData.serviceId,
        service: {
          id: service.id,
          name: service.name,
          serviceDurationMinutes: service.serviceDurationMinutes,
          color: service.color,
          maxCapacity: 0,
          slotIntervalMinutes: 0,
          isActive: true,
          createdAt: '',
          updatedAt: '',
        },
        date: resData.date,
        timeSlot: resData.timeSlot,
        partySize: resData.partySize,
        status: resData.status,
        guest: {
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone,
        },
        guestId: resData.guestId,
        professionalId: resData.professionalId,
        notes: resData.notes,
        cancellationReason: resData.cancellationReason,
        cancelledAt: resData.cancelledAt,
        cardImprint: resData.cardImprint ?? null,
        createdAt: resData.createdAt,
        updatedAt: resData.updatedAt,
      };

      if (data.event === 'reservation.created') {
        loadReservations(lastReservationParams.current).catch(() => {});
      } else {
        setState(prev => ({
          ...prev,
          reservations: prev.reservations.map(r =>
            r.id === fullReservation.id ? fullReservation : r
          ),
        }));
      }

      const toast = getToastForEvent(data);
      showToastRef.current(toast.message, toast.type);
    };

    socket.on(RESERVATION_EVENT, handler);
    return () => { socket.off(RESERVATION_EVENT, handler); };
  }, [socketContext?.socket, socketContext?.isConnected]);

  return {
    // State
    ...state,

    // Initialization
    initialize,

    // Activation
    activate,
    deactivate,

    // Profile
    loadProfile,
    updateProfile,

    // Services
    loadServices,
    createService,
    updateService,
    deleteService,

    // Schedules
    loadSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,

    // Overrides
    loadOverrides,
    createOverride,
    updateOverride,
    deleteOverride,

    // Settings
    updateSettings,

    // Stripe Connect
    loadStripeStatus,
    getStripeConnectLink,
    disconnectStripe,

    // Reservations
    loadReservations,
    confirmReservation,
    cancelReservation,
    noShowReservation,
    completeReservation,
  };
};
