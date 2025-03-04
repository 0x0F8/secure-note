import {
  encrypt,
  decrypt,
  createPassword,
  createKey,
  calculateHmac,
} from "./util/crypto";

addEventListener(
  "message",
  async (event: MessageEvent<{ name: string; args: any }>) => {
    const { name, args } = event.data;
    let fn: () => any;
    switch (name) {
      case "encrypt":
        fn = encryptFile.bind(encryptFile, args as any);
        break;
      case "decrypt":
        fn = decryptFile.bind(decryptFile, args as any);
        break;
      default:
        fn = () => {};
    }
    let result: any | undefined = undefined;
    let success = true;
    let error: string | undefined = undefined;

    try {
      result = await fn();
      if ("error" in result) {
        error = result.error;
        delete result.error;
      }
    } catch (_error: any) {
      success = false;
      error = _error.toString();
    }
    postMessage({ name, data: { result, success, error } });
  }
);

async function encryptFile({
  password,
  data,
}: {
  password: string;
  data: string;
}) {
  const salt = createPassword(128);
  const key = await createKey(password, salt, 210000);
  const cipher = encrypt(data, key);
  const hmac = calculateHmac(cipher, key);
  return { salt, key, cipher, hmac, error: undefined };
}

async function decryptFile({
  password,
  data: rawData,
}: {
  hmac: string;
  salt: string;
  password: string;
  data: string;
}) {
  const hmac = rawData.slice(0, 128);
  const salt = rawData.slice(128, 256);
  const data = rawData.slice(256);
  const key = await createKey(password, salt, 210000);
  let error: string | undefined;
  let payload: string | undefined;
  const hmacCompare = calculateHmac(data, key);
  if (hmacCompare !== hmac) {
    error = "Hmac mismatch!";
  } else {
    try {
      payload = decrypt(data, key);
    } catch {
      error = "Unable to decrypt";
    }
  }
  return { key, hmac: hmacCompare, data: payload, salt, error };
}
