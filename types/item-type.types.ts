export type ItemType = {
  id: string;
  name: string;
  type: string;
  icon: string;
  priorityOrder: number;
  vatRate?: number; // Taux de TVA par défaut (20, 10 ou 5.5)
};