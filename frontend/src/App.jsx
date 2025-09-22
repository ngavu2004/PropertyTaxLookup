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
    const apiUrl = import.meta.env.PROD 
      ? `/api/search?${params}` 
      : `http://localhost:5000/api/search?${params}`;
    
    console.log("API URL:", apiUrl);
    const response = await axios.get(apiUrl);
    setResults(response.data);
    console.log("Search results:", response.data);
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
