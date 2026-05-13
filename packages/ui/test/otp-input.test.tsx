import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { OtpInput } from '../src/components/otp-input';

function Wrapper({ onChange }: { onChange?: (v: string) => void }) {
  const [v, setV] = React.useState('');
  return (
    <OtpInput
      value={v}
      onChange={(next) => {
        setV(next);
        onChange?.(next);
      }}
    />
  );
}

describe('OtpInput', () => {
  it('renders 6 inputs by default', () => {
    render(<Wrapper />);
    expect(screen.getAllByLabelText(/OTP digit/)).toHaveLength(6);
  });

  it('only accepts numeric input', async () => {
    const onChange = vi.fn();
    render(<Wrapper onChange={onChange} />);
    const inputs = screen.getAllByLabelText(/OTP digit/);
    await userEvent.type(inputs[0]!, 'a');
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.type(inputs[0]!, '5');
    expect(onChange).toHaveBeenLastCalledWith('5');
  });

  it('moves focus to the next input on entry', async () => {
    render(<Wrapper />);
    const inputs = screen.getAllByLabelText(/OTP digit/);
    await userEvent.type(inputs[0]!, '1');
    expect(inputs[1]).toHaveFocus();
  });

  it('Backspace clears current then moves to previous', async () => {
    render(<Wrapper />);
    const inputs = screen.getAllByLabelText(/OTP digit/);
    await userEvent.type(inputs[0]!, '1');
    await userEvent.type(inputs[1]!, '2');
    // Cursor now at inputs[2]
    await userEvent.keyboard('{Backspace}');
    // No digit at index 2 → clears focus to previous (inputs[1])
    expect(inputs[1]).toHaveFocus();
  });

  it('fires onComplete when full', async () => {
    const onComplete = vi.fn();
    const W = () => {
      const [v, setV] = React.useState('');
      return <OtpInput value={v} onChange={setV} onComplete={onComplete} />;
    };
    render(<W />);
    const inputs = screen.getAllByLabelText(/OTP digit/);
    for (const [i, digit] of ['1', '2', '3', '4', '5', '6'].entries()) {
      await userEvent.type(inputs[i]!, digit);
    }
    expect(onComplete).toHaveBeenCalledWith('123456');
  });
});
