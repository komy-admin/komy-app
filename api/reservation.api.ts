import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { store } from '~/store';
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
  ReservationApiResponse,
  ReservationApiListResponse,
  ReservationActivationResponse,
  ReservationTokenResponse,
  StripeConnectStatus,
} from '~/types/reservation.types';
import { BaseApiService } from './base.api';

// === Fork-it-api service (activation & token) ===

class ReservationBridgeApiService extends BaseApiService<any> {
  protected endpoint = '/reservation';

  async activate(restaurantId: string): Promise<ReservationActivationResponse> {
    const response = await this.axiosInstance.post<ReservationActivationResponse>(
      `/restaurants/${restaurantId}/reservation/activate`
    );
    return response.data;
  }

  async getToken(restaurantId: string): Promise<ReservationTokenResponse> {
    const response = await this.axiosInstance.get<ReservationTokenResponse>(
      `/restaurants/${restaurantId}/reservation/token`
    );
    return response.data;
  }

  async deactivate(restaurantId: string): Promise<void> {
    await this.axiosInstance.post(`/restaurants/${restaurantId}/reservation/deactivate`);
  }
}

export const reservationBridgeApiService = new ReservationBridgeApiService();

// === Reservation-api direct service ===

const RESERVATION_API_URL = Platform.select({
  android: `${process.env.EXPO_PUBLIC_RESERVATION_API_URL}/api/v1`,
  ios: `${process.env.EXPO_PUBLIC_RESERVATION_API_URL}/api/v1`,
  web: `${process.env.EXPO_PUBLIC_RESERVATION_API_URL}/api/v1`,
});

