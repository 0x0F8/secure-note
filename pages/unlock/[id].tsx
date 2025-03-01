"use client"
import useDecryptWorker from "@/hooks/useDecryptWorker";
import { createKey, } from "@/util/crypto";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useEffect, useState } from "react";

type UnlockNoteResponse = {
    success: boolean; data: string
}

export const getServerSideProps = (async (context: GetServerSidePropsContext) => {
    const id = context.params?.id
    const password = context.query?.password
    const salt = context.query?.salt
    const res = await fetch(`http://${process.env.NEXT_PUBLIC_API_HOST}/api/note/unlock/${id}`)
    const json: UnlockNoteResponse = await res.json()
    console.log(json)
    return { props: { data: json.data || '', password: password || '', salt: salt || '' } }
}) satisfies GetServerSideProps<{ data: string }>

export default function Home({ data, password, salt }: { data: string, password: string, salt: string }) {
    if (!password) {
        return 'Password is empty'
    }
    if (!salt) {
        return 'Salt is empty'
    }
    if (!data) {
        return 'Data is empty'
    }

    const [key, setKey] = useState<string>('')
    useEffect(() => {
        (async () => {
            const key = await createKey(password, salt)
            setKey(key)
        })()
    }, [data, password, salt])

    const deciphered = useDecryptWorker<string>({ data, key })

    return (
        <div >
            {data}<br />
            {deciphered}
        </div>
    );
}
