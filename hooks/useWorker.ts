import { useRef, useEffect, useState } from "react";

export default function useWorker<T>(
  submit: boolean,
  worker: Worker | undefined,
  args: Record<string, any> | undefined
): [T | undefined, boolean, boolean | undefined] {
  const workerRef = useRef<Worker>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean | undefined>(undefined);
  const [result, setResult] = useState<T | undefined>(undefined);

  useEffect(() => {
    if (!worker) return;
    workerRef.current = worker;
    workerRef.current.onmessage = (
      event: MessageEvent<{ success: boolean; result: T }>
    ) => {
      console.log("worker message", event);
      setResult(event.data.result);
      setSuccess(event.data.success);
      setIsFetching(false);
    };
    return () => {
      workerRef.current?.terminate();
    };
  }, [worker]);

  useEffect(() => {
    if (!args || !submit || isFetching) return;
    console.log("submit worker", args);
    if (!workerRef?.current) {
      console.log("worker is empty");
      return;
    }
    setIsFetching(true);
    workerRef.current.postMessage(args);
  }, [workerRef, args, submit, isFetching]);

  return [result, isFetching, success];
}
