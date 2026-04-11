import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAccountConfig } from '~/hooks/useAccountConfig';
import TicketPage from '~/components/Ticket/TicketPage';

export default function KitchenPage() {
  const router = useRouter();
  const { kitchenEnabled } = useAccountConfig();

  useEffect(() => {
    if (!kitchenEnabled) {
      router.replace('/(admin)/service');
    }
  }, [kitchenEnabled, router]);

  return <TicketPage area="kitchen" />;
}
