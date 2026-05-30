import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { purgeNonPremier } from "db";
import { Dashboard } from "pages/dashboard";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false }
    }
});

const PremierPurger = () => {
    const client = useQueryClient();
    useEffect(() => {
        purgeNonPremier()
            .then(count => {
                if (count > 0) {
                    console.info(`Purged ${count} non-Premier match${count === 1 ? "" : "es"} from local cache.`);
                    client.invalidateQueries({ queryKey: ["matches"] });
                }
            })
            .catch(err => {
                console.warn("Failed to purge non-Premier matches:", err);
            });
    }, [client]);
    return null;
};

export const App = () => (
    <QueryClientProvider client={queryClient}>
        <PremierPurger />
        <Dashboard />
    </QueryClientProvider>
);
