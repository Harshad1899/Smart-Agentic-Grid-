import React, { useState } from "react";
import axios from "axios";

const TIME_STEPS = 60;
const FEATURES = 4;

// Create empty batch
const createBatch = () =>
  Array.from({ length: TIME_STEPS }, () =>
    [230, 5.1, 1150, 50]
  );

function App() {

  // 5 batches
  const [batches, setBatches] = useState([
    createBatch(),
    createBatch(),
    createBatch(),
    createBatch(),
    createBatch()
  ]);

  const [selectedBatch, setSelectedBatch] = useState(0);
  const [result, setResult] = useState(null);

  // Handle input change
  const handleChange = (row, col, value) => {
    const updated = [...batches];
    updated[selectedBatch][row][col] = parseFloat(value);
    setBatches(updated);
  };

  // Send selected batch
  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8081/predict",
        {
          sequence: batches[selectedBatch]
        }
      );
      setResult(response.data);
    } catch (error) {
      alert("Backend error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* HEADER */}
      <h1 className="text-3xl font-bold text-center mb-6">
        ⚡ Smart Grid Dashboard
      </h1>

      {/* BATCH SELECTOR */}
      <div className="flex justify-center gap-4 mb-6">
        {batches.map((_, i) => (
          <button
            key={i}
            onClick={() => setSelectedBatch(i)}
            className={`px-4 py-2 rounded-lg ${selectedBatch === i
              ? "bg-blue-600 text-white"
              : "bg-white border"
              }`}
          >
            Batch {i + 1}
          </button>
        ))}
      </div>

      {/* DATA TABLE */}
      <div className="bg-white p-4 rounded-xl shadow overflow-auto max-h-[400px]">

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th>Voltage</th>
              <th>Current</th>
              <th>Power</th>
              <th>Frequency</th>
            </tr>
          </thead>

          <tbody>
            {batches[selectedBatch].map((row, i) => (
              <tr key={i}>
                {row.map((value, j) => (
                  <td key={j} className="p-1">
                    <input
                      type="number"
                      value={value}
                      onChange={(e) =>
                        handleChange(i, j, e.target.value)
                      }
                      className="border p-1 w-full rounded"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

      </div>

      {/* BUTTON */}
      <button
        onClick={handleSubmit}
        className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
      >
        Analyze Selected Batch
      </button>

      {/* RESULT */}
      {result && (
        <div className="mt-6 bg-white p-4 rounded-xl shadow text-center">
          <h2 className="text-xl font-bold mb-2">Result</h2>

          <p>
            Status:{" "}
            <span className={`font-bold ${result.status === "anomaly"
              ? "text-red-600"
              : "text-green-600"
              }`}>
              {result.status.toUpperCase()}
            </span>
          </p>

          <p>Error: {result.error.toFixed(5)}</p>
          <p>Threshold: {result.threshold}</p>
        </div>
      )}
    </div>
  );
}

export default App;