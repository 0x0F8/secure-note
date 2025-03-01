"use client";
import { NEXT_PUBLIC_API_HOST } from "@/constants";
import useDecryptWorker from "@/hooks/useDecryptWorker";
import { createKey } from "@/util/crypto";
import { isBrowser } from "@/util/next";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { ChangeEvent, useEffect, useState } from "react";

type UnlockNoteResponse = {
  success: boolean;
  data: string;
};

export const getServerSideProps = (async (
  context: GetServerSidePropsContext
) => {
  const id = context.params?.id;
  const salt = context.query?.salt;
  const res = await fetch(
    `http://${NEXT_PUBLIC_API_HOST}/api/note/unlock/${id}`
  );
  const json: UnlockNoteResponse = await res.json();
  return {
    props: {
      data: json.data || "",
      salt: salt || "",
    },
  };
}) satisfies GetServerSideProps<{ data: string }>;

export default function Home({ data, salt }: { data: string; salt: string }) {
  if (!salt) {
    return "Salt is empty";
  }
  if (!data) {
    return "Data is empty";
  }

  const hashPassword = isBrowser() ? window.location.hash.substring(1) : "";
  const isPasswordRequired = !hashPassword;
  const [password, setPassword] = useState<string>(hashPassword);
  const [didSubmit, setDidSubmit] = useState<boolean>(false);
  const [key, setKey] = useState<string>("");
  const isValid = password?.length > 0;
  const [deciphered, isWorking, didDecrypt] = useDecryptWorker<string>(
    didSubmit && key.length > 0,
    {
      data,
      key,
    }
  );

  const onPasswordChange = (event: ChangeEvent<HTMLInputElement>) =>
    setPassword(event.target.value);
  const onSubmit = () => {
    if (!isValid || isWorking) return;
    setDidSubmit(true);
  };

  useEffect(() => {
    if (!isValid || isWorking) return;
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
    if (!isWorking) {
      setDidSubmit(false);
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

      {data}
      <br />
      {didDecrypt === false && <div>Decrypt failure!</div>}
      {deciphered}
    </div>
  );
}
