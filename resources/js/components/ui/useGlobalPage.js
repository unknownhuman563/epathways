import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";

// `usePage()` requires being inside Inertia's React Page context (i.e. a
// descendant of <App />). Components mounted globally in app.jsx — siblings
// to <App /> — must read the current page via the imperative `router` API
// instead, the same way FlashToaster does. This hook wraps that pattern so
// global widgets re-render on every Inertia navigation.
export default function useGlobalPage() {
    const [page, setPage] = useState(() => router.page || { props: {}, url: typeof window !== "undefined" ? window.location.pathname : "/" });

    useEffect(() => {
        return router.on("navigate", (e) => {
            setPage(e.detail.page);
        });
    }, []);

    return page;
}
