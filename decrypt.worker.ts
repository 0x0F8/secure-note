import { decrypt } from "./util/crypto";

addEventListener(
  "message",
  (event: MessageEvent<{ data: string; key: string }>) => {
    let result: string | undefined;
    let success = true;
    try {
      result = decrypt(event.data.data, event.data.key);
    } catch (error) {
      success = false;
    }
    postMessage({ result, success });
  }
);
