import { useState, useEffect } from "react"
import Chatbot from "./Chatbot"
import BudgetTracker from "./BudgetTracker"
import axios from "axios"
import { LineChart, Line, XAxis, YAxis,
         CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

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
        <div className="border-b border-gray-800 pb-8">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">
            Overview
          </p>
          <div className="grid grid-cols-3 gap-0 divide-x divide-gray-800">
            <div className="pr-8">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                Total Income
              </p>
              <p className="text-4xl font-medium text-[#D8D0B8]">
                ${summary.total_income?.toLocaleString("en-CA", {minimumFractionDigits: 2})}
              </p>
            </div>
            <div className="px-8">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                Total Spending
              </p>
              <p className="text-4xl font-medium text-[#D8D0B8]">
                ${Math.abs(summary.total_spending)?.toLocaleString("en-CA", {minimumFractionDigits: 2})}
              </p>
            </div>
            <div className="pl-8">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                Net Savings
              </p>
              <p className={`text-4xl font-medium ${summary.net_savings >= 0 ? "text-[#D8D0B8]" : "text-[#D8D0B8]"}`}>
                ${summary.net_savings?.toLocaleString("en-CA", {minimumFractionDigits: 2})}
              </p>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-16">


          {/* horizontal category bars */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">
              Spending by Category
            </p>
            <div className="space-y-3">
              {[...categoryData]
                  .sort((a, b) => b.value - a.value)
                  .map((item, index) => {
                    const max = Math.max(...categoryData.map(d => d.value))
                    const pct = (item.value / max) * 100
                    return (
                        <div key={item.name} className="flex items-center gap-4">
            <span className="text-xs text-gray-500 uppercase tracking-wider w-36 text-right shrink-0">
              {item.name}
            </span>
                          <div className="flex-1 h-1.5 bg-gray-800">
                            <div className="h-full bg-[#6FA879] transition-all duration-500"
                                style={{width: `${pct}%`}}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-24 text-right shrink-0">
              ${item.value.toLocaleString("en-CA", {minimumFractionDigits: 2})}
            </span></div>
                    )})}
            </div>
          </div>

          {/* line chart */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">
              {granularity === "daily" ? "Daily" : "Monthly"} Spending Trend
            </p>
            {trends && trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                    <XAxis
                        dataKey={granularity === "daily" ? "day" : "month"}
                        stroke="#4b5563"
                        tick={{fill: "#6b7280", fontSize: 11}}
                    />
                    <YAxis
                        tickFormatter={(value) => `$${Math.abs(value)}`}
                        stroke="#4b5563"
                        tick={{fill: "#6b7280", fontSize: 11}}
                    />
                    <Tooltip
                        formatter={(value) => `$${Math.abs(value).toFixed(2)}`}
                        contentStyle={{
                          backgroundColor: "#111827",
                          border: "1px solid #374151",
                          borderRadius: "4px",
                          color: "#fff"
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="total_spending"
                        stroke="#4E9A6F"
                        strokeWidth={2}
                        dot={{fill: "#6FA879", r: 4}}
                        activeDot={{r: 6}}
                    />
                  </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-600">No data for selected period</p>
                </div>
            )}
          </div>
        </div>

        {/* budget tracker */}
        <div className="border-t border-gray-800 pt-8">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">
            Budget Tracker
          </p>
          <BudgetTracker startDate={startDate} endDate={endDate}/>
        </div>

        {/*chatbot */}
        <div className="border-t border-gray-800 pt-8">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">
            Financial Assistant
          </p>
          <Chatbot startDate={startDate} endDate={endDate}/>
        </div>
      </div>
  )
}

export default Dashboard