import { useState } from "react"
import axios from "axios"

// Handles BMO CSV file selection and upload to Flask backend
function UploadButton() {
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first")
      return
    }

    // FormData required for multipart file upload
    const formData = new FormData()
    formData.append("file", file) // key must match Flask request.files["file"]

    setLoading(true)
    setMessage("")

    try {
      const response = await axios.post("http://localhost:5000/upload", formData)
      setMessage(`✓ ${response.data.processed} transactions processed successfully`)
      setFile(null)
    } catch (error) {
      setMessage("✗ Upload failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 px-4 py-2 rounded-xl
                        bg-gray-800 border border-gray-700 text-gray-300
                        hover:bg-gray-700 hover:text-white
                        cursor-pointer transition-all duration-200 text-sm">
        <span>📂</span>
        <span>{file ? file.name : "Choose CSV"}</span>
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files[0])
            setMessage("")
          }}
        />
      </label>

      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${loading || !file
                      ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                    }`}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {/* only renders when message exists */}
      {message && (
        <span className={`text-sm ${message.startsWith("✓") ? "text-emerald-400" : "text-rose-400"}`}>
          {message}
        </span>
      )}
    </div>
  )
}

export default UploadButton