import { TeamTypes } from '~/types/team-types.enum';
import { Team } from '~/types/team.types';
import { axiosInstance } from './axios.config';
import { mockTeams } from './mocks/team.mock';

export const teamsApi = {
  getTeams: async (teamType: TeamTypes): Promise<Team[]> => {
    try {
      const string = teamType ? `?profil=${teamType}` : '';
      const response = await axiosInstance.get<{ data: Team[], meta: {} }>(`/user${string}`)
      const { data, meta } = response.data
      return data;
    } catch (err) {
      console.error('Error in getItems:', err);
      return [];
    }
  },

  getTeam: async (id: string): Promise<Team> => {
    const { data } = await axiosInstance.get<Team>(`/user/${id}`);
    return data;
  },
  
  createItem: async (team: Omit<Team, 'id'>): Promise<Team> => {
    const { data } = await axiosInstance.post<Team>('user', team);
    return data;
  },

  updateItem: async (id: string, team: Partial<Team>): Promise<Team> => {
    const { data } = await axiosInstance.put<Team>(`user/${id}`, team);
    return data;
  },

  deleteItem: async (id: string): Promise<void> => {
    await axiosInstance.delete(`user/${id}`);
  }

};