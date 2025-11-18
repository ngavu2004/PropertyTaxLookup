export default function ResultsList({ data }) {
    if (!Array.isArray(data) || data.length === 0) {
        return <p>No results found.</p>;
    }

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
