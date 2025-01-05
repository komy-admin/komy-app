import { Team } from '~/types/team.types';
import { axiosInstance } from '~/api/axios.config';

export const teamsApi = {
  getTeams: async (params: any): Promise<{ data: Team[], meta: {} }> => {
    try {
      const response = await axiosInstance.get<{ data: Team[], meta: {} }>(`/user?${params}`)
      const { data, meta } = response.data
      return { data, meta };
    } catch (err) {
      console.error('Error in getItems:', err);
      return { data: [], meta: {} };
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