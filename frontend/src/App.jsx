import { useState } from 'react';
import axios from 'axios';
import './styles/App.css';
import SearchBar from './SearchBar';
import ResultsList from './ResultsList';

function App() {
  const [results, setResults] = useState([]);

  const handleSearch = async (criteria) => {
    console.log("Search criteria:", criteria);
    const params = new URLSearchParams(criteria).toString();
    
    // Use Vite environment variables
    const apiUrl = import.meta.env.VITE_API_URL;
    const response = await axios.get(`${apiUrl}/api/search?${params}`);
    setResults(response.data);
  };

  return (
    <div className="search-container">
      <h1 className="search-heading">Property Tax Search</h1>
      <div className="search-bar-container">
        <SearchBar onSearch={handleSearch} />
      </div>
      <ResultsList data={results} />
    </div>
  );
}

export default App;
