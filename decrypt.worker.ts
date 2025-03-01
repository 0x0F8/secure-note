import { decrypt } from "./util/crypto";
import { decompressFromUTF16 } from "lz-string";

addEventListener(
  "message",
  (event: MessageEvent<{ data: string; key: string; compress: boolean }>) => {
    const { key, compress = true, data } = event.data;
    let result: string | undefined = data;
    let success = true;

    try {
      result = decrypt(result, key);
      if (compress === true) {
        result = decompressFromUTF16(result);
      }
    } catch {
      success = false;
      result = undefined;
    }
    postMessage({ result, success });
  }
);
