import { render, screen } from '@testing-library/react-native';

import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renderiza oculto para lectores de pantalla', async () => {
    await render(<Skeleton testID="skeleton" />);

    const node = screen.getByTestId('skeleton', { includeHiddenElements: true });
    expect(node.props.accessibilityElementsHidden).toBe(true);
    expect(node.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('aplica width/height/radius custom', async () => {
    await render(<Skeleton testID="skeleton" width={120} height={40} radius={20} />);

    const node = screen.getByTestId('skeleton', { includeHiddenElements: true });
    const flatStyle = Object.assign({}, ...[].concat(node.props.style));
    expect(flatStyle.width).toBe(120);
    expect(flatStyle.height).toBe(40);
    expect(flatStyle.borderRadius).toBe(20);
  });
});
