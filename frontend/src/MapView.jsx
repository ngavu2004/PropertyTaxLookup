import { useState, useEffect, useRef, memo } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './styles/MapView.css';

// Fix for default icon issue in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function CityRegion({ city, onCityClick }) {
  const map = useMap();
  
  // Create bounding box polygon from city bounds
  const getPolygonBounds = () => {
    if (!city.bounds) return null;
    const { minLat, maxLat, minLon, maxLon } = city.bounds;
    return [
      [minLat, minLon],
      [maxLat, minLon],
      [maxLat, maxLon],
      [minLat, maxLon],
      [minLat, minLon]
    ];
  };

  const bounds = getPolygonBounds();
  if (!bounds) return null;

  const handleClick = () => {
    onCityClick(city);
  };

  return (
    <Polygon
      positions={bounds}
      eventHandlers={{
        click: handleClick,
        mouseover: (e) => {
          const layer = e.target;
          layer.setStyle({
            weight: 3,
            color: '#3388ff',
            fillOpacity: 0.3
          });
        },
        mouseout: (e) => {
          const layer = e.target;
          layer.setStyle({
            weight: 2,
            color: '#3388ff',
            fillOpacity: 0.2
          });
        }
      }}
      pathOptions={{
        color: '#3388ff',
        fillColor: '#3388ff',
        fillOpacity: 0.2,
        weight: 2
      }}
    >
      <Popup>
        <div>
          <strong>{city.name}</strong>
          <br />
          {city.count?.toLocaleString() || 0} properties
          <br />
          <button onClick={handleClick} style={{ marginTop: '8px', padding: '4px 8px' }}>
            View Statistics
          </button>
        </div>
      </Popup>
    </Polygon>
  );
}

// Separate component to handle map initialization
// Memoized to prevent unnecessary re-renders
const MapWrapper = memo(function MapWrapper({ cities, onCityClick, center, zoom, containerId }) {
  const mapInstanceRef = useRef(null);
  
  useEffect(() => {
    // Cleanup function to remove map instance
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);
  
  return (
    <MapContainer
      key={containerId}
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
      whenCreated={(mapInstance) => {
        // Store the map instance for cleanup
        mapInstanceRef.current = mapInstance;
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {cities.map((city, index) => (
        <CityRegion
          key={`${city.name}-${index}`}
          city={city}
          onCityClick={onCityClick}
        />
      ))}
    </MapContainer>
  );
});

export default function MapView() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cityStats, setCityStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef(null);
  const containerIdRef = useRef(`map-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // California center coordinates
  const californiaCenter = [36.7783, -119.4179];
  const zoomLevel = 6;

  useEffect(() => {
    fetchCities();
  }, []);
  
  // Clean up any existing Leaflet instances before setting map ready
  useEffect(() => {
    if (!loading && !mapReady && mapContainerRef.current) {
      // Clean up any existing Leaflet map instances in the container
      const container = mapContainerRef.current;
      
      // Find and remove any existing Leaflet containers
      const leafletContainers = container.querySelectorAll('.leaflet-container');
      leafletContainers.forEach(el => {
        if (el._leaflet_id) {
          try {
            // Try to get the map instance and remove it
            const mapInstance = L.DomUtil.get(el, '_leaflet');
            if (mapInstance && typeof mapInstance.remove === 'function') {
              mapInstance.remove();
            }
          } catch (e) {
            // If that fails, just remove the element
            el.remove();
          }
        } else {
          el.remove();
        }
      });
      
      // Small delay to ensure cleanup is complete
      const timer = setTimeout(() => {
        setMapReady(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loading, mapReady]);

  const fetchCities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${apiUrl}/api/cities`);
      setCities(response.data);
    } catch (err) {
      console.error('Cities error:', err);
      setError(err.response?.data?.error || 'Failed to fetch cities');
    } finally {
      setLoading(false);
    }
  };

  const handleCityClick = async (city) => {
    setSelectedCity(city);
    setLoadingStats(true);
    setCityStats(null);

    try {
      const response = await axios.get(`${apiUrl}/api/city-statistics`, {
        params: { city: city.name }
      });
      setCityStats(response.data);
    } catch (err) {
      console.error('City statistics error:', err);
      setError(err.response?.data?.error || 'Failed to fetch city statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  const closeStatsPanel = () => {
    setSelectedCity(null);
    setCityStats(null);
  };

  if (loading) {
    return (
      <div className="map-container">
        <div className="loading-state">
          <p>Loading map...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error && cities.length === 0) {
    return (
      <div className="map-container">
        <div className="error-state">
          <p><strong>Error:</strong> {error}</p>
          <button onClick={fetchCities} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <h2 className="map-title">California Property Tax Map</h2>
      <p className="map-description">
        Click on a city region to view property tax statistics
      </p>
      
      <div className="map-wrapper" ref={mapContainerRef} id={containerIdRef.current}>
        {mapReady && (
          <MapWrapper
            cities={cities}
            onCityClick={handleCityClick}
            center={californiaCenter}
            zoom={zoomLevel}
            containerId={containerIdRef.current}
          />
        )}
      </div>

      {selectedCity && (
        <div className="stats-panel">
          <div className="stats-panel-header">
            <h3>{selectedCity.name} Statistics</h3>
            <button onClick={closeStatsPanel} className="close-button">×</button>
          </div>
          
          {loadingStats ? (
            <div className="loading-state">
              <p>Loading statistics...</p>
              <div className="spinner"></div>
            </div>
          ) : cityStats ? (
            <div className="city-stats-content">
              <div className="stat-item">
                <span className="stat-label">Total Properties:</span>
                <span className="stat-value">{cityStats.totalProperties?.toLocaleString() || 'N/A'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Average Property Tax:</span>
                <span className="stat-value">
                  ${cityStats.averageTax ? parseFloat(cityStats.averageTax).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Highest Property Tax:</span>
                <span className="stat-value">
                  ${cityStats.highestTax ? parseFloat(cityStats.highestTax).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Lowest Property Tax:</span>
                <span className="stat-value">
                  ${cityStats.lowestTax ? parseFloat(cityStats.lowestTax).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">ZIP Codes:</span>
                <span className="stat-value">{cityStats.totalZipCodes?.toLocaleString() || 'N/A'}</span>
              </div>
            </div>
          ) : (
            <div className="error-state">
              <p>No statistics available for this city.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

