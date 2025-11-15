import TransactionsClient from "@/components/app/transactions-client";
import { getTransactions } from "@/lib/data";

export default async function TransactionsPage() {
  const transactions = await getTransactions();
  return <TransactionsClient initialTransactions={transactions} />;
}
