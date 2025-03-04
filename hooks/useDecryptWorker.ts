import { useMemo } from "react";
import useWorker from "./useWorker";
import { isBrowser } from "@/util/next";

export default function useDecryptWorker<T>(
  submit: boolean,
  args: Record<string, any> | undefined
) {
  if (!isBrowser())
    return {
      result: undefined,
      isFetching: false,
      success: undefined,
      error: undefined,
    };
  const worker = useMemo(
    () => new Worker(new URL("../crypto.worker.ts", import.meta.url)),
    []
  );
  return useWorker<T>(submit, worker, "decrypt", args);
}
