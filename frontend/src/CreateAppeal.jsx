import { useState } from 'react';
import axios from 'axios';
import './styles/CreateAppeal.css';

export default function CreateAppeal() {
  const [locationType, setLocationType] = useState('zip');
  const [locationValue, setLocationValue] = useState('');
  const [userTax, setUserTax] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const params = new URLSearchParams({
        locationType,
        locationValue: locationValue.trim(),
        userTax: userTax.trim()
      });

      const response = await axios.get(`${apiUrl}/api/appeal-comparison?${params}`);
      setResults(response.data);
    } catch (err) {
      console.error('Appeal comparison error:', err);
      setError(err.response?.data?.error || 'Failed to fetch appeal comparison data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-appeal-container">
      <h2>Create Appeal</h2>
      <p className="appeal-description">
        Compare your property tax against the local average to determine if you have grounds for an appeal.
      </p>

      <form onSubmit={handleSubmit} className="appeal-form">
        <div className="form-group">
          <label htmlFor="locationType">Location Type:</label>
          <select
            id="locationType"
            value={locationType}
            onChange={(e) => setLocationType(e.target.value)}
            className="form-select"
          >
            <option value="zip">ZIP Code</option>
            <option value="city">City</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="locationValue">
            {locationType === 'zip' ? 'ZIP Code:' : 'City Name:'}
          </label>
          <input
            type="text"
            id="locationValue"
            value={locationValue}
            onChange={(e) => setLocationValue(e.target.value)}
            placeholder={locationType === 'zip' ? 'e.g., 90272 or 90272-4365' : 'e.g., LOS ANGELES'}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="userTax">Your Property Tax Amount ($):</label>
          <input
            type="number"
            id="userTax"
            value={userTax}
            onChange={(e) => setUserTax(e.target.value)}
            placeholder="e.g., 20000"
            className="form-input"
            step="0.01"
            min="0"
            required
          />
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Comparing...' : 'Compare Tax'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {results && (
        <div className="appeal-results">
          <h3>Comparison Results</h3>
          <div className="results-grid">
            <div className="result-card">
              <div className="result-label">Your Tax</div>
              <div className="result-value">${results.userTax}</div>
            </div>
            <div className="result-card">
              <div className="result-label">Local Average</div>
              <div className="result-value">${results.averageTax}</div>
            </div>
            <div className="result-card">
              <div className="result-label">Difference</div>
              <div className={`result-value ${parseFloat(results.difference) > 0 ? 'positive' : parseFloat(results.difference) < 0 ? 'negative' : ''}`}>
                {parseFloat(results.difference) < 0 
                  ? `-$${Math.abs(parseFloat(results.difference))}` 
                  : `$${results.difference}`}
              </div>
            </div>
            <div className="result-card">
              <div className="result-label">Properties Compared</div>
              <div className="result-value">{results.recordsCompared}</div>
            </div>
          </div>
          <div className="comparison-message">
            <p>{results.message}</p>
          </div>
          {parseFloat(results.difference) > 0 && (
            <div className="appeal-recommendation">
              <strong>Recommendation:</strong> You may have grounds for a property tax appeal. 
              Consider consulting with a tax professional or filing an appeal with your local assessor's office.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
