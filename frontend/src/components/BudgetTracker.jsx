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
  if (ratio >= 1) return "bg-[#B97872]"
  if (ratio >= 0.8) return "bg-[#D8D0B8]"
  return "bg-[#527D5D]"
}

function getStatusText(spent, budget) {
  const ratio = spent / budget
  if (ratio >= 1) return { text: "Over budget", color: "text-[#B97872]" }
  if (ratio >= 0.8) return { text: "Near limit", color: "text-[#D8D0B8]" }
  return { text: "On track", color: "text-[#527D5D]" }
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

      // ensuring numbers and dates are floats and not strings
      const data = response.data.map(b => ({
      ...b,
      budget: parseFloat(b.budget),
      spent: parseFloat(b.spent)
      }))

      setBudgets(data)

      // initialize edit values from current budgets
      const values = {}
      data.forEach(b => {
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
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {message && (
            <span className="text-xs text-emerald-400 uppercase tracking-widest">{message}</span>
          )}
        </div>
        <div className="flex items-center gap-6">
          {editing ? (
            <div className="flex gap-4">
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-xs text-emerald-400 hover:text-emerald-300 uppercase tracking-widest transition-colors"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleEditClick}
              className="text-xs text-gray-500 hover:text-white uppercase tracking-widest transition-colors"
            >
              Edit Budgets
            </button>
          )}
        </div>
      </div>

      {budgets.length === 0 && !editing ? (
        <div className="py-8">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-4">No budgets set yet</p>
          <button
            onClick={handleEditClick}
            className="text-xs text-emerald-400 hover:text-emerald-300 uppercase tracking-widest transition-colors"
          >
            Set up budgets →
          </button>
        </div>
      ) : editing ? (
        <div className="space-y-4">
          {CATEGORIES.filter(cat => cat !== "Income" && cat !== "Transfer").map(cat => (
            <div key={cat} className="flex items-center justify-between border-b border-gray-900 pb-4">
              <span className="text-xs text-gray-500 uppercase tracking-widest w-48">{cat}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600">$</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={editValues[cat] || ""}
                  onChange={(e) => setEditValues({
                    ...editValues,
                    [cat]: e.target.value
                  })}
                  className="w-32 px-3 py-1.5 bg-gray-900 border border-gray-800
                             text-white text-xs focus:outline-none
                             focus:border-emerald-500 transition-colors"
                />
                <span className="text-xs text-gray-600">/ month</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {budgets
            .filter(b => b.category !== "Income" && b.category !== "Transfer")
            .map(({ category, budget, spent }) => {
              const ratio = Math.min(spent / budget, 1)
              const status = getStatusText(spent, budget)
              return (
                <div key={category} className="flex items-center gap-4">
                  <span className="text-xs text-gray-500 uppercase tracking-wider w-36 text-right shrink-0">
                    {category}
                  </span>
                  <div className="flex-1 h-1.5 bg-gray-800">
                    <div
                      className={`h-full transition-all duration-500 ${getProgressColor(spent, budget)}`}
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs w-20 text-right shrink-0 ${status.color}`}>
                    {status.text}
                  </span>
                  <span className="text-xs text-gray-400 w-28 text-right shrink-0">
                    ${spent.toFixed(2)}
                    <span className="text-gray-700"> / ${budget.toFixed(2)}</span>
                  </span>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}

export default BudgetTracker