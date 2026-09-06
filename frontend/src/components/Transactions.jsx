import { useState, useEffect } from "react"
import axios from "axios"

function Transactions({ startDate, endDate }) {
    const [transactions, setTransactions] = useState(null)

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const params = {}
                if (startDate && endDate) {
                    params.start = startDate
                    params.end = endDate
                }
                const response = await axios.get("http://localhost:5000/transactions", { params })
                setTransactions(response.data)
            } catch (error) {
                console.error("Failed to fetch transactions:", error)
            }
        }
        fetchTransactions()
    }, [startDate, endDate])

    if (!transactions) return (
        <div className="flex items-center justify-center h-64">
            <p className="text-gray-400">Loading transactions...</p>
        </div>
    )

    return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-xs text-gray-500 uppercase tracking-widest">
                Transactions
            </h2>
            <span className="text-xs text-gray-600">{transactions.length} records</span>
        </div>

        <table className="w-full">
            <thead>
                <tr className="border-b border-gray-800">
                    <th className="text-left pb-3 text-xs font-medium text-gray-600 uppercase tracking-widest">Date</th>
                    <th className="text-left pb-3 text-xs font-medium text-gray-600 uppercase tracking-widest">Description</th>
                    <th className="text-right pb-3 text-xs font-medium text-gray-600 uppercase tracking-widest">Amount</th>
                    <th className="text-left pb-3 text-xs font-medium text-gray-600 uppercase tracking-widest pl-8">Category</th>
                    <th className="text-left pb-3 text-xs font-medium text-gray-600 uppercase tracking-widest">Type</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-900">
                {transactions.map((transaction) => (
                    <tr
                        key={transaction.id}
                        className="hover:bg-gray-900 transition-colors duration-150"
                    >
                        <td className="py-3 text-xs text-gray-500 whitespace-nowrap">
                            {new Date(transaction.date).toLocaleDateString("en-CA", {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                            })}
                        </td>
                        <td className="py-3 text-sm text-gray-300 max-w-xs truncate">
                            {transaction.description}
                        </td>
                        <td className={`py-3 text-sm font-medium text-right whitespace-nowrap
                            ${transaction.transaction_type === "CREDIT"
                                ? "text-emerald-400"
                                : "text-gray-400"
                            }`}>
                            {transaction.transaction_type === "CREDIT" ? "+" : "-"}
                            ${Math.abs(transaction.amount).toFixed(2)}
                        </td>
                        <td className="py-3 pl-8">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">
                                {transaction.category}
                            </span>
                        </td>
                        <td className="py-3 text-xs text-gray-600 uppercase tracking-wider">
                            {transaction.transaction_type}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)
}

export default Transactions