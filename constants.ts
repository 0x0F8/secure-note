export const NEXT_PUBLIC_API_HOST = process.env.NEXT_PUBLIC_API_HOST;
export const NEXT_PUBLIC_NODE_ENV = process.env.NODE_ENV;
export const NEXT_PUBLIC_IS_DEV = NEXT_PUBLIC_NODE_ENV !== "production";
export const NEXT_PUBLIC_IS_PROD = !NEXT_PUBLIC_IS_DEV;
