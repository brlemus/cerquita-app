import type { OrderStatus } from '../api/types';

export type OrderStep = {
  status: OrderStatus;
  label: string;
  description: string;
};

/**
 * 4 pasos reales de la máquina de estados (no terminales excepto el
 * último). El prototipo comprime a 3 ("Recibido/En camino/Entregado")
 * por espacio visual -- se muestran los 4 reales del contrato, nunca se
 * oculta información por fidelidad visual (docs/phases/phase-5-tracking.md).
 */
export const ORDER_STEPS: OrderStep[] = [
  { status: 'PENDIENTE', label: 'Recibido', description: 'El negocio confirmó tu pedido' },
  { status: 'PREPARANDO', label: 'Preparando', description: 'Tu pedido se está preparando' },
  { status: 'EN_CAMINO', label: 'En camino', description: 'El repartidor va hacia vos' },
  { status: 'ENTREGADO', label: 'Entregado', description: '¡Disfrutá tu pedido!' },
];

const STEP_ORDER: Record<OrderStatus, number> = {
  PENDIENTE: 0,
  PREPARANDO: 1,
  EN_CAMINO: 2,
  ENTREGADO: 3,
  CANCELADO: -1,
};

export function isTerminalStatus(status: OrderStatus): boolean {
  return status === 'ENTREGADO' || status === 'CANCELADO';
}

export type StepState = 'done' | 'current' | 'upcoming';

export function getStepState(currentStatus: OrderStatus, stepStatus: OrderStatus): StepState {
  const currentIndex = STEP_ORDER[currentStatus];
  const stepIndex = STEP_ORDER[stepStatus];

  if (currentIndex < 0) {
    return 'upcoming';
  }
  if (stepIndex < currentIndex) {
    return 'done';
  }
  if (stepIndex === currentIndex) {
    return 'current';
  }
  return 'upcoming';
}

export function statusLabel(status: OrderStatus): string {
  switch (status) {
    case 'PENDIENTE':
      return 'Pedido recibido';
    case 'PREPARANDO':
      return 'Preparando tu pedido';
    case 'EN_CAMINO':
      return 'En camino';
    case 'ENTREGADO':
      return 'Entregado';
    case 'CANCELADO':
      return 'Pedido cancelado';
  }
}
