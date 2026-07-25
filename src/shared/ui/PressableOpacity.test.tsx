import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { PressableOpacity } from './PressableOpacity';

describe('PressableOpacity', () => {
  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(
      <PressableOpacity onPress={onPress} accessibilityRole="button">
        <Text>Link</Text>
      </PressableOpacity>,
    );

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(
      <PressableOpacity onPress={onPress} disabled accessibilityRole="button">
        <Text>Link</Text>
      </PressableOpacity>,
    );

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
  });
});
