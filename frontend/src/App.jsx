import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom"
import UploadButton from "./components/UploadButton"
import Dashboard from "./components/Dashboard"
import Transactions from "./components/Transactions"

function App() {
  return (
    <BrowserRouter>
      <div>
        {/* navigation bar */}
        <nav>
          <h1>Financial Analytics</h1>
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/transactions">Transactions</NavLink>
          <UploadButton />
        </nav>

        {/* page content */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App