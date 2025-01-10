import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { User, Lock, Bell, LogOut, PenTool } from 'lucide-react-native';

type ConfigSection = 'personal' | 'password' | 'notifications';

const CONFIG_ITEMS = [
  { id: 'personal', Icon: User, label: 'Informations personnels' },
  { id: 'password', Icon: Lock, label: 'Mot de passe' },
  { id: 'notifications', Icon: Bell, label: 'Notifications' },
];

type ConfigSidebarProps = {
  currentSection: ConfigSection;
  onSectionChange: (section: ConfigSection) => void;
};

export function ConfigSidebar({ currentSection, onSectionChange }: ConfigSidebarProps) {
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
          Edmont Dantes
        </Text>
        <Text style={{ 
          fontSize: 14, 
          color: '#64666A',
          fontWeight: '400'
        }}>
          Admin
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
        onPress={() => console.log('Déconnexion')}
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