import { completeNameSchema, signInSchema, signUpSchema, verificationSchema } from './schemas';

describe('signInSchema', () => {
  it('accepts a valid email and password', () => {
    expect(signInSchema.safeParse({ email: 'ana@cerquita.app', password: 'x' }).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = signInSchema.safeParse({ email: 'not-an-email', password: 'x' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty password', () => {
    const result = signInSchema.safeParse({ email: 'ana@cerquita.app', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('signUpSchema', () => {
  it('accepts a valid sign-up', () => {
    expect(
      signUpSchema.safeParse({ name: 'Ana', email: 'ana@cerquita.app', password: '123456' })
        .success,
    ).toBe(true);
  });

  it('rejects a password shorter than 6 characters', () => {
    const result = signUpSchema.safeParse({
      name: 'Ana',
      email: 'ana@cerquita.app',
      password: '123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty name', () => {
    const result = signUpSchema.safeParse({
      name: '',
      email: 'ana@cerquita.app',
      password: '123456',
    });
    expect(result.success).toBe(false);
  });
});

describe('verificationSchema', () => {
  it('accepts a 6-digit code', () => {
    expect(verificationSchema.safeParse({ code: '123456' }).success).toBe(true);
  });

  it('rejects a code that is not 6 digits', () => {
    expect(verificationSchema.safeParse({ code: '123' }).success).toBe(false);
  });

  it('rejects a code with non-numeric characters', () => {
    expect(verificationSchema.safeParse({ code: 'abcdef' }).success).toBe(false);
  });
});

describe('completeNameSchema', () => {
  it('accepts a non-empty name', () => {
    expect(completeNameSchema.safeParse({ name: 'Ana' }).success).toBe(true);
  });

  it('rejects an empty name', () => {
    expect(completeNameSchema.safeParse({ name: '' }).success).toBe(false);
  });
});
