import './styles/ResultsList.css'; // Assuming you have some styles for the results list

export default function ResultsList({ data }) {
    if (!data.length) return <p>No results found.</p>;

	//Find keys that have at least one row with non-empty value
	const keys = Object.keys(data[0]);
	const nonEmptyKeys = keys.filter((key) =>
		data.some((row) => row[key] && row[key].toString().trim() !== "")
	);
  
    return (
        <table className="results-table">
        <thead>
          <tr>
            {nonEmptyKeys.map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {nonEmptyKeys.map((key) => (
                <td key={key}>{row[key] || ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  
