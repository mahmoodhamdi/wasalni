import { describe, expect, it } from 'vitest';
import { isValidEgPhone, normalizeEgPhone, formatEgPhoneDisplay, maskPhone } from '../src/phone';

describe('isValidEgPhone', () => {
  it.each([
    ['01012345678'],
    ['01112345678'],
    ['01212345678'],
    ['01512345678'],
    ['+201012345678'],
    ['00201012345678'],
    [' 010 1234 5678 '],
    ['010-1234-5678'],
    ['(010) 1234-5678'],
  ])('accepts valid form %s', (input) => {
    expect(isValidEgPhone(input)).toBe(true);
  });

  it.each([
    ['0212345678'],
    ['09912345678'],
    ['+1234567890'],
    ['012345'],
    ['abc'],
    [''],
    ['+20212345678'],
    ['01312345678'],
  ])('rejects invalid form %s', (input) => {
    expect(isValidEgPhone(input)).toBe(false);
  });
});

describe('normalizeEgPhone', () => {
  it('returns null for invalid input', () => {
    expect(normalizeEgPhone('not-a-phone')).toBeNull();
  });

  it('normalizes local form to E.164', () => {
    expect(normalizeEgPhone('01012345678')).toEqual({
      e164: '+201012345678',
      national: '01012345678',
      country: 'EG',
    });
  });

  it('normalizes +20 international form', () => {
    expect(normalizeEgPhone('+201012345678')).toEqual({
      e164: '+201012345678',
      national: '01012345678',
      country: 'EG',
    });
  });

  it('strips spaces/hyphens/parens', () => {
    const a = normalizeEgPhone('010 1234 5678');
    expect(a?.e164).toBe('+201012345678');
  });

  it('handles 0020 prefix', () => {
    expect(normalizeEgPhone('00201012345678')?.e164).toBe('+201012345678');
  });
});

describe('formatEgPhoneDisplay', () => {
  it('formats local form with spaces', () => {
    expect(formatEgPhoneDisplay('01012345678')).toBe('010 1234 5678');
  });
  it('returns the input unchanged when invalid', () => {
    expect(formatEgPhoneDisplay('garbage')).toBe('garbage');
  });
});

describe('maskPhone', () => {
  it('masks the middle digits', () => {
    expect(maskPhone('01012345678')).toBe('010 ••• •678');
  });
  it('returns input unchanged when invalid', () => {
    expect(maskPhone('xyz')).toBe('xyz');
  });
});
