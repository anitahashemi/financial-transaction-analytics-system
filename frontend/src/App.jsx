import { useState } from "react"
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom"
import UploadButton from "./components/UploadButton"
import Dashboard from "./components/Dashboard"
import Transactions from "./components/Transactions"

function App() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [granularity, setGranularity] = useState("monthly")

  const handleFilterChange = (days) => {
    if (days === "all") {
      setStartDate("")
      setEndDate("")
      setGranularity("monthly")
      return
    }
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)

    setStartDate(start.toISOString().split("T")[0])
    setEndDate(end.toISOString().split("T")[0])

    if (days <= 60) {
      setGranularity("daily")
    } else {
      setGranularity("monthly")
    }
  }

  const filterButtons = [
    { label: "Last 30 days", days: 30 },
    { label: "Last 60 days", days: 60 },
    { label: "Last 90 days", days: 90 },
    { label: "Last year", days: 365 },
    { label: "All time", days: "all" },
  ]

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-white">

        {/* navbar */}
        <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">
            <span className="text-[#4E9A6F]">Ana</span>lytics
          </h1>
          <div className="flex items-center gap-6">
            <NavLink
                to="/"
                className={({isActive}) =>
                    isActive
                        ? "text-[#4E9A6F] font-semibold border-b-2 border-[#4E9A6F] pb-1"
                        : "text-gray-400 hover:text-white transition-colors"
                }
            >
              Dashboard
            </NavLink>
            <NavLink
                to="/transactions"
                className={({isActive}) =>
                    isActive
                        ? "text-[#4E9A6F] font-semibold border-b-2 border-[#4E9A6F] pb-1"
                        : "text-gray-400 hover:text-white transition-colors"
                }
            >
              Transactions
            </NavLink>
            <UploadButton/>
          </div>
        </nav>

        {/* date filter bar */}
        <div className="bg-gray-900 border-b border-gray-800 px-8 py-3 flex items-center gap-3">
          <span className="text-gray-400 text-sm mr-2">Time range:</span>
          {filterButtons.map(({ label, days }) => (
            <button
              key={label}
              onClick={() => handleFilterChange(days)}
              className="px-4 py-1.5 rounded-full text-sm font-medium
                         bg-gray-800 text-gray-300 hover:bg-[#4E9A6F]
                         hover:text-white transition-all duration-200"
            >
              {label}
            </button>
          ))}
        </div>

        {/* page content */}
        <main className="px-8 py-8">
          <Routes>
            <Route path="/" element={
              <Dashboard
                startDate={startDate}
                endDate={endDate}
                granularity={granularity}
              />}
            />
            <Route path="/transactions" element={
              <Transactions
                startDate={startDate}
                endDate={endDate}
              />}
            />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  )
}

export default App