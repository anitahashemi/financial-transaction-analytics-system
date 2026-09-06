import { useState } from "react"
import axios from "axios"

// AI financial assistant chatbot component
function Chatbot({ startDate, endDate }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your financial assistant. Ask me anything about your spending, income, or budgets."
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = { role: "user", content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await axios.post("http://localhost:5000/chat", {
        message: input,
        session_id: "user_session",
        start_date: startDate || null,
        end_date: endDate || null
      })

      setMessages(prev => [...prev, {
        role: "assistant",
        content: response.data.response
      }])
    } catch (error) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I couldn't process that. Please try again."
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-96">

      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-emerald-400" />
          <span className="text-xs text-gray-500 uppercase tracking-widest">Online</span>
        </div>
        <span className="text-xs text-gray-700 uppercase tracking-widest">
          Powered by Claude
        </span>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <span className="text-xs text-gray-700 uppercase tracking-widest mb-1">
              {msg.role === "user" ? "You" : "Assistant"}
            </span>
            <p className={`text-sm max-w-lg leading-relaxed
              ${msg.role === "user"
                ? "text-emerald-400"
                : "text-gray-300"
              }`}
            >
              {msg.content}
            </p>
          </div>
        ))}
        {loading && (
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-700 uppercase tracking-widest mb-1">
              Assistant
            </span>
            <p className="text-sm text-gray-600">Thinking...</p>
          </div>
        )}
      </div>

      {/* input */}
      <div className="flex items-center gap-4 border-t border-gray-800 pt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your spending..."
          className="flex-1 bg-transparent border-b border-gray-800 pb-2
                     text-sm text-white placeholder-gray-700
                     focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className={`text-xs uppercase tracking-widest transition-colors
            ${loading || !input.trim()
              ? "text-gray-700 cursor-not-allowed"
              : "text-emerald-400 hover:text-emerald-300 cursor-pointer"
            }`}
        >
          Send →
        </button>
      </div>
    </div>
  )
}

export default Chatbot