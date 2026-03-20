// app/(admin)/index.tsx
import { Redirect, usePathname } from "expo-router";

export default function AdminIndex() {
  const pathname = usePathname();
  if (pathname === '/(admin)' || pathname === '/') {
    return <Redirect href="/service" />;
  }
  return null;
}