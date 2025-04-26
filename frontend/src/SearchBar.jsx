import { useState } from 'react';
import './styles/SearchBar.css'; // Assuming you have some styles for the search bar

const fields = ["AIN", "PID", "Address", "ZIP Code", "City", "County"];

export default function SearchBar({ onSearch }) {
  const [inputs, setInputs] = useState({});

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
    console.log("Current inputs:", { ...inputs, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(inputs);
  };

  return (
    <form onSubmit={handleSubmit}>
        <div className="search-field-container">
            {fields.map(field => (
                <label key={field} className="search-label">
                {field}
                <input
                    type="text"
                    name={field}
                    placeholder={field}
                    onChange={handleChange}
                    className="search-field"
                />
                </label>
            ))}
        </div>
      <button type="submit" className="search-button">
        Search
      </button>
    </form>
  );
}
