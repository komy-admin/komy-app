import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CustomModal } from '~/components/CustomModal';
import PinInput from '~/components/ui/pin-input';
import { authApiService } from '~/api/auth.api';
import { Mail, Smartphone } from 'lucide-react-native';

interface TwoFactorModalProps {
  isVisible: boolean;
  onClose: () => void;
  onVerify: (code: string) => void;
  totp: boolean;
  email: boolean;
  isLoading: boolean;
  onSendEmail?: () => Promise<void>;
}

export function TwoFactorModal({
  isVisible,
  onClose,
  onVerify,
  totp,
  email,
  isLoading,
  onSendEmail,
}: TwoFactorModalProps) {
  const [code, setCode] = useState('');
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  // If both methods are active, let user choose. Default to totp if available.
  const [activeMethod, setActiveMethod] = useState<'totp' | 'email'>(totp ? 'totp' : 'email');

  useEffect(() => {
    if (!isVisible) {
      setCode('');
      setEmailCooldown(0);
      setActiveMethod(totp ? 'totp' : 'email');
    }
  }, [isVisible, totp]);

  useEffect(() => {
    if (emailCooldown <= 0) return;
    const timer = setTimeout(() => setEmailCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [emailCooldown]);

  const handleSendEmailCode = useCallback(async () => {
    setIsSendingEmail(true);
    try {
      if (onSendEmail) {
        await onSendEmail();
      } else {
        await authApiService.sendDeviceTrustEmailCode();
      }
      setEmailCooldown(60);
    } catch {
      // user can retry
    } finally {
      setIsSendingEmail(false);
    }
  }, [onSendEmail]);

  const handleSubmit = useCallback(() => {
    if (!isLoading && code.length === 6) {
      onVerify(code);
    }
  }, [isLoading, code, onVerify]);

  const hasBoth = totp && email;

  return (
    <CustomModal
      isVisible={isVisible}
      onClose={onClose}
      title="Vérification 2FA"
      titleColor="#06B6D4"
      width={420}
    >
      <View style={styles.content}>
        {/* Method selector when both are active */}
        {hasBoth && (
          <View style={styles.methodSelector}>
            <TouchableOpacity
              style={[styles.methodTab, activeMethod === 'totp' && styles.methodTabActive]}
              onPress={() => { setActiveMethod('totp'); setCode(''); }}
            >
              <Smartphone size={16} color={activeMethod === 'totp' ? '#06B6D4' : '#94A3B8'} strokeWidth={2} />
              <Text style={[styles.methodTabText, activeMethod === 'totp' && styles.methodTabTextActive]}>Application</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodTab, activeMethod === 'email' && styles.methodTabActive]}
              onPress={() => { setActiveMethod('email'); setCode(''); }}
            >
              <Mail size={16} color={activeMethod === 'email' ? '#06B6D4' : '#94A3B8'} strokeWidth={2} />
              <Text style={[styles.methodTabText, activeMethod === 'email' && styles.methodTabTextActive]}>Email</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.description}>
          {activeMethod === 'totp'
            ? 'Entrez le code à 6 chiffres depuis votre application.'
            : 'Entrez le code à 6 chiffres envoyé à votre email.'}
        </Text>

        {activeMethod === 'email' && (
          <TouchableOpacity
            style={[styles.sendEmailButton, (emailCooldown > 0 || isSendingEmail) && styles.sendEmailButtonDisabled]}
            onPress={handleSendEmailCode}
            disabled={emailCooldown > 0 || isSendingEmail}
          >
            <Mail size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.sendEmailButtonText}>
              {isSendingEmail ? 'Envoi...' : emailCooldown > 0 ? `Renvoyer (${emailCooldown}s)` : 'Envoyer le code'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.pinWrapper}>
          <PinInput
            length={6}
            value={code}
            onChange={setCode}
            secure={false}
            disabled={isLoading}
            autoFocus={true}
          />
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, (code.length !== 6 || isLoading) && styles.verifyButtonDisabled]}
          onPress={handleSubmit}
          disabled={code.length !== 6 || isLoading}
        >
          <Text style={styles.verifyButtonText}>
            {isLoading ? 'Vérification...' : 'Vérifier'}
          </Text>
        </TouchableOpacity>
      </View>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  methodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    width: '100%',
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  methodTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  methodTabText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  methodTabTextActive: {
    color: '#06B6D4',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  sendEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#06B6D4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sendEmailButtonDisabled: {
    opacity: 0.5,
  },
  sendEmailButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pinWrapper: {
    width: '100%',
    paddingHorizontal: 8,
  },
  verifyButton: {
    backgroundColor: '#06B6D4',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  verifyButtonDisabled: {
    opacity: 0.4,
  },
  verifyButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
