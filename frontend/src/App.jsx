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
        <nav className="border-b border-gray-800 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-medium text-white tracking-widest uppercase">
              BMO Financial Analytics
            </h1>
            <p className="text-xs text-gray-600 tracking-widest uppercase mt-0.5">
              Local Data / BMO
            </p>
          </div>
          <div className="flex items-center gap-8">
            <NavLink
                to="/"
                className={({isActive}) =>
                    isActive
                        ? "text-xs uppercase tracking-widest text-emerald-400 border-b border-emerald-400 pb-0.5"
                        : "text-xs uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/transactions"
              className={({ isActive }) =>
                isActive
                  ? "text-xs uppercase tracking-widest text-emerald-400 border-b border-emerald-400 pb-0.5"
                  : "text-xs uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
              }
            >
              Transactions
            </NavLink>
            <UploadButton />
          </div>
        </nav>


              {/* date filter bar */}
              <div className="border-b border-gray-800 px-8 py-3 flex items-center gap-6">
                <span className="text-gray-500 text-xs uppercase tracking-widest">Time Range</span>
                <span className="text-gray-700">›</span>
                {filterButtons.map(({label, days}) => (
                    <button
                        key={label}
                        onClick={() => handleFilterChange(days)}
                        className="text-xs font-medium text-gray-400 hover:text-emerald-400
                 transition-colors uppercase tracking-widest"
                    >
                      {label === "Last 30 days" ? "30D" :
                          label === "Last 60 days" ? "60D" :
                              label === "Last 90 days" ? "90D" :
                                  label === "Last year" ? "1Y" : "ALL"}
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