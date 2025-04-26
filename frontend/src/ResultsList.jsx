import './styles/ResultsList.css'; // Assuming you have some styles for the results list

export default function ResultsList({ data }) {
    if (!data.length) return <p>No results found.</p>;
  
    return (
        <table className="results-table">
        <thead>
          <tr>
            {Object.keys(data[0]).map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {Object.values(row).map((val, i) => (
                <td key={i}>{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  