import { TeamTypes } from '~/types/team-types.enum';
import { Team } from '~/types/team.types';
import { mockTeams } from './mocks/team.mock';

export const teamsApi = {
  getTeams: async (teamType: TeamTypes): Promise<Team[]> => {
    try {
      if (teamType === TeamTypes.ALL) {
        return mockTeams
      }
      // Filtrer par type spécifique
      return mockTeams.filter((team) => team.teamType === teamType);
    } catch (err) {
      console.error('Error in getTeams:', err);
      return [];
    }
  },
};