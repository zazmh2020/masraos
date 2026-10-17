import { describe, expect, it } from 'vitest';
import { clientErrorMessage } from './client-error';

describe('client error messages', () => {
  it('shows our own validation messages', () => {
    expect(clientErrorMessage(new Error('العنوان مطلوب.'), 'fallback')).toBe('العنوان مطلوب.');
  });

  it('hides database errors that may reveal tables and columns', () => {
    const prismaError = Object.assign(new Error('Unique constraint failed on the fields: (`customDomain`) in table organizations'), { name: 'PrismaClientKnownRequestError', clientVersion: '7.9.1' });
    expect(clientErrorMessage(prismaError, 'بيانات غير صالحة.')).toBe('بيانات غير صالحة.');
    expect(clientErrorMessage('not an error', 'fallback')).toBe('fallback');
  });
});
