import UploadButton from "./components/UploadButton"
import Dashboard from "./components/Dashboard"
import Transactions from "./components/Transactions"

function App() {
  return (
    <div>
      <h1>Financial Analytics</h1>
        <UploadButton />
        <Dashboard />
        <Transactions />
    </div>
  )
}

export default App