import { ItemTypes } from "~/types/item-types.enum";
import { Item } from "~/types/item.types";

export const mockItems: Item[] = [
  // STARTERS
  {
    id: '1',
    name: 'Soupe à l\'oignon',
    price: 8,
    allergens: ['gluten', 'lait'],
    description: 'Soupe traditionnelle avec croûtons et fromage gratiné',
    itemType: ItemTypes.STARTER,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Foie gras maison',
    price: 16,
    allergens: [],
    description: 'Servi avec pain toasté et chutney de figues',
    itemType: ItemTypes.STARTER,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Salade de chèvre chaud',
    price: 9,
    allergens: ['lait', 'fruits à coque'],
    description: 'Salade, toasts de chèvre, miel et noix',
    itemType: ItemTypes.STARTER,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Escargots de Bourgogne',
    price: 12,
    allergens: ['lait', 'gluten'],
    description: '6 escargots au beurre persillé',
    itemType: ItemTypes.STARTER,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Terrine de campagne',
    price: 8,
    allergens: ['œufs', 'gluten'],
    description: 'Terrine maison et ses cornichons',
    itemType: ItemTypes.STARTER,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // MAIN COURSES
  {
    id: '6',
    name: 'Coq au vin',
    price: 22,
    allergens: ['sulfites'],
    description: 'Mijoté au vin rouge avec lardons et champignons',
    itemType: ItemTypes.MAIN,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '7',
    name: 'Magret de canard',
    price: 24,
    allergens: [],
    description: 'Sauce au miel et pommes sarladaises',
    itemType: ItemTypes.MAIN,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '8',
    name: 'Entrecôte grillée',
    price: 26,
    allergens: ['lait'],
    description: 'Sauce au poivre, frites maison',
    itemType: ItemTypes.MAIN,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '9',
    name: 'Blanquette de veau',
    price: 20,
    allergens: ['lait', 'gluten'],
    description: 'Riz pilaf et légumes de saison',
    itemType: ItemTypes.MAIN,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '10',
    name: 'Poisson du jour',
    price: 23,
    allergens: ['poisson', 'lait'],
    description: 'Selon arrivage, purée maison',
    itemType: ItemTypes.MAIN,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // DESSERTS
  {
    id: '11',
    name: 'Crème brûlée',
    price: 8,
    allergens: ['lait', 'œufs'],
    description: 'À la vanille de Madagascar',
    itemType: ItemTypes.DESSERT,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '12',
    name: 'Tarte Tatin',
    price: 9,
    allergens: ['gluten', 'lait', 'œufs'],
    description: 'Servie avec crème fraîche',
    itemType: ItemTypes.DESSERT,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '13',
    name: 'Profiteroles',
    price: 10,
    allergens: ['gluten', 'lait', 'œufs'],
    description: 'Sauce chocolat chaud',
    itemType: ItemTypes.DESSERT,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '14',
    name: 'Mousse au chocolat',
    price: 7,
    allergens: ['lait', 'œufs'],
    description: 'Chocolat noir 70%',
    itemType: ItemTypes.DESSERT,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '15',
    name: 'Café gourmand',
    price: 9,
    allergens: ['gluten', 'lait', 'œufs', 'fruits à coque'],
    description: 'Assortiment de mini desserts',
    itemType: ItemTypes.DESSERT,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // DRINKS
  {
    id: '16',
    name: 'Vin rouge Bordeaux',
    price: 6,
    allergens: ['sulfites'],
    description: 'Verre de 12cl',
    itemType: ItemTypes.DRINK,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '17',
    name: 'Cocktail maison',
    price: 12,
    allergens: ['sulfites'],
    description: 'Demandez la composition au serveur',
    itemType: ItemTypes.DRINK,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '18',
    name: 'Bière pression',
    price: 5,
    allergens: ['gluten'],
    description: 'Blonde 25cl',
    itemType: ItemTypes.DRINK,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '19',
    name: 'Eau minérale',
    price: 4,
    allergens: [],
    description: 'Plate ou gazeuse 50cl',
    itemType: ItemTypes.DRINK,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '20',
    name: 'Jus de fruits frais',
    price: 5,
    allergens: [],
    description: 'Orange ou citron pressé',
    itemType: ItemTypes.DRINK,
    account: 'FORKIT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];