import FinanceLedger from "@/components/finance/FinanceLedger";

export default function Payables(props) {
    return <FinanceLedger kind="payable" {...props} />;
}
