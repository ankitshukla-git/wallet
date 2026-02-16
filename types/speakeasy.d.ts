declare module 'speakeasy' {
  export function totp(options: { secret: string; encoding: 'base32' }): string;
}
