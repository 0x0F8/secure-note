import { encrypt } from "./util/crypto";

addEventListener("message", (event: MessageEvent<{ data: string, key: string }>) => {
    postMessage(encrypt(event.data.data, event.data.key));
});