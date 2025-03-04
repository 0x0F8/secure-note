"use client";
import { NEXT_PUBLIC_API_HOST_INTERNAL } from "@/constants";
import useDecryptWorker from "@/hooks/useDecryptWorker";
import { calculateHmac, createKey } from "@/util/crypto";
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
  const [didSubmit, setDidSubmit] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const isValid = validatePassword(password);

  const {
    result: decryptResult,
    isFetching: isWorking,
    success: didDecrypt,
    error: decryptError,
  } = useDecryptWorker<{
    salt: string;
    key: string;
    data: string;
    hmac: string;
  }>(!!data && ((isPasswordRequired && didSubmit) || !isPasswordRequired), {
    data,
    password,
  });

  const onPasswordChange = (event: ChangeEvent<HTMLInputElement>) =>
    setPassword(event.target.value);
  const onSubmit = () => {
    if (!isValid || isWorking) return;
    setDidSubmit(true);
  };
  const onCopy = () =>
    decryptResult && navigator.clipboard.writeText(decryptResult.data);

  useEffect(() => {
    if (link == null) {
      setError("Invalid link!");
      return;
    }

    (async () => {
      let response: Response | undefined;
      try {
        response = await fetch(link);
      } catch (error: unknown) {
        console.error(error);
      }

      if (!response || !response.ok) {
        setError("Invalid link!");
        return;
      }
      const data = await response.text();
      setData(data);
    })();
  }, []);

  useEffect(() => {
    if (isWorking) {
      setDidSubmit(true);
    } else {
      if (isPasswordRequired) {
        setDidSubmit(false);
      }
    }
  }, [isWorking]);

  return (
    <div>
      {isPasswordRequired && (
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
      <div>
        <div>cipher: {data?.slice(0, 10)}...</div>
        <div>link: {link}</div>
      </div>
      {didDecrypt && (
        <>
          <div>
            <div>salt: {decryptResult!.salt}</div>
            <div>hmac: {decryptResult!.hmac}</div>
            <div>key: {decryptResult!.key}</div>
          </div>
          <div>
            <div>{decryptResult!.data}</div>
            {/* <img src={`data:image/jpg;base64,${deciphered}`} /> */}
            <button onClick={onCopy}>Copy</button>
          </div>
        </>
      )}

      {didDecrypt === false && <div>Decrypt failure!</div>}
      {error && <div>{error}</div>}
      {decryptError && <div>{decryptError}</div>}
    </div>
  );
}
