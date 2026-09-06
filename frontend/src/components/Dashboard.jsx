import { useState, useEffect } from "react"
import Chatbot from "./Chatbot"
import BudgetTracker from "./BudgetTracker"
import axios from "axios"
import { PieChart, Pie, Cell, Legend,
         LineChart, Line, XAxis, YAxis,
         CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const COLORS = [
  "#6366f1", "#8b5cf6", "#E2979C", "#4E9A6F",
  "#f97316", "#E5B842", "#22c55e", "#14b8a6",
  "#3b82f6", "#F67292"
]

function Dashboard({ startDate, endDate, granularity }) {
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
        const response = await axios.get("http://localhost:5000/analytics/summary", { params })
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
        params.granularity = granularity || "monthly"
        const response = await axios.get("http://localhost:5000/analytics/trends", { params })
        setTrends(response.data)
      } catch (error) {
        console.error("Failed to fetch trends:", error)
      }
    }

    fetchSummary()
    fetchTrends()
  }, [startDate, endDate, granularity])

  if (!summary) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-lg">Loading...</p>
    </div>
  )

  const categoryData = Object.entries(summary.by_category).map(([name, value]) => ({
    name,
    value: Math.abs(value)
  }))

  return (
    <div className="space-y-8">

      {/* summary cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 border-t-2 border-t-green-600">
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">
            Total Income
          </p>
          <p className="text-3xl font-bold text-green-600">
            ${summary.total_income?.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 border-t-2 border-t-amber-500">
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">
            Total Spending
          </p>
          <p className="text-3xl font-bold text-amber-400">
            ${Math.abs(summary.total_spending)?.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 border-t-2 border-t-teal-700">
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">
            Net Savings
          </p>
          <p className={`text-3xl font-bold ${summary.net_savings >= 0 ? "text-teal-700" : "text-rose-400"}`}>
            ${summary.net_savings?.toFixed(2)}
          </p>
        </div>
      </div>

      {/* charts row */}
      <div className="grid grid-cols-2 gap-6">

        {/* pie chart */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-900">
          <h2 className="text-lg font-semibold text-white mb-6">
            Spending by Category
          </h2>
          <PieChart width={420} height={350}>
            <Pie
              data={categoryData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}

            >
              {categoryData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `$${value.toFixed(2)}`}
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #4E9A6F",
                borderRadius: "8px",
                color: "#fff"
              }}
            />
            <Legend />
          </PieChart>
        </div>

        {/* line chart */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-900">
          <h2 className="text-lg font-semibold text-white mb-6">
            {granularity === "daily" ? "Daily" : "Monthly"} Spending Trend
          </h2>
          {trends && trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey={granularity === "daily" ? "day" : "month"}
                  stroke="#9ca3af"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value) => `$${Math.abs(value)}`}
                  stroke="#9ca3af"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => `$${Math.abs(value).toFixed(2)}`}
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff"
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total_spending"
                  stroke="#4E9A6F"
                  strokeWidth={2}
                  dot={{ fill: "#4E9A6F", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">No data for selected period</p>
            </div>
          )}
        </div>
      </div>
      {/* budget tracker */}
      <BudgetTracker startDate={startDate} endDate={endDate} />

      {/* AI financial assistant */}
      <Chatbot startDate={startDate} endDate={endDate} />
    </div>
  )
}

export default Dashboard