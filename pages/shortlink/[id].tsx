import { NEXT_PUBLIC_API_HOST_INTERNAL } from "@/constants";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";

type GetShortLinkResponse = {
  success: boolean;
  data: string | null;
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const id = context.params?.id;
  let json: GetShortLinkResponse = { success: false, data: null };

  try {
    const response = await fetch(
      `http://${NEXT_PUBLIC_API_HOST_INTERNAL}/api/shortlink/${id}`
    );
    json = await response.json();
  } catch {}

  return {
    props: {
      path: json?.data || null,
    },
  };
};

export default function ShortLink({ path }: { path: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!path) return;
    const hash = document.location.hash;
    router.replace(path + hash);
  }, [path]);

  if (!path) {
    return "Link does not exist";
  }

  return null;
}
