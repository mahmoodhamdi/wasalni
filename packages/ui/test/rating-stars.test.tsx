import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RatingStars } from '../src/components/rating-stars';

describe('RatingStars', () => {
  it('renders 5 stars by default (interactive)', () => {
    render(<RatingStars value={0} onChange={() => {}} />);
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('reports the selected value via onChange', async () => {
    const onChange = vi.fn();
    render(<RatingStars value={0} onChange={onChange} />);
    const stars = screen.getAllByRole('radio');
    await userEvent.click(stars[3]!);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('marks the chosen value as aria-checked', () => {
    render(<RatingStars value={3} onChange={() => {}} />);
    const stars = screen.getAllByRole('radio');
    expect(stars[2]).toHaveAttribute('aria-checked', 'true');
    expect(stars[0]).toHaveAttribute('aria-checked', 'false');
  });

  it('read-only mode renders an img role and no buttons', () => {
    render(<RatingStars value={4} readOnly />);
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.getByRole('img', { name: /4/i })).toBeInTheDocument();
  });
});
