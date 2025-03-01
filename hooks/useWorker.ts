import { useRef, useEffect, useState } from "react";

export default function useWorker<T>(worker: Worker | undefined, args: Record<string, any> | undefined): T | undefined {
    const workerRef = useRef<Worker>(null);
    const [result, setState] = useState<T | undefined>(undefined)

    useEffect(() => {
        if (!worker) return;
        workerRef.current = worker;
        workerRef.current.onmessage = (event: MessageEvent<T>) =>
            setState(event.data)
        return () => {
            workerRef.current?.terminate();
        };
    }, [worker]);

    useEffect(() => {
        if (!args) return;
        const hasEmptyArg = Object.values(args).filter(v => typeof v === 'undefined').length > 0
        if (hasEmptyArg) return;
        workerRef?.current?.postMessage(args)
    }, [workerRef, args])

    return result
}