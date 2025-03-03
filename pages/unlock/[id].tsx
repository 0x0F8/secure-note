"use client";
import { NEXT_PUBLIC_API_HOST_INTERNAL } from "@/constants";
import useDecryptWorker from "@/hooks/useDecryptWorker";
import { createKey } from "@/util/crypto";
import { isBrowser } from "@/util/next";
import { validatePassword } from "@/util/validate";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { ChangeEvent, useEffect, useState } from "react";

type UnlockNoteResponse = {
  success: boolean;
  data: string | null;
};

export const getServerSideProps = (async (
  context: GetServerSidePropsContext
) => {
  const id = context.params?.id;
  let json: UnlockNoteResponse = { success: false, data: null };

  try {
    const response = await fetch(
      `http://${NEXT_PUBLIC_API_HOST_INTERNAL}/api/file/unlock/${id}`
    );
    json = await response.json();
  } catch {}

  return {
    props: {
      link: json.data,
    },
  };
}) satisfies GetServerSideProps<{ link: string | null }>;

export default function Home({ link }: { link: string | null }) {
  const hashPassword = isBrowser() ? window.location.hash.substring(1) : "";
  const isPasswordRequired = !hashPassword;
  const [password, setPassword] = useState<string>(hashPassword);
  const [data, setData] = useState<string | undefined>(undefined);
  const [salt, setSalt] = useState<string | undefined>(undefined);
  const [didSubmit, setDidSubmit] = useState<boolean>(false);
  const [key, setKey] = useState<string>("");
  const [error, setError] = useState<string>("");
  const isValid = validatePassword(password);
  const [deciphered, isWorking, didDecrypt] = useDecryptWorker<string>(
    didSubmit && key.length > 0 && !!data && !!salt,
    {
      data,
      key,
      compress: false,
    }
  );

  const onPasswordChange = (event: ChangeEvent<HTMLInputElement>) =>
    setPassword(event.target.value);
  const onSubmit = () => {
    if (!isValid || isWorking) return;
    setDidSubmit(true);
  };
  const onCopy = () => navigator.clipboard.writeText(deciphered as string);

  useEffect(() => {
    if (!isValid || isWorking || !salt) return;
    (async () => {
      const nextKey = await createKey(password, salt);
      if (key === nextKey) return;
      setKey(nextKey);
      if (!isPasswordRequired) {
        setDidSubmit(true);
      }
    })();
  }, [data, password, salt, key, isPasswordRequired]);

  useEffect(() => {
    if (link == null) {
      setError("Invalid link!");
      return;
    }

    (async () => {
      const response = await fetch(link);
      if (!response || !response.ok) {
        setError("Invalid link!");
        return;
      }

      const rawData = await response.text();
      const [salt, data] = (rawData || "").split(":");
      if (!salt) {
        setError("Salt is empty!");
        return;
      } else if (!data) {
        setError("Data is empty!");
        return;
      }
      setSalt(salt);
      setData(data);
    })();
  }, []);

  useEffect(() => {
    if (!isWorking) {
      setDidSubmit(false);
    }
  }, [isWorking]);

  return (
    <div>
      {isPasswordRequired && !error && (
        <>
          <input
            type="text"
            name="password"
            value={password}
            onChange={onPasswordChange}
          />
          <button
            type="submit"
            name="decrypt"
            disabled={!isValid}
            onClick={onSubmit}
          >
            Decrypt
          </button>
        </>
      )}
      {data}
      {didDecrypt && (
        <div>
          {/* <div>{deciphered}</div> */}
          <img src={`data:image/jpg;base64,${deciphered}`} />
          <button onClick={onCopy}>Copy</button>
        </div>
      )}

      {didDecrypt === false && <div>Decrypt failure!</div>}
      {error && <div>{error}</div>}
    </div>
  );
}
