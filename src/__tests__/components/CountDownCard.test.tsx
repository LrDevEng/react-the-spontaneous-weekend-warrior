import { describe, expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import CountDownCard from '../../components/CountDownCard';

function cellTexts() {
  return screen.getAllByRole('cell').map((cell) => cell.textContent);
}

describe('CountDownCard', () => {
  test('renders a header row with Days, Hours, Minutes, Seconds', () => {
    render(
      <CountDownCard
        time={{ days: '0', hours: '00', minutes: '00', seconds: '00' }}
      />,
    );
    expect(
      screen.getAllByRole('columnheader').map((header) => header.textContent),
    ).toEqual(['Days', 'Hours', 'Minutes', 'Seconds']);
  });

  test('renders the given time values', () => {
    render(
      <CountDownCard
        time={{ days: '12', hours: '03', minutes: '45', seconds: '07' }}
      />,
    );
    expect(cellTexts()).toEqual(['12', '03', '45', '07']);
  });

  test('renders zero values (not the idle placeholder)', () => {
    render(
      <CountDownCard
        time={{ days: '0', hours: '00', minutes: '00', seconds: '00' }}
      />,
    );
    expect(cellTexts()).toEqual(['0', '00', '00', '00']);
  });

  test('renders placeholders when seconds is negative (idle countdown)', () => {
    render(
      <CountDownCard
        time={{ days: '-1', hours: '-1', minutes: '-1', seconds: '-1' }}
      />,
    );
    expect(cellTexts()).toEqual(['-', '--', '--', '--']);
  });

  test('uses the card CSS module class and a single table', () => {
    const { container } = render(
      <CountDownCard
        time={{ days: '1', hours: '02', minutes: '03', seconds: '04' }}
      />,
    );
    expect(container.firstElementChild).toHaveClass('card');
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });
});
