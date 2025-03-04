"use client";
import { ChangeEvent, useEffect, useState } from "react";
import PasswordStrengthBar from "react-password-strength-bar";
import { createPassword } from "@/util/crypto";
import useEncryptWorker from "@/hooks/useEncryptWorker";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { validatePassword } from "@/util/validate";
import prettyBytes from "pretty-bytes";
import mimeTypes from "mime-types";

export default function Home() {
  const [{ data }, setDataState] = useState<{
    data: string;
  }>({ data: "" });
  const [
    { shouldEncrypt, password, defaultPassword, url, shortLink },
    setState,
  ] = useState<{
    password: string;
    defaultPassword: string;
    url: string;
    shortLink: string;
    shouldEncrypt: boolean;
  }>({
    password: "",
    defaultPassword: createPassword(32),
    url: "",
    shortLink: "",
    shouldEncrypt: false,
  });

  const {
    result: encryptResult,
    isFetching: isWorking,
    success: didEncrypt,
    error: encryptError,
  } = useEncryptWorker<{
    salt: string;
    key: string;
    cipher: string;
    hmac: string;
  }>(shouldEncrypt, {
    data,
    password: password.length > 0 ? password : defaultPassword,
  });

  const isValid =
    password.length === 0 ||
    (password.length > 0 && validatePassword(password));
  const usedDefaultPassword = password.length === 0;

  const onDataChange = (event: ChangeEvent<HTMLTextAreaElement>) =>
    setDataState((state) => ({
      ...state,
      data: event.target.value,
      isDataDirty: true,
    }));

  const onPasswordChange = (event: ChangeEvent<HTMLInputElement>) =>
    setState((state) => ({
      ...state,
      password: event.target.value,
    }));

  const onCopy = () =>
    navigator.clipboard.writeText(
      `${document.location.protocol}//${document.location.host}${url}`
    );

  const onSubmit = async () => {
    if (!isValid) return;
    setState((state) => ({ ...state, shouldEncrypt: true }));
    setTimeout(
      () => setState((state) => ({ ...state, shouldEncrypt: false })),
      0
    );
  };

  useEffect(() => {
    if (!isValid || isWorking || !didEncrypt) return;
    const { salt, cipher, hmac } = encryptResult!;
    console.log("cipher:", cipher);

    fetch(
      `${document.location.protocol}//${process.env.NEXT_PUBLIC_API_HOST}/api/file/create`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: `${hmac}${salt}${cipher}` }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        const passwordHash = usedDefaultPassword ? `#${defaultPassword}` : "";
        const { id, shortLink } = data.data;
        setState((state) => ({
          ...state,
          url: `/unlock/${id}${passwordHash}`,
          shortLink: `${document.location.protocol}${shortLink}${passwordHash}`,
        }));
      });
  }, [password, defaultPassword, isWorking]);

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
        <PasswordStrengthBar password={password} minLength={10} />
      )}
      <br />
      <button id="submit" disabled={!isValid} onClick={onSubmit}>
        secure
      </button>
      <br />
      {isWorking && <AiOutlineLoading3Quarters />}
      <br />
      {encryptError && <div>{encryptError}</div>}
      {didEncrypt && (
        <div>
          <div>
            <div>salt: {encryptResult!.salt}</div>
            <div>hmac: {encryptResult!.hmac}</div>
            <div>
              cipher: {(encryptResult!.cipher as string).slice(0, 10)}...
            </div>
            <div>key: {encryptResult!.key}</div>
          </div>
          <div>
            <div>input: {prettyBytes(data.length)}</div>
            <div>
              output: {prettyBytes((encryptResult!.cipher as string).length)}
            </div>
            <div>
              total:{" "}
              {prettyBytes(
                (encryptResult!.cipher as string).length +
                  (encryptResult!.salt || "").length +
                  (encryptResult!.hmac || "").length
              )}
            </div>
            <div>
              {Math.round(
                100 -
                  (data.length / (encryptResult!.cipher as string).length) * 100
              )}
              % bigger
            </div>
          </div>
          <button onClick={onCopy}>copy</button>
          <a href={url} target="_blank">
            <button> unlock</button>
          </a>
          <br />
          <div>
            <a
              href={`${document.location.protocol}//${document.location.host}${url}`}
              target="_blank"
            >
              {`${document.location.protocol}//${document.location.host}${url}`}
            </a>
          </div>
          <div>
            <a href={shortLink} target="_blank">
              {shortLink}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
