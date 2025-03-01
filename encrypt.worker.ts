import { encrypt } from "./util/crypto";
import { compressToUTF16 } from "lz-string";

addEventListener(
  "message",
  (event: MessageEvent<{ data: string; key: string; compress: boolean }>) => {
    const { key, compress = true, data } = event.data;
    let result: string | undefined = data;
    let success = true;

    try {
      if (compress === true) {
        result = compressToUTF16(result);
      }
      result = encrypt(result, key);
    } catch {
      success = false;
      result = undefined;
    }
    postMessage({ result, success });
  }
);
