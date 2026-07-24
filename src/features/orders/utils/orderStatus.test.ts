import { getStepState, isTerminalStatus, statusLabel } from './orderStatus';

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
