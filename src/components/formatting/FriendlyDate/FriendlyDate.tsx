import { formatFriendlyDate } from "helpers";

interface FriendlyDateProps {
    iso: string;
}

export const FriendlyDate = ({ iso }: FriendlyDateProps) => {
    const friendly = formatFriendlyDate(iso);
    const fullFormat = new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    });

    return (
        <time dateTime={iso} title={fullFormat}>
            {friendly}
        </time>
    );
};
