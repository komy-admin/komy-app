import { TeamTypes } from "./team.enum";
import { FilterConfig } from '~/types/filter.types';

export type Team = {
  id?: string;
  accountId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profil: TeamTypes;
  password: string;
  loginId: string;
};

export const filterTeam: FilterConfig<Team>[] = [
  { 
    field: 'firstName', 
    type: 'text' as const, 
    label: 'Prénom',
    operator: 'like' as const
  },
  { 
    field: 'lastName', 
    type: 'text' as const, 
    label: 'Nom',
    operator: 'like' as const
  },
  { 
    field: 'email', 
    type: 'text' as const, 
    label: 'Email',
    operator: 'like' as const
  },
  { 
    field: 'phone', 
    type: 'text' as const, 
    label: 'Numéro de téléphone',
    operator: 'like' as const
  },
];