import { useState, useEffect } from "react"
import axios from "axios"
import { PieChart, Pie, Cell, Legend,
         LineChart, Line, XAxis, YAxis,
         CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// color palette for pie chart slices
const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#a855f7"
]

// Displays financial summary cards and spending breakdown chart
function Dashboard({ startDate, endDate }) {
  const [summary, setSummary] = useState(null)
  const [trends, setTrends] = useState(null)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const params = {}
        if (startDate && endDate) {
          params.start = startDate
          params.end = endDate
        }
        const response = await axios.get("http://localhost:5000/analytics/summary", {params})
        setSummary(response.data)
      } catch (error) {
        console.error("Failed to fetch summary:", error)
      }
    }

    const fetchTrends = async () => {
      try {
        const params = {}
        if (startDate && endDate) {
          params.start = startDate
          params.end = endDate
        }
        const response = await axios.get("http://localhost:5000/analytics/trends", { params })
        setTrends(response.data)
      } catch (error) {
        console.error("Failed to fetch trends:", error)
      }
    }

    fetchSummary()
    fetchTrends()

  }, [startDate, endDate]) // re-fetch when dates change

  if (!summary) return <p>Loading...</p>

  // converting by_category object into array Recharts expects
  const categoryData = Object.entries(summary.by_category).map(([name, value]) => ({
    name,
    value: Math.abs(value)  // convert negative spending to positive for chart
  }))

  return (
    <div>
      {/* summary cards */}
      <div>
        <div>
          <h3>Total Income</h3>
          <p>${summary.total_income?.toFixed(2)}</p>
        </div>
        <div>
          <h3>Total Spending</h3>
          <p>${Math.abs(summary.total_spending)?.toFixed(2)}</p>
        </div>
        <div>
          <h3>Net Savings</h3>
          <p>${summary.net_savings?.toFixed(2)}</p>
        </div>
      </div>
      {/* spending by category pie chart */}
      <h2>Spending by Category</h2>
      <PieChart width={500} height={400}>
        <Pie
          data={categoryData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={150}
          label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
        >
            {categoryData.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
        <Legend />
      </PieChart>

    {/* line chart — must be inside the main div */}
      <h2>Monthly Spending Trend</h2>
      {trends && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `$${Math.abs(value)}`} />
            <Tooltip formatter={(value) => `$${Math.abs(value).toFixed(2)}`} />
            <Line
              type="monotone"
              dataKey="total_spending"
              stroke="#6366f1"
              strokeWidth={2}
              dot={true}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default Dashboard