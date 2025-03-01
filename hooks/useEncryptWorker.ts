import { useCallback } from "react";
import useWorker from "./useWorker";
import { isBrowser } from "@/util/next";

export default function useEncryptWorker<T>(args: Record<string, any> | undefined) {
    if (!isBrowser()) return;
    const worker = useCallback(() => new Worker(new URL("../encrypt.worker.ts", import.meta.url)), [])
    return useWorker<T>(worker(), args)
}