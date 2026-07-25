import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { useOwnerAccess } from '../hooks/useOwnerAccess';
import { useAppModeStore } from '../store/appModeStore';
import { ModeGate } from './ModeGate';

jest.mock('../hooks/useOwnerAccess');
const mockUseOwnerAccess = useOwnerAccess as jest.Mock;

jest.mock('../screens/ChooserScreen', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory se hoistea, no puede referenciar un import de módulo externo
  const { Text: MockText } = require('react-native');
  return { ChooserScreen: () => <MockText>Chooser</MockText> };
});

const mockUseSegments = jest.fn();
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory se hoistea, no puede referenciar un import de módulo externo
  const { Text: MockText } = require('react-native');
  return {
    useSegments: () => mockUseSegments(),
    Redirect: ({ href }: { href: string }) => <MockText>{`Redirect:${href}`}</MockText>,
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory se hoistea, no puede referenciar un import de módulo externo
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('ModeGate', () => {
  beforeEach(() => {
    mockUseSegments.mockReturnValue(['(app)', '(tabs)', 'index']);
  });

  it('customer puro: pasa children directo, sin mirar el modo ni mostrar el chooser', () => {
    mockUseOwnerAccess.mockReturnValue({ hasBusiness: false, businessId: null });
    useAppModeStore.setState({ mode: null, hasHydrated: false });

    render(
      <ModeGate>
        <Text>Home</Text>
      </ModeGate>,
    );

    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.queryByText('Chooser')).toBeNull();
  });

  it('owner sin modo elegido todavía: muestra el chooser', () => {
    mockUseOwnerAccess.mockReturnValue({ hasBusiness: true, businessId: 'biz-1' });
    useAppModeStore.setState({ mode: null, hasHydrated: true });

    render(
      <ModeGate>
        <Text>Home</Text>
      </ModeGate>,
    );

    expect(screen.getByText('Chooser')).toBeTruthy();
    expect(screen.queryByText('Home')).toBeNull();
  });

  it('modo owner fuera de (owner): redirige a /(app)/(owner)/orders', () => {
    mockUseOwnerAccess.mockReturnValue({ hasBusiness: true, businessId: 'biz-1' });
    useAppModeStore.setState({ mode: 'owner', hasHydrated: true });
    mockUseSegments.mockReturnValue(['(app)', '(tabs)', 'index']);

    render(
      <ModeGate>
        <Text>Home</Text>
      </ModeGate>,
    );

    expect(screen.getByText('Redirect:/(app)/(owner)/orders')).toBeTruthy();
  });

  it('modo customer dentro de (owner): redirige a /', () => {
    mockUseOwnerAccess.mockReturnValue({ hasBusiness: true, businessId: 'biz-1' });
    useAppModeStore.setState({ mode: 'customer', hasHydrated: true });
    mockUseSegments.mockReturnValue(['(app)', '(owner)', 'orders']);

    render(
      <ModeGate>
        <Text>Home</Text>
      </ModeGate>,
    );

    expect(screen.getByText('Redirect:/')).toBeTruthy();
  });

  it('modo owner dentro de (owner): pasa children, sin redirect', () => {
    mockUseOwnerAccess.mockReturnValue({ hasBusiness: true, businessId: 'biz-1' });
    useAppModeStore.setState({ mode: 'owner', hasHydrated: true });
    mockUseSegments.mockReturnValue(['(app)', '(owner)', 'orders']);

    render(
      <ModeGate>
        <Text>Owner content</Text>
      </ModeGate>,
    );

    expect(screen.getByText('Owner content')).toBeTruthy();
  });

  it('owner sin hidratar todavía: no muestra nada (evita el flash del chooser)', () => {
    mockUseOwnerAccess.mockReturnValue({ hasBusiness: true, businessId: 'biz-1' });
    useAppModeStore.setState({ mode: null, hasHydrated: false });

    render(
      <ModeGate>
        <Text>Home</Text>
      </ModeGate>,
    );

    expect(screen.queryByText('Home')).toBeNull();
    expect(screen.queryByText('Chooser')).toBeNull();
  });
});
