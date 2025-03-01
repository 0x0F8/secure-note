"use client";
import { ChangeEvent, useEffect, useState } from "react";
import PasswordStrengthBar from "react-password-strength-bar";
import { createKey, createPassword } from "@/util/crypto";
import useEncryptWorker from "@/hooks/useEncryptWorker";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function Home() {
  const [{ data }, setDataState] = useState<{
    data: string;
  }>({ data: "" });
  const [{ password, defaultPassword, strength }, setPasswordState] = useState<{
    password: string;
    defaultPassword: string;
    strength: number;
  }>({
    password: "",
    strength: 0,
    defaultPassword: createPassword(64),
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
      compress: true,
    }
  );

  const isValid =
    data.length > 0 &&
    (password.length === 0 || (password.length > 0 && strength > 1));
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

  const onStrengthChange = (score: number) =>
    setPasswordState((state) => ({ ...state, strength: score }));

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

    fetch(`http://${process.env.NEXT_PUBLIC_API_HOST}/api/note/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: `${salt}:${cipher}` }),
    })
      .then((res) => res.json())
      .then((data) => {
        const passwordHash = usedDefaultPassword ? `#${defaultPassword}` : "";
        const protocol = document.location.protocol;
        console.log(
          `${protocol}//localhost:3000/unlock/${data.data}${passwordHash}`
        );
      });
  }, [cipher, password, defaultPassword, salt, isWorking, lastCipher]);

  useEffect(
    () => setEncryptionState((state) => ({ ...state, shouldEncrypt: false })),
    [shouldEncrypt]
  );

  return (
    <div>
      <textarea id="data" name="data" onChange={onDataChange} />

      <input
        type="text"
        name="password"
        placeholder={defaultPassword}
        onChange={onPasswordChange}
      />
      {password.length > 0 && (
        <PasswordStrengthBar
          password={password}
          onChangeScore={onStrengthChange}
        />
      )}

      <button id="submit" disabled={!isValid} onClick={onSubmit}>
        Secure
      </button>

      {isWorking && <AiOutlineLoading3Quarters />}
      {didEncrypt === false && <div>Encrypt failure!</div>}
    </div>
  );
}
