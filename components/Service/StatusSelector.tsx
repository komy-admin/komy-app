import { View, Text, Pressable, Modal } from 'react-native';
import { Status } from '~/types/status.enum';
import { getStatusColor, getStatusText } from '~/lib/utils';
import { Check } from 'lucide-react-native';

interface StatusSelectorProps {
  visible: boolean;
  currentStatus: Status;
  onClose: () => void;
  onStatusSelect: (status: Status) => void;
}

const AVAILABLE_STATUSES = [
  Status.PENDING,
  Status.READY,
  Status.INPROGRESS,
  Status.TERMINATED,
];

export default function StatusSelector({ 
  visible, 
  currentStatus, 
  onClose, 
  onStatusSelect 
}: StatusSelectorProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16
        }}
      >
        <View style={{
          backgroundColor: 'white',
          width: '100%',
          maxWidth: 400,
          borderRadius: 12,
          padding: 16
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600',
            marginBottom: 16,
            textAlign: 'center'
          }}>
            Changer le statut
          </Text>

          {AVAILABLE_STATUSES.map((status) => (
            <Pressable
              key={status}
              onPress={() => {
                onStatusSelect(status);
                onClose();
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                backgroundColor: getStatusColor(status),
                marginBottom: 8,
                borderRadius: 8,
                opacity: pressed ? 0.7 : 1
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: '500' }}>
                {getStatusText(status)}
              </Text>
              {currentStatus === status && (
                <Check size={20} color="#1A1A1A" />
              )}
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}