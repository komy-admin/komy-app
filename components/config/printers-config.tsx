import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Settings as SettingsIcon, Activity } from 'lucide-react-native'
import { PrintersTab } from './printers/PrintersTab'
import { PrintJobsTab } from './printers/PrintJobsTab'
import { usePrintJobs } from '~/hooks/usePrintJobs'

type PrintersTab = 'settings' | 'monitoring'

interface PrintersConfigPageProps {
  isCompactSidebar?: boolean | null
}

export default function PrintersConfigPage({
  isCompactSidebar,
}: PrintersConfigPageProps) {
  const [activeTab, setActiveTab] = useState<PrintersTab>('settings')
  const { jobs } = usePrintJobs()

  const activeJobsCount = jobs.filter((j) =>
    ['pending', 'sent', 'failed'].includes(j.status)
  ).length

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Sidebar Navigation */}
        <View
          style={[
            styles.sidebar,
            isCompactSidebar === true && styles.sidebarCompact,
          ]}
        >
          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar === true && styles.sidebarTabCompact,
              activeTab === 'settings' && styles.sidebarTabActive,
            ]}
            onPress={() => setActiveTab('settings')}
            activeOpacity={1}
          >
            <SettingsIcon
              size={20}
              color={activeTab === 'settings' ? '#6366F1' : '#64748B'}
              strokeWidth={2}
            />
            {isCompactSidebar !== true && (
              <Text
                style={[
                  styles.sidebarTabText,
                  activeTab === 'settings' && styles.sidebarTabTextActive,
                ]}
              >
                Paramétrage
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar === true && styles.sidebarTabCompact,
              activeTab === 'monitoring' && styles.sidebarTabActive,
            ]}
            onPress={() => setActiveTab('monitoring')}
            activeOpacity={1}
          >
            <Activity
              size={20}
              color={activeTab === 'monitoring' ? '#F97316' : '#64748B'}
              strokeWidth={2}
            />
            {isCompactSidebar !== true && (
              <View style={styles.sidebarTabRow}>
                <Text
                  style={[
                    styles.sidebarTabText,
                    activeTab === 'monitoring' && styles.sidebarTabTextActive,
                  ]}
                >
                  Monitoring
                </Text>
                {activeJobsCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{activeJobsCount}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {activeTab === 'settings' && <PrintersTab />}
          {activeTab === 'monitoring' && <PrintJobsTab />}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    padding: 16,
    gap: 8,
  },
  sidebarCompact: {
    width: 72,
    padding: 8,
  },
  sidebarTab: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  sidebarTabCompact: {
    justifyContent: 'center',
    padding: 14,
    gap: 0,
  },
  sidebarTabActive: {
    backgroundColor: '#F1F5F9',
  },
  sidebarTabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sidebarTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  sidebarTabTextActive: {
    color: '#1E293B',
    fontWeight: '600',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
  },
})
