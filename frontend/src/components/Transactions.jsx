import { useState, useEffect } from "react"
import axios from "axios"

function Transactions({ startDate, endDate }){
    const [ transactions, setTransactions ] = useState(null)

    useEffect( () => {
        const fetchTransactions = async() => {
            try{
                const params = {}
                if (startDate && endDate) {
                params.start = startDate
                params.end = endDate
                }
                const response = await axios.get("http://localhost:5000/transactions", {params})
                setTransactions(response.data)
            }catch (error){
                console.error("Failed to fetch transactions: ", error)
            }
        }

        fetchTransactions()
        }, [startDate, endDate]) // re-fetch when dates change

    if (!transactions) return <p>Loading transactions...</p>

    return (
        <div>
            <h2>Transactions</h2>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Category</th>
                        <th>Type</th>
                    </tr>
                </thead>
                <tbody>
                {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                            <td>{transaction.date}</td>
                            <td>{transaction.description}</td>
                            <td>${Math.abs(transaction.amount).toFixed(2)}</td>
                            <td>{transaction.category}</td>
                            <td>{transaction.transaction_type}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}


export default Transactions