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
    <div className="bg-gray-900 rounded-2xl border border-gray-800 flex flex-col h-96">

      {/* header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <h2 className="text-lg font-semibold text-white">Financial Assistant</h2>
        <span className="text-xs text-gray-500 ml-auto">Powered by Claude AI</span>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm
              ${msg.role === "user"
                ? "bg-emerald-600 text-white rounded-br-sm"
                : "bg-gray-800 text-gray-200 rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-400 px-4 py-2 rounded-2xl rounded-bl-sm text-sm">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* input */}
      <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your spending..."
          className="flex-1 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700
                     text-white text-sm placeholder-gray-500
                     focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
            ${loading || !input.trim()
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default Chatbot