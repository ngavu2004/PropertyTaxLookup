import { useState } from 'react';
import axios from 'axios';
import './styles/App.css';
import NavigationBar from './NavigationBar';
import SearchBar from './SearchBar';
import ResultsList from './ResultsList';
import CreateAppeal from './CreateAppeal';
import Scraper from './Scraper';

function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // criteria is what the user entered (APN, Owner, Address)
  // region contains { state, county }
  const handleSearch = async (criteria, region) => {
    setLoading(true);          // start loading
    setResults([]);

    try {
      if (region.state === "AZ") {
        // Decide mode based on which field user filled
        let mode = "";
        let value = "";
        let st_number, st_direction, st_name, st_suffix;

        if (criteria.APN || criteria.AIN) {
          mode = "apn";
          value = criteria.APN || criteria.AIN;
        } else if (criteria.Owner) {
          mode = "owner";
          value = criteria.Owner;
        } else if (criteria.Address) {
          mode = "address";
          // Naive split into components — adjust for your inputs
          const parts = criteria.Address.split(" ");
          st_number = parts[0];
          st_direction = parts[1] || "";
          st_name = parts[2] || "";
          st_suffix = parts[3] || "";
        } else {
          setLoading(false);
          return; // nothing to search
        }

        const response = await axios.post(
          `${apiUrl}/api/az/${region.county.toLowerCase()}`,
          {
            mode,
            value,
            st_number,
            st_direction,
            st_name,
            st_suffix
          }
        );

        setResults(response.data);

      } else {
        // CA database search
        const params = new URLSearchParams(criteria).toString();
        const response = await axios.get(`${apiUrl}/api/search?${params}`);
        setResults(response.data);
      }
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);       // stop loading
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'search':
        return (
          <div className="search-container">
            <h1 className="search-heading">Property Tax Search</h1>
            <div className="search-bar-container">
              <SearchBar onSearch={handleSearch} />
            </div>
            {/* Loading indicator */}
            {loading && (
              <div className="loading">
                <p>Loading results...</p>
                {/* Optional spinner */}
                <div className="spinner"></div>
              </div>
            )}

            {/* Results */}
            {!loading && results.length > 0 && <ResultsList data={results} />}
          </div>
        );
      case 'appeal':
        return <CreateAppeal />;
      case 'scraper':
        return <Scraper />;
      default:
        return (
          <div className="search-container">
            <h1 className="search-heading">Property Tax Search</h1>
            <div className="search-bar-container">
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app">
      <NavigationBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="app-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
