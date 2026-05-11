import { router } from "@inertiajs/react";
import { useEffect } from "react";
import { toast } from "sonner";

export default function FlashToaster() {
    useEffect(() => {
        const fire = (flash) => {
            if (flash?.success) toast.success(flash.success);
            if (flash?.error) toast.error(flash.error);
        };

        fire(router.page?.props?.flash);

        return router.on("success", (event) => {
            fire(event.detail.page.props.flash);
        });
    }, []);

    return null;
}
