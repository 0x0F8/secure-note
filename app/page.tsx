"use client";
import { ChangeEvent, useEffect, useState } from "react";
import PasswordStrengthBar from "react-password-strength-bar";
import { createKey, createPassword } from "@/util/crypto";
import useEncryptWorker from "@/hooks/useEncryptWorker";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { validatePassword } from "@/util/validate";
import prettyBytes from "pretty-bytes";

export default function Home() {
  const [{ data }, setDataState] = useState<{
    data: string;
  }>({ data: "" });
  const [{ password, defaultPassword, url }, setPasswordState] = useState<{
    password: string;
    defaultPassword: string;
    url: string;
  }>({
    password: "",
    defaultPassword: createPassword(64),
    url: "",
  });
  const [{ salt, key, shouldEncrypt, lastCipher }, setEncryptionState] =
    useState<{
      key: string | undefined;
      salt: string | undefined;
      shouldEncrypt: boolean;
      lastCipher: string | undefined;
    }>({
      key: undefined,
      salt: undefined,
      shouldEncrypt: false,
      lastCipher: undefined,
    });

  const [cipher, isWorking, didEncrypt] = useEncryptWorker<string>(
    shouldEncrypt,
    {
      data,
      key,
      compress: false,
    }
  );

  const isValid =
    data.length > 0 &&
    (password.length === 0 ||
      (password.length > 0 && validatePassword(password)));
  const usedDefaultPassword = password.length === 0;

  const onDataChange = (event: ChangeEvent<HTMLTextAreaElement>) =>
    setDataState((state) => ({
      ...state,
      data: event.target.value,
      isDataDirty: true,
    }));

  const onPasswordChange = (event: ChangeEvent<HTMLInputElement>) =>
    setPasswordState((state) => ({
      ...state,
      password: event.target.value,
    }));

  const onCopy = () =>
    navigator.clipboard.writeText(
      `${document.location.protocol}//${document.location.host}${url}`
    );

  const onSubmit = async () => {
    if (!isValid) return;
    const salt = createPassword(16);
    console.log("salt:", salt);
    const key = await createKey(
      usedDefaultPassword ? defaultPassword : password,
      salt
    );
    console.log("key:", key);

    setEncryptionState({
      key,
      salt,
      lastCipher: cipher as string,
      shouldEncrypt: true,
    });
  };

  useEffect(() => {
    const isCipherUnique =
      typeof lastCipher === "undefined" ||
      (typeof lastCipher === "string" && lastCipher !== cipher);
    if (!cipher || !isValid || !salt || isWorking || !isCipherUnique) return;
    console.log("cipher:", cipher);

    fetch(
      `${document.location.protocol}//${process.env.NEXT_PUBLIC_API_HOST}/api/file/create`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: `${salt}:${cipher}` }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        const passwordHash = usedDefaultPassword ? `#${defaultPassword}` : "";
        const id = data.data;
        setPasswordState((state) => ({
          ...state,
          url: `/unlock/${id}${passwordHash}`,
        }));
      });
  }, [cipher, password, defaultPassword, salt, isWorking, lastCipher]);

  useEffect(
    () => setEncryptionState((state) => ({ ...state, shouldEncrypt: false })),
    [shouldEncrypt]
  );

  return (
    <div>
      <textarea id="data" name="data" onChange={onDataChange} />
      <br />
      <input
        type="text"
        name="password"
        placeholder={defaultPassword}
        onChange={onPasswordChange}
      />
      {password.length > 0 && (
        <PasswordStrengthBar password={password} minLength={8} />
      )}
      <br />
      <button id="submit" disabled={!isValid} onClick={onSubmit}>
        secure
      </button>
      <br />
      {isWorking && <AiOutlineLoading3Quarters />}
      <br />
      {didEncrypt === false && <div>Encrypt failure!</div>}
      {didEncrypt && (
        <div>
          <div>
            <div>input: {prettyBytes(data.length)}</div>
            <div>output: {prettyBytes((cipher as string).length)}</div>
            <div>
              {Math.round(
                100 - (data.length / (cipher as string).length) * 100
              )}
              % bigger
            </div>
          </div>
          <button onClick={onCopy}>copy</button>
          <a href={url} target="_blank">
            <button> unlock</button>
          </a>
        </div>
      )}
    </div>
  );
}
