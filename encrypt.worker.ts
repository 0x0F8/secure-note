import { encrypt } from "./util/crypto";

addEventListener(
  "message",
  (event: MessageEvent<{ data: string; key: string }>) => {
    let result: string | undefined;
    let success = true;
    try {
      result = encrypt(event.data.data, event.data.key);
    } catch {
      success = false;
    }
    postMessage({ result, success });
  }
);
