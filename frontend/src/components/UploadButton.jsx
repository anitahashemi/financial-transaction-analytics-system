import { useState } from "react"
import axios from "axios"

// Handles BMO CSV files uploads to flask backend
function UploadButton(){
    const [file, setFile] = useState(null)

    const [message, setMessage] = useState("")

    const handleUpload = async() => {
        if(!file) {
            setMessage("Please select a file first.")
            return
        }

        // FromDara is needed for multipart file uploads
        const fromData = new FromData()
        // key must match the Flask's request.files["file"]
        fromData.append("file", file)

        try {
        const response = await axios.post("http://localhost:5000/upload", formData)
        setMessage(`Success: ${response.data.processed} transactions processed`)
        } catch (error) {
        setMessage("Upload failed. Please try again.")
        }
    }

    return(
        <div>
            <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
            />
            <button onClick={handleUpload}>
            Upload CSV
            </button>
            {/* only renders when message exists */}
            {message && <p>{message}</p>}
        </div>
    )
}

export default UploadButton