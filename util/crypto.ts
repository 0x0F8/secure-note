import {
  randomBytes,
  pbkdf2,
  createCipher,
  createDecipher,
} from "crypto-browserify";

export function createPassword(length = 64) {
  return randomBytes(length + 10)
    .toString("hex")
    .slice(0, length - 1);
}

export function createKey(
  password: string,
  salt: string,
  iterations = 300000
): Promise<string> {
  return new Promise((resolve, reject) => {
    pbkdf2(password, salt, iterations, 64, "sha512", (err, key) => {
      if (err) reject(err);
      resolve(key.toString("hex"));
    });
  });
}

export function encrypt(input: string, key: string) {
  const cipher = createCipher("aes256", key);
  let hex = cipher.update(input, "utf8", "hex");
  hex += cipher.final("hex");
  return hex;
}

export function decrypt(input: string, key: string) {
  const cipher = createDecipher("aes256", key);
  let str = cipher.update(input, "hex", "utf8");
  str += cipher.final("utf8");
  return str;
}
