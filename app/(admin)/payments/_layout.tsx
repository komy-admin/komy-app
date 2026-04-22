import { Tabs } from 'expo-router';
import {
  ReceiptEuro,
  Calculator,
  Download
} from 'lucide-react-native';
import { colors } from '~/theme';

/**
 * Layout pour la section Paiements avec navigation par tabs
 *
 * Remplace l'ancienne navigation à 3 niveaux par 4 tabs métier :
 * - Journal : Vue chronologique des encaissements
 * - Caisse : Gestion ouverture/fermeture et Z
 * - Commandes : Vue par commande (ancienne vue)
 * - Exports : Rapports et exports comptables
 */
export default function PaymentsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.info.base, // Bleu primaire
        tabBarInactiveTintColor: colors.gray[500], // Gris
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: colors.gray[200],
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="journal"
        options={{
          tabBarLabel: 'Paiements',
          tabBarIcon: ({ color, size }) => (
            <ReceiptEuro size={size || 24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="cash-register"
        options={{
          tabBarLabel: 'Caisse',
          tabBarIcon: ({ color, size }) => (
            <Calculator size={size || 24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="exports"
        options={{
          tabBarLabel: 'Exports',
          tabBarIcon: ({ color, size }) => (
            <Download size={size || 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}