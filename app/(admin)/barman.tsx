import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAccountConfig } from '~/hooks/useAccountConfig';
import TicketPage from '~/components/Ticket/TicketPage';

export default function BarmanPage() {
  const router = useRouter();
  const { barEnabled } = useAccountConfig();

  useEffect(() => {
    if (!barEnabled) {
      router.replace('/(admin)/service');
    }
  }, [barEnabled, router]);

  return <TicketPage area="bar" />;
}
