import React from 'react';
import { CreditCard, Banknote, FileText, Ticket } from 'lucide-react-native';
import { colors } from '~/theme';

interface PaymentMethodIconProps {
  method: 'card' | 'cash' | 'check' | 'ticket_resto';
  size?: number;
}

export function PaymentMethodIcon({ method, size = 20 }: PaymentMethodIconProps) {
  const iconProps = { size, strokeWidth: 2 };

  switch (method) {
    case 'card':
      return <CreditCard {...iconProps} color={colors.brand.accent} />;
    case 'cash':
      return <Banknote {...iconProps} color={colors.success.base} />;
    case 'check':
      return <FileText {...iconProps} color={colors.warning.base} />;
    case 'ticket_resto':
      return <Ticket {...iconProps} color={colors.pink} />;
    default:
      return <CreditCard {...iconProps} color={colors.gray[400]} />;
  }
}
