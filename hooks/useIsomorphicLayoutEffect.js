import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect warns during SSR. GSAP setup must run before paint to avoid
 * a flash of un-animated content, so this picks the right one per environment.
 *
 * @gsap/react's useGSAP already does this internally — use this hook only for
 * non-GSAP layout reads.
 */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
