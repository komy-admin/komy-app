import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { User, Lock, Bell, LogOut, PenTool, Database } from 'lucide-react-native';
import { useAppDispatch } from '~/store/hooks';
import { logout } from '~/store/auth.slice';
import { router } from 'expo-router';
import { storageService } from '~/lib/storageService';
import type { currentUser } from '~/types/auth.types';

type ConfigSection = 'dashboard' | 'personal' | 'password' | 'notifications';

const CONFIG_ITEMS = [
  { id: 'dashboard', Icon: Database, label: 'Dashboard' },
  { id: 'personal', Icon: User, label: 'Informations personnels' },
  { id: 'password', Icon: Lock, label: 'Mot de passe' },
  { id: 'notifications', Icon: Bell, label: 'Notifications' },
];

type ConfigSidebarProps = {
  currentSection: ConfigSection;
  onSectionChange: (section: ConfigSection) => void;
  user: currentUser;
};

export function ConfigSidebar({ currentSection, onSectionChange, user }: ConfigSidebarProps) {
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      // Supprimer les données du stockage local
      await storageService.removeItem('currentUser');
      await storageService.removeItem('token');
      
      // Nettoyer le state Redux
      dispatch(logout());
      
      // Rediriger vers la page de login
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <View style={{ 
      width: '25%', 
      backgroundColor: '#F8F9FA',
      height: '100%',
      paddingVertical: 35, 
      paddingHorizontal: 24, 
    }}>
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <View style={{
          width: 140,
          height: 140,
          borderRadius: 60,
          marginBottom: 16,
          position: 'relative'
        }}>
          <Image
            source={require('~/assets/images/icone_user_test.webp')}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 60,
            }}
          />
          <View style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 4,
            borderWidth: 1,
            borderColor: '#F3F4F6'
          }}>
            <PenTool size={16} color="#2A2E33" />
          </View>
        </View>
        <Text style={{ 
          fontSize: 18, 
          color: '#2A2E33', 
          marginBottom: 4,
          fontWeight: '500'
        }}>
          {`${(user.firstName ?? '').charAt(0).toUpperCase() + (user.firstName ?? '').slice(1)} ${(user.lastName ?? '').charAt(0).toUpperCase() + (user.lastName ?? '').slice(1)}`}
        </Text>
        <Text style={{ 
          fontSize: 14, 
          color: '#64666A',
          fontWeight: '400'
        }}>
          {(user.profil ?? '').charAt(0).toUpperCase() + (user.profil ?? '').slice(1)}
        </Text>
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        {CONFIG_ITEMS.map(({ id, Icon, label }) => {
          const isActive = currentSection === id;
          return (
            <Pressable
              key={id}
              onPress={() => onSectionChange(id as ConfigSection)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                borderRadius: 8,
                backgroundColor: isActive ? '#F3F4F6' : pressed ? '#F9FAFB' : 'transparent',
              })}
            >
              <Icon
                size={18}
                color={isActive ? '#2A2E33' : '#64666A'}
                style={{ marginRight: 12 }}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: isActive ? '#2A2E33' : '#64666A',
                  fontWeight: isActive ? '500' : '400',
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          borderRadius: 8,
          backgroundColor: pressed ? '#FEF2F2' : 'transparent',
        })}
        onPress={handleLogout}
      >
        <LogOut size={18} color="#DC2626" style={{ marginRight: 12 }} />
        <Text style={{ 
          fontSize: 14, 
          color: '#DC2626', 
          fontWeight: '500' 
        }}>
          Déconnexion
        </Text>
      </Pressable>
    </View>
  );
}