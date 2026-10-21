"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { listGuardianChildren } from "@/lib/api/guardians";
import type { GuardianChild } from "@/lib/api/types";

/**
 * Ward selection shared by every portal screen. The selected child lives in
 * the `?studentId=` query param so refreshes and deep links keep the right
 * ward, and switching mid-tab re-filters the current screen in place.
 */
export function useSelectedChild() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [children, setChildren] = React.useState<GuardianChild[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    listGuardianChildren().then(
      (res) => {
        if (cancelled) return;
        setChildren(res.children ?? []);
        setLoaded(true);
      },
      () => {
        if (cancelled) return;
        setLoaded(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const selectedId = searchParams.get("studentId") ?? "";
  const selected =
    children.find((child) => child.id === selectedId) ?? children[0] ?? null;

  const select = React.useCallback(
    (childId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (childId) {
        params.set("studentId", childId);
      } else {
        params.delete("studentId");
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return { children, selected, selectedId: selected?.id ?? "", select, loaded };
}
