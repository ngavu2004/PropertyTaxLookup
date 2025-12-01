import { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/DatabaseStatistics.css';

export default function DatabaseStatistics() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${apiUrl}/api/statistics`);
      setStatistics(response.data);
    } catch (err) {
      console.error('Statistics error:', err);
      setError(err.response?.data?.error || 'Failed to fetch database statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="statistics-container">
        <h2>Database Statistics</h2>
        <div className="loading-state">
          <p>Loading statistics...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="statistics-container">
        <h2>Database Statistics</h2>
        <div className="error-state">
          <p><strong>Error:</strong> {error}</p>
          <button onClick={fetchStatistics} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="statistics-container">
        <h2>Database Statistics</h2>
        <p>No statistics available.</p>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      <h2>Database Statistics</h2>
      <p className="statistics-description">
        Overview of property data in the database
      </p>

      <div className="statistics-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-label">Total Properties</div>
          <div className="stat-value">{statistics.totalProperties?.toLocaleString() || 'N/A'}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Average Property Tax</div>
          <div className="stat-value">
            ${statistics.averageTax ? parseFloat(statistics.averageTax).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-label">Highest Property Tax</div>
          <div className="stat-value">
            ${statistics.highestTax ? parseFloat(statistics.highestTax).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📉</div>
          <div className="stat-label">Lowest Property Tax</div>
          <div className="stat-value">
            ${statistics.lowestTax ? parseFloat(statistics.lowestTax).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏙️</div>
          <div className="stat-label">Cities</div>
          <div className="stat-value">{statistics.totalCities?.toLocaleString() || 'N/A'}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-label">ZIP Codes</div>
          <div className="stat-value">{statistics.totalZipCodes?.toLocaleString() || 'N/A'}</div>
        </div>
      </div>

      {statistics.topCities && statistics.topCities.length > 0 && (
        <div className="top-cities-section">
          <h3>Top Cities by Property Count</h3>
          <div className="top-cities-list">
            {statistics.topCities.map((city, index) => (
              <div key={index} className="city-item">
                <span className="city-rank">#{index + 1}</span>
                <span className="city-name">{city.name || city._id || 'Unknown'}</span>
                <span className="city-count">{city.count?.toLocaleString() || 0} properties</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="refresh-section">
        <button onClick={fetchStatistics} className="refresh-button">
          Refresh Statistics
        </button>
      </div>
    </div>
  );
}
