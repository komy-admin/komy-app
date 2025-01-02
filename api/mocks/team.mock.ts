import { TeamTypes } from "~/types/team-types.enum";
import { Team } from "~/types/team.types";

export const mockTeams: Team[] = [
  // MANAGERS
  {
    id: "1",
    firstname: "Alice",
    lastname: "Dupont",
    email: "alice.dupont@example.com",
    phone: 1234567890,
    teamType: TeamTypes.MANAGER,
    account: "FORKIT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    firstname: "Bob",
    lastname: "Martin",
    email: "bob.martin@example.com",
    phone: 9876543210,
    teamType: TeamTypes.MANAGER,
    account: "FORKIT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // SERVEURS
  {
    id: "3",
    firstname: "Charlie",
    lastname: "Durand",
    email: "charlie.durand@example.com",
    phone: 1122334455,
    teamType: TeamTypes.SERVEUR,
    account: "FORKIT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    firstname: "Diana",
    lastname: "Morel",
    email: "diana.morel@example.com",
    phone: 9988776655,
    teamType: TeamTypes.SERVEUR,
    account: "FORKIT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // CUISTOS
  {
    id: "5",
    firstname: "Eve",
    lastname: "Lemoine",
    email: "eve.lemoine@example.com",
    phone: 3344556677,
    teamType: TeamTypes.CUISTO,
    account: "FORKIT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "6",
    firstname: "Frank",
    lastname: "Blanc",
    email: "frank.blanc@example.com",
    phone: 7766554433,
    teamType: TeamTypes.CUISTO,
    account: "FORKIT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // MIXED ROLES (ALL)
  {
    id: "7",
    firstname: "Grace",
    lastname: "Noir",
    email: "grace.noir@example.com",
    phone: 5566778899,
    teamType: TeamTypes.CUISTO,
    account: "FORKIT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "8",
    firstname: "Hugo",
    lastname: "Vert",
    email: "hugo.vert@example.com",
    phone: 2233445566,
    teamType: TeamTypes.SERVEUR,
    account: "FORKIT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];