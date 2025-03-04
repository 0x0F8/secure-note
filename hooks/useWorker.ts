import { useRef, useEffect, useState } from "react";

export default function useWorker<T>(
  submit: boolean,
  worker: Worker | undefined,
  eventName: string,
  args: Record<string, any> | undefined
): {
  result: T | undefined;
  isFetching: boolean;
  success: boolean | undefined;
  error: string | undefined;
} {
  const workerRef = useRef<Worker>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<T | undefined>(undefined);

  useEffect(() => {
    if (!worker) return;
    workerRef.current = worker;
    workerRef.current.onmessage = (
      event: MessageEvent<{
        name: string;
        data: { result: T; success: boolean; error: string | undefined };
      }>
    ) => {
      console.log("worker message", event);
      if (event.data.name === eventName) {
        setResult(event.data.data.result);
        setSuccess(event.data.data.success);
        setError(event.data.data.error);
        setIsFetching(false);
      }
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
    workerRef.current.postMessage({ name: eventName, args });
  }, [workerRef, args, submit, isFetching]);

  return { result, isFetching, success, error };
}
