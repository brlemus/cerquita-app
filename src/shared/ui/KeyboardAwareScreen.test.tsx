import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { KeyboardAwareScreen } from './KeyboardAwareScreen';

describe('KeyboardAwareScreen', () => {
  it('renders the fixed header and the scrollable children', () => {
    render(
      <KeyboardAwareScreen header={<Text>Header</Text>}>
        <Text>Body</Text>
      </KeyboardAwareScreen>,
    );

    expect(screen.getByText('Header')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
  });

  it('renders children without a header', () => {
    render(
      <KeyboardAwareScreen>
        <Text>Body</Text>
      </KeyboardAwareScreen>,
    );

    expect(screen.getByText('Body')).toBeTruthy();
  });
});
