import { useState, useEffect } from "react"
import axios from "axios"

const CATEGORIES = [
  "Income", "Groceries", "Dining", "Coffee",
  "Transportation", "Shopping", "Subscriptions",
  "Health & Wellness", "Transfer", "Entertainment",
  "Savings & Investments", "Other"
]

// Returns color based on spending vs budget ratio
function getProgressColor(spent, budget) {
  const ratio = spent / budget
  if (ratio >= 1) return "bg-rose-500"
  if (ratio >= 0.8) return "bg-yellow-500"
  return "bg-emerald-500"
}

function getStatusText(spent, budget) {
  const ratio = spent / budget
  if (ratio >= 1) return { text: "Over budget", color: "text-rose-400" }
  if (ratio >= 0.8) return { text: "Near limit", color: "text-yellow-400" }
  return { text: "On track", color: "text-emerald-400" }
}

function BudgetTracker({ startDate, endDate }) {
  const [budgets, setBudgets] = useState([])
  const [editing, setEditing] = useState(false)
  const [editValues, setEditValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  // fetch budgets with current spending
  const fetchBudgets = async () => {
    try {
      const params = {}
      if (startDate && endDate) {
        params.start = startDate
        params.end = endDate
      }
      const response = await axios.get("http://localhost:5000/budgets", { params })
      setBudgets(response.data)

      // initialize edit values from current budgets
      const values = {}
      response.data.forEach(b => {
        values[b.category] = b.budget
      })
      setEditValues(values)
    } catch (error) {
      console.error("Failed to fetch budgets:", error)
    }
  }

  useEffect(() => {
    fetchBudgets()
  }, [startDate, endDate])

  // initialize edit values for all categories when entering edit mode
  const handleEditClick = () => {
    const values = {}
    CATEGORIES.forEach(cat => {
      const existing = budgets.find(b => b.category === cat)
      values[cat] = existing ? existing.budget : ""
    })
    setEditValues(values)
    setEditing(true)
  }

  // save all budgets that have values
  const handleSave = async () => {
    setSaving(true)
    setMessage("")

    try {
      const promises = Object.entries(editValues)
        .filter(([_, amount]) => amount && parseFloat(amount) > 0)
        .map(([category, amount]) =>
          axios.post("http://localhost:5000/budgets", {
            category,
            amount: parseFloat(amount)
          })
        )

      await Promise.all(promises)
      setMessage("Budgets saved successfully")
      setEditing(false)
      fetchBudgets()
    } catch (error) {
      setMessage("Failed to save budgets")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Budget Tracker</h2>
        <div className="flex items-center gap-3">
          {message && (
            <span className="text-sm text-emerald-400">{message}</span>
          )}
          {editing ? (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-xl text-sm text-gray-400
                           hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-medium
                           bg-emerald-600 hover:bg-emerald-500
                           text-white transition-colors"
              >
                {saving ? "Saving..." : "Save Budgets"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleEditClick}
              className="px-4 py-2 rounded-xl text-sm font-medium
                         bg-gray-800 hover:bg-gray-700 text-gray-300
                         hover:text-white transition-colors border border-gray-700"
            >
              Edit Budgets
            </button>
          )}
        </div>
      </div>

      {budgets.length === 0 && !editing ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-3">No budgets set yet</p>
          <button
            onClick={handleEditClick}
            className="px-4 py-2 rounded-xl text-sm font-medium
                       bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            Set up budgets
          </button>
        </div>
      ) : editing ? (
        // edit mode — show all categories with inputs
        <div className="space-y-3">
          {CATEGORIES.filter(cat => cat !== "Income" && cat !== "Transfer").map(cat => (
            <div key={cat} className="flex items-center justify-between
                                      py-3 border-b border-gray-800">
              <span className="text-gray-300 text-sm w-48">{cat}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={editValues[cat] || ""}
                  onChange={(e) => setEditValues({
                    ...editValues,
                    [cat]: e.target.value
                  })}
                  className="w-32 px-3 py-2 rounded-xl bg-gray-800 border
                             border-gray-700 text-white text-sm
                             focus:outline-none focus:border-emerald-500
                             transition-colors"
                />
                <span className="text-gray-500 text-sm">/ month</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // display mode — show progress bars
        <div className="space-y-4">
          {budgets
            .filter(b => b.category !== "Income" && b.category !== "Transfer")
            .map(({ category, budget, spent }) => {
              const ratio = Math.min(spent / budget, 1)
              const status = getStatusText(spent, budget)
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">{category}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium ${status.color}`}>
                        {status.text}
                      </span>
                      <span className="text-sm text-gray-400">
                        ${spent.toFixed(2)}
                        <span className="text-gray-600"> / ${budget.toFixed(2)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 
                                  ${getProgressColor(spent, budget)}`}
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}

export default BudgetTracker