import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';
import { useAppInit } from '~/hooks/useAppInit';
import { useAlertMonitor } from '~/hooks/useAlertMonitor';

interface AppInitializerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Composant qui gère l'initialisation de l'app
 * Affiche un écran de chargement pendant l'initialisation
 */
export const AppInitializer: React.FC<AppInitializerProps> = ({ 
  children, 
  fallback 
}) => {
  const { token, userProfile } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!(token && userProfile);
  
  const { 
    isInitialized, 
    isLoading, 
    error, 
    progress, 
    progressPercentage,
    reinitializeApp 
  } = useAppInit();

  // Le hook useAlertMonitor gère automatiquement l'initialisation et les conditions
  useAlertMonitor();

  // Si pas authentifié, passer directement au contenu (pages de login)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // Si erreur, afficher l'écran d'erreur
  if (error && !isLoading) {
    return fallback || (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 20,
        backgroundColor: '#f8f9fa'
      }}>
        <Text style={{ 
          fontSize: 24, 
          fontWeight: 'bold', 
          color: '#dc3545', 
          marginBottom: 16,
          textAlign: 'center'
        }}>
          Erreur d'initialisation
        </Text>
        <Text style={{ 
          fontSize: 16, 
          color: '#6c757d', 
          marginBottom: 24,
          textAlign: 'center'
        }}>
          {error}
        </Text>
        <Text 
          style={{ 
            fontSize: 16, 
            color: '#007bff', 
            textDecorationLine: 'underline'
          }}
          onPress={reinitializeApp}
        >
          Réessayer
        </Text>
      </View>
    );
  }

  // Si pas encore initialisé, afficher l'écran de chargement
  if (!isInitialized) {
    return fallback || (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 20,
        backgroundColor: '#ffffff'
      }}>
        <View style={{ 
          alignItems: 'center',
          marginBottom: 40
        }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: '#2A2E33', 
            marginBottom: 8 
          }}>
            Fork It
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: '#6c757d' 
          }}>
            Chargement en cours...
          </Text>
        </View>

        <ActivityIndicator 
          size="large" 
          color="#2A2E33" 
          style={{ marginBottom: 24 }}
        />

        <View style={{ 
          width: '80%', 
          backgroundColor: '#e9ecef', 
          height: 8, 
          borderRadius: 4,
          marginBottom: 16
        }}>
          <View style={{ 
            width: `${progressPercentage}%`, 
            backgroundColor: '#2A2E33', 
            height: '100%', 
            borderRadius: 4 
          }} />
        </View>

        <Text style={{ 
          fontSize: 16, 
          color: '#2A2E33', 
          fontWeight: '600',
          marginBottom: 16
        }}>
          {progressPercentage}% terminé
        </Text>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ 
            fontSize: 14, 
            color: '#6c757d',
            marginBottom: 4
          }}>
            Étapes de chargement :
          </Text>
          
          {Object.entries(progress).map(([key, completed]) => (
            <View key={key} style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              marginBottom: 2
            }}>
              <Text style={{ 
                fontSize: 16, 
                marginRight: 8,
                color: completed ? '#28a745' : '#6c757d'
              }}>
                {completed ? '✅' : '⏳'}
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: completed ? '#28a745' : '#6c757d',
                textTransform: 'capitalize'
              }}>
                {getStepLabel(key)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // App initialisée, afficher le contenu principal
  return <>{children}</>;
};

function getStepLabel(key: string): string {
  const labels: Record<string, string> = {
    rooms: 'Salles',
    tables: 'Tables', 
    itemTypes: 'Types d\'articles',
    items: 'Articles',
    menus: 'Menus',
    orders: 'Commandes'
  };
  return labels[key] || key;
}