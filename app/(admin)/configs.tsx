import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { ConfigSidebar } from '~/components/admin/ConfigSideBar';
import PersonalInfoPage from '~/components/config/personal';
import PasswordPage from '~/components/config/password';
import NotificationsPage from '~/components/config/notifications';

type ConfigSection = 'personal' | 'password' | 'notifications';

export default function ConfigPage() {
  const [currentSection, setCurrentSection] = useState<ConfigSection>('personal');

  const renderSection = () => {
    switch (currentSection) {
      case 'personal':
        return <PersonalInfoPage />;
      case 'password':
        return <PasswordPage />;
      case 'notifications':
        return <NotificationsPage />;
      default:
        return <PersonalInfoPage />;
    }
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#FFFFFF' }}>
      <ConfigSidebar currentSection={currentSection} onSectionChange={setCurrentSection} />
      <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ padding: 32 }}>
          {renderSection()}
        </View>
      </ScrollView>
    </View>
  );
}