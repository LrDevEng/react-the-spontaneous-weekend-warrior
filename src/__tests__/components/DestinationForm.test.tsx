import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import DestinationForm from '../../components/DestinationForm';

function renderForm(disabled: boolean) {
  const setMinDist = jest.fn();
  const setMaxDist = jest.fn();
  const view = render(
    <DestinationForm
      minDist="10"
      setMinDist={setMinDist}
      maxDist="50"
      setMaxDist={setMaxDist}
      disabled={disabled}
    />,
  );
  return {
    ...view,
    setMinDist,
    setMaxDist,
    minInput: screen.getByRole('spinbutton', { name: /minimum distance/i }),
    maxInput: screen.getByRole('spinbutton', { name: /maximum distance/i }),
  };
}

describe('DestinationForm', () => {
  test('renders labelled number inputs for minimum and maximum distance in km', () => {
    const { minInput, maxInput, container } = renderForm(false);
    expect(minInput).toHaveAttribute('type', 'number');
    expect(minInput).toHaveAttribute('min', '0');
    expect(maxInput).toHaveAttribute('type', 'number');
    expect(maxInput).toHaveAttribute('min', '0');
    expect(minInput).toHaveValue(10);
    expect(maxInput).toHaveValue(50);
    expect(container).toHaveTextContent('Minimum distancekmMaximum distancekm');
    expect(container.firstElementChild).toHaveClass('destination');
  });

  test('propagates minimum distance changes as strings via setMinDist', () => {
    const { minInput, setMinDist, setMaxDist } = renderForm(false);
    fireEvent.change(minInput, { target: { value: '25' } });
    expect(setMinDist).toHaveBeenCalledTimes(1);
    expect(setMinDist).toHaveBeenCalledWith('25');
    expect(setMaxDist).not.toHaveBeenCalled();
  });

  test('propagates maximum distance changes as strings via setMaxDist', () => {
    const { maxInput, setMinDist, setMaxDist } = renderForm(false);
    fireEvent.change(maxInput, { target: { value: '120' } });
    expect(setMaxDist).toHaveBeenCalledTimes(1);
    expect(setMaxDist).toHaveBeenCalledWith('120');
    expect(setMinDist).not.toHaveBeenCalled();
  });

  test('passes an empty string when an input is cleared', () => {
    const { minInput, setMinDist } = renderForm(false);
    fireEvent.change(minInput, { target: { value: '' } });
    expect(setMinDist).toHaveBeenCalledWith('');
  });

  test('disables both inputs when disabled', () => {
    const { minInput, maxInput } = renderForm(true);
    expect(minInput).toBeDisabled();
    expect(maxInput).toBeDisabled();
  });
});
