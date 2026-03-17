import { User } from '~/types/user.types';
import { TeamFilterState } from '~/components/filters/TeamFilters';

/**
 * Filtre une liste d'utilisateurs selon le nom
 */
export const filterTeamUsers = (users: User[], filters: TeamFilterState): User[] => {
  if (!filters.name) return users;
  const search = filters.name.toLowerCase();
  return users.filter(user => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').toLowerCase();
    return fullName.includes(search);
  });
};

/**
 * Crée un état de filtres vide
 */
export const createEmptyTeamFilters = (): TeamFilterState => ({
  name: '',
});