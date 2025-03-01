import { decrypt } from "./util/crypto";

addEventListener("message", (event: MessageEvent<{ data: string, key: string }>) => {
    postMessage(decrypt(event.data.data, event.data.key));
});