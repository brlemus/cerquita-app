import { OwnerPlaceholderScreen } from '@/features/owner/screens/OwnerPlaceholderScreen';

export default function OwnerOrders() {
  return (
    <OwnerPlaceholderScreen
      header="Pedidos"
      emptyTitle="Sin pedidos por ahora"
      emptyDescription="Los pedidos que entren a tu tienda van a aparecer acá."
    />
  );
}
