'use client'
import styles from "./page.module.css";
import { ChangeEvent, useEffect, useState } from "react";
import { createKey, createPassword, decrypt, encrypt } from "@/util/crypto";
import useWorker from "@/hooks/useWorker";
import useEncryptWorker from "@/hooks/useEncryptWorker";

export default function Home() {
  const [{ value, isDirty }, setInputState] = useState<{ value: string, isDirty: boolean }>({ value: '', isDirty: false })
  const [{ password, salt, key }, setEncryptionState] = useState<{ key: string | undefined, password: string | undefined, salt: string | undefined }>({ key: undefined, password: undefined, salt: undefined })

  const isValid = value.length > 0 && isDirty
  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => setInputState(state => ({ ...state, value: event.target.value, isDirty: true }))
  const onSubmit = async () => {
    if (!isValid) return;
    const password = createPassword(64)
    console.log('password:', password)
    const salt = createPassword(16)
    console.log('salt:', salt)
    const key = await createKey(password, salt)
    console.log('key:', key)

    setEncryptionState({ key, password, salt })
    // const cipher = encrypt(value, key)
    // console.log('cipher:', cipher)
    // const decrypted = decrypt(cipher, key)
    // console.log(decrypted)
  }

  const cipher = useEncryptWorker<string>({ data: value, key })

  useEffect(() => {
    if (!cipher || !password || !salt) return;
    fetch(`http://${process.env.NEXT_PUBLIC_API_HOST}/api/note/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: cipher, }) }).then(res => res.json()).then(data => {
      console.log(`http://localhost:3000/unlock/${data.data}?password=${password}&salt=${salt}`)
    })
  }, [cipher, password, salt])

  return (
    <div>
      <textarea id="data" name="data" onChange={onChange} />
      <button id="submit" disabled={!isValid} onClick={onSubmit}>Secure</button>
    </div>
  );
}
