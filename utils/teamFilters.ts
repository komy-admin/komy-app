import { User } from '~/types/user.types';
import { TeamFilterState } from '~/components/filters/TeamFilters';

/**
 * Filtre une liste d'utilisateurs selon les critères spécifiés
 */
export const filterTeamUsers = (users: User[], filters: TeamFilterState): User[] => {
  return users.filter(user => {
    const matchesFirstName = !filters.firstName || (user.firstName?.toLowerCase().includes(filters.firstName.toLowerCase()) ?? false);
    const matchesLastName = !filters.lastName || (user.lastName?.toLowerCase().includes(filters.lastName.toLowerCase()) ?? false);
    const matchesEmail = !filters.email || (user.email?.toLowerCase().includes(filters.email.toLowerCase()) ?? false);
    const matchesPhone = !filters.phone || (user.phone?.toString().includes(filters.phone.toString()) ?? false);
    
    return matchesFirstName && matchesLastName && matchesEmail && matchesPhone;
  });
};

/**
 * Crée un état de filtres vide
 */
export const createEmptyTeamFilters = (): TeamFilterState => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
});