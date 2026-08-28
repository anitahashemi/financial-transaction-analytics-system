import { useState } from "react"
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom"
import UploadButton from "./components/UploadButton"
import Dashboard from "./components/Dashboard"
import Transactions from "./components/Transactions"

function App() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handleFilterChange = (days) => { // receives 30, 60, 90, all
    if (days=="all"){
      setStartDate("")
      setEndDate("")
      return
    }
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)

    setStartDate(start.toISOString().split("T")[0])
    setEndDate(end.toISOString().split("T")[0])
  }
  return (
      <BrowserRouter>
        <div>
          <nav>
            <h1>Financial Analytics</h1>
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/transactions">Transactions</NavLink>
            <UploadButton/>
          </nav>

          {/* date filter buttons */}
          <div>
            <button onClick={() => handleFilterChange(30)}>Last 30 days</button>
            <button onClick={() => handleFilterChange(60)}>Last 60 days</button>
            <button onClick={() => handleFilterChange(90)}>Last 90 days</button>
            <button onClick={() => handleFilterChange(365)}>Last year</button>
            <button onClick={() => handleFilterChange("all")}>All time</button>
          </div>

          {/* page content */}
          <Routes>
            <Route path="/" element={<Dashboard startDate={startDate} endDate={endDate}/>}/>
            <Route path="/transactions" element={<Transactions startDate={startDate} endDate={endDate}/>}/>
          </Routes>
        </div>
      </BrowserRouter>
  )
}

export default App