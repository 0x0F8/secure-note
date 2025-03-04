declare module "crypto-browserify" {
  declare class Cipher {
    update(input: string, fromEncoding: string, toEncoding: string): string;
    final(encoding: string): string;
  }
  declare class Hmac {
    update(input: string): string;
    digest(encoding: string): string;
  }
  declare function randomBytes(length: number): Buffer;
  declare function pbkdf2(
    secret: string,
    salt: string,
    iterations: number,
    keylen: number,
    digest: string,
    callback: (err: Error, derivedKey: Buffer) => void
  ): void;
  declare function createCipher(
    algorithm: string,
    key: string,
    iv?: string
  ): Cipher;
  declare function createDecipher(
    algorithm: string,
    key: string,
    iv?: string
  ): Cipher;
  declare function createHmac(algorithm: string, secret: string): Hmac;
}
