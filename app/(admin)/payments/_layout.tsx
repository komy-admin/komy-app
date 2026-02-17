import { Tabs } from 'expo-router';
import {
  Receipt,
  Calculator,
  Download
} from 'lucide-react-native';

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
        tabBarActiveTintColor: '#2563EB', // Bleu primaire
        tabBarInactiveTintColor: '#6B7280', // Gris
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: 'white',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerTintColor: '#111827',
      }}
    >
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Paiements',
          tabBarLabel: 'Paiements',
          tabBarIcon: ({ color, size }) => (
            <Receipt size={size || 24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="cash-register"
        options={{
          title: 'Clôture de caisse',
          tabBarLabel: 'Caisse',
          tabBarIcon: ({ color, size }) => (
            <Calculator size={size || 24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="exports"
        options={{
          title: 'Exports & Rapports',
          tabBarLabel: 'Exports',
          tabBarIcon: ({ color, size }) => (
            <Download size={size || 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}