class ReservationApiService {
  private axiosInstance: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: RESERVATION_API_URL || 'http://localhost:3334/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.axiosInstance.interceptors.request.use((config) => {
      if (this.token && config.headers) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        // On 401, try to refresh the reservation token once
        if (error.response?.status === 401 && !originalRequest._retried) {
          originalRequest._retried = true;
          try {
            const state = store.getState();
            const restaurantId = state.session.user?.accountId;
            if (restaurantId) {
              const tokenData = await reservationBridgeApiService.getToken(restaurantId);
              if (tokenData.token) {
                this.token = tokenData.token;
                originalRequest.headers.Authorization = `Bearer ${tokenData.token}`;
                return this.axiosInstance(originalRequest);
              }
            }
          } catch {
            // Bridge call also failed (session expired) - let it propagate
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  // === Profile ===

  async getProfile(): Promise<ReservationProfessionalProfile> {
    const response = await this.axiosInstance.get<ReservationApiResponse<ReservationProfessionalProfile>>(
      '/professionals/me'
    );
    return response.data.data;
  }

  async updateProfile(data: { businessName?: string; email?: string; phone?: string; address?: string }): Promise<ReservationProfessionalProfile> {
    const response = await this.axiosInstance.put<ReservationApiResponse<ReservationProfessionalProfile>>(
      '/professionals/me',
      data
    );
    return response.data.data;
  }

  // === Services ===

  async getServices(): Promise<ReservationService[]> {
    const response = await this.axiosInstance.get<ReservationApiResponse<ReservationService[]>>(
      '/professionals/me/services'
    );
    return response.data.data;
  }

  async getService(id: string): Promise<ReservationService> {
    const response = await this.axiosInstance.get<ReservationApiResponse<ReservationService>>(
      `/professionals/me/services/${id}`
    );
    return response.data.data;
  }

  async createService(data: CreateReservationServiceDto): Promise<ReservationService> {
    const response = await this.axiosInstance.post<ReservationApiResponse<ReservationService>>(
      '/professionals/me/services',
      data
    );
    return response.data.data;
  }

  async updateService(id: string, data: UpdateReservationServiceDto): Promise<ReservationService> {
    const response = await this.axiosInstance.put<ReservationApiResponse<ReservationService>>(
      `/professionals/me/services/${id}`,
      data
    );
    return response.data.data;
  }

  async deleteService(id: string): Promise<void> {
    await this.axiosInstance.delete(`/professionals/me/services/${id}`);
  }

  // === Schedules ===

  async getSchedules(): Promise<ReservationSchedule[]> {
    const response = await this.axiosInstance.get<ReservationApiResponse<ReservationSchedule[]>>(
      '/professionals/me/schedules'
    );
    return response.data.data;
  }

  async createSchedule(data: CreateReservationScheduleDto): Promise<ReservationSchedule> {
    const response = await this.axiosInstance.post<ReservationApiResponse<ReservationSchedule>>(
      '/professionals/me/schedules',
      data
    );
    return response.data.data;
  }

  async updateSchedule(id: string, data: UpdateReservationScheduleDto): Promise<ReservationSchedule> {
    const response = await this.axiosInstance.put<ReservationApiResponse<ReservationSchedule>>(
      `/professionals/me/schedules/${id}`,
      data
    );
    return response.data.data;
  }

  async deleteSchedule(id: string): Promise<void> {
    await this.axiosInstance.delete(`/professionals/me/schedules/${id}`);
  }

  // === Overrides ===

  async getOverrides(month?: number, year?: number): Promise<ReservationOverride[]> {
    const params = new URLSearchParams();
    if (month) params.append('month', String(month));
    if (year) params.append('year', String(year));
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await this.axiosInstance.get<ReservationApiResponse<ReservationOverride[]>>(
      `/professionals/me/overrides${query}`
    );
    return response.data.data;
  }

  async createOverride(data: CreateReservationOverrideDto): Promise<ReservationOverride> {
    const response = await this.axiosInstance.post<ReservationApiResponse<ReservationOverride>>(
      '/professionals/me/overrides',
      data
    );
    return response.data.data;
  }

  async updateOverride(id: string, data: UpdateReservationOverrideDto): Promise<ReservationOverride> {
    const response = await this.axiosInstance.put<ReservationApiResponse<ReservationOverride>>(
      `/professionals/me/overrides/${id}`,
      data
    );
    return response.data.data;
  }

  async deleteOverride(id: string): Promise<void> {
    await this.axiosInstance.delete(`/professionals/me/overrides/${id}`);
  }

  // === Settings ===

  async updateSettings(data: UpdateReservationSettingsDto): Promise<ReservationProfessionalProfile> {
    const response = await this.axiosInstance.put<ReservationApiResponse<ReservationProfessionalProfile>>(
      '/professionals/me/settings',
      data
    );
    return response.data.data;
  }

  // === Reservations ===

  async getReservations(params?: {
    date?: string;
    status?: string;
    serviceId?: string;
    page?: number;
    limit?: number;
  }): Promise<ReservationApiListResponse<Reservation>> {
    const searchParams = new URLSearchParams();
    if (params?.date) searchParams.append('date', params.date);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.serviceId) searchParams.append('serviceId', params.serviceId);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await this.axiosInstance.get<ReservationApiListResponse<Reservation>>(
      `/professionals/me/reservations${query}`
    );
    return response.data;
  }

  async getReservation(id: string): Promise<Reservation> {
    const response = await this.axiosInstance.get<ReservationApiResponse<Reservation>>(
      `/professionals/me/reservations/${id}`
    );
    return response.data.data;
  }

  async confirmReservation(id: string): Promise<Reservation> {
    const response = await this.axiosInstance.post<ReservationApiResponse<Reservation>>(
      `/professionals/me/reservations/${id}/confirm`
    );
    return response.data.data;
  }

  async cancelReservation(id: string, reason?: string): Promise<Reservation> {
    const response = await this.axiosInstance.post<ReservationApiResponse<Reservation>>(
      `/professionals/me/reservations/${id}/cancel`,
      reason ? { reason } : undefined
    );
    return response.data.data;
  }

  async noShowReservation(id: string, charge?: boolean): Promise<Reservation> {
    const response = await this.axiosInstance.post<ReservationApiResponse<Reservation>>(
      `/professionals/me/reservations/${id}/no-show`,
      charge !== undefined ? { charge } : undefined
    );
    return response.data.data;
  }

  async completeReservation(id: string): Promise<Reservation> {
    const response = await this.axiosInstance.post<ReservationApiResponse<Reservation>>(
      `/professionals/me/reservations/${id}/complete`
    );
    return response.data.data;
  }

  // === Stripe Connect ===

  async getStripeStatus(): Promise<StripeConnectStatus> {
    const response = await this.axiosInstance.get<ReservationApiResponse<StripeConnectStatus>>(
      '/professionals/me/stripe/connect/status'
    );
    return response.data.data;
  }

  async getStripeConnectLink(returnUrl: string): Promise<{ url: string }> {
    const response = await this.axiosInstance.post<ReservationApiResponse<{ url: string }>>(
      '/professionals/me/stripe/connect/link',
      { returnUrl }
    );
    return response.data.data;
  }

  async disconnectStripe(): Promise<void> {
    await this.axiosInstance.delete('/professionals/me/stripe/connect');
  }
}

export const reservationApiService = new ReservationApiService();
