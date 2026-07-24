import { colors } from '@/shared/ui';
import {
  getStepState,
  isTerminalStatus,
  shortOrderId,
  statusBadgeLabel,
  statusBadgeStyle,
  statusLabel,
} from './orderStatus';

describe('isTerminalStatus', () => {
  it('ENTREGADO y CANCELADO son terminales', () => {
    expect(isTerminalStatus('ENTREGADO')).toBe(true);
    expect(isTerminalStatus('CANCELADO')).toBe(true);
  });

  it('PENDIENTE, PREPARANDO, EN_CAMINO no son terminales', () => {
    expect(isTerminalStatus('PENDIENTE')).toBe(false);
    expect(isTerminalStatus('PREPARANDO')).toBe(false);
    expect(isTerminalStatus('EN_CAMINO')).toBe(false);
  });
});

describe('getStepState', () => {
  it('pasos anteriores al estado actual están done', () => {
    expect(getStepState('EN_CAMINO', 'PENDIENTE')).toBe('done');
    expect(getStepState('EN_CAMINO', 'PREPARANDO')).toBe('done');
  });

  it('el paso que coincide con el estado actual está current', () => {
    expect(getStepState('PREPARANDO', 'PREPARANDO')).toBe('current');
  });

  it('pasos posteriores al estado actual están upcoming', () => {
    expect(getStepState('PENDIENTE', 'EN_CAMINO')).toBe('upcoming');
    expect(getStepState('PENDIENTE', 'ENTREGADO')).toBe('upcoming');
  });

  it('CANCELADO no marca ningún paso como done/current', () => {
    expect(getStepState('CANCELADO', 'PENDIENTE')).toBe('upcoming');
    expect(getStepState('CANCELADO', 'ENTREGADO')).toBe('upcoming');
  });
});

describe('statusLabel', () => {
  it('devuelve un label legible por cada estado', () => {
    expect(statusLabel('PENDIENTE')).toBe('Pedido recibido');
    expect(statusLabel('PREPARANDO')).toBe('Preparando tu pedido');
    expect(statusLabel('EN_CAMINO')).toBe('En camino');
    expect(statusLabel('ENTREGADO')).toBe('Entregado');
    expect(statusLabel('CANCELADO')).toBe('Pedido cancelado');
  });
});

describe('statusBadgeLabel', () => {
  it('devuelve una etiqueta corta por cada estado', () => {
    expect(statusBadgeLabel('PENDIENTE')).toBe('Pendiente');
    expect(statusBadgeLabel('PREPARANDO')).toBe('Preparando');
    expect(statusBadgeLabel('EN_CAMINO')).toBe('En camino');
    expect(statusBadgeLabel('ENTREGADO')).toBe('Entregado');
    expect(statusBadgeLabel('CANCELADO')).toBe('Cancelado');
  });
});

describe('statusBadgeStyle', () => {
  it('ENTREGADO usa los tokens de success', () => {
    expect(statusBadgeStyle('ENTREGADO')).toEqual({
      bg: colors.success.bg,
      fg: colors.success.default,
    });
  });

  it('CANCELADO usa danger sobre surface.subtle (sin tinte de danger en el theme)', () => {
    expect(statusBadgeStyle('CANCELADO')).toEqual({
      bg: colors.surface.subtle,
      fg: colors.danger.default,
    });
  });

  it('los estados en curso usan los tokens de brand', () => {
    for (const status of ['PENDIENTE', 'PREPARANDO', 'EN_CAMINO'] as const) {
      expect(statusBadgeStyle(status)).toEqual({ bg: colors.brand.tint, fg: colors.brand.dark });
    }
  });
});

describe('shortOrderId', () => {
  it('saca los guiones, toma los últimos 6 caracteres y los pone en mayúscula', () => {
    expect(shortOrderId('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe('567890');
  });
});
