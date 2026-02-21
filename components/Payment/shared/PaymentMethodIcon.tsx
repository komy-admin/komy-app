import React from 'react';
import { CreditCard, Banknote, FileText, Ticket } from 'lucide-react-native';

interface PaymentMethodIconProps {
  method: 'card' | 'cash' | 'check' | 'ticket_resto';
  size?: number;
}

export function PaymentMethodIcon({ method, size = 20 }: PaymentMethodIconProps) {
  const iconProps = { size, strokeWidth: 2 };

  switch (method) {
    case 'card':
      return <CreditCard {...iconProps} color="#6366F1" />;
    case 'cash':
      return <Banknote {...iconProps} color="#10B981" />;
    case 'check':
      return <FileText {...iconProps} color="#F59E0B" />;
    case 'ticket_resto':
      return <Ticket {...iconProps} color="#EC4899" />;
    default:
      return <CreditCard {...iconProps} color="#9CA3AF" />;
  }
}
