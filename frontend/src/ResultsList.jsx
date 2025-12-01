import { useState } from 'react';
import PropertyCard from './PropertyCard';
import './styles/ResultsList.css';

export default function ResultsList({ data }) {
    const [viewMode, setViewMode] = useState('grid');

    if (!Array.isArray(data) || data.length === 0) {
        return <p className="no-results">No results found.</p>;
    }

    return (
        <div className="results-container">
            <div className="results-header">
                <div className="results-count">
                    Showing {data.length} result{data.length !== 1 ? 's' : ''}
                </div>
                <div className="view-toggle">
                    <button
                        className={`toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid View"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 2h6v6H2V2zm0 10h6v6H2v-6zm10-10h6v6h-6V2zm0 10h6v6h-6v-6z"/>
                        </svg>
                    </button>
                    <button
                        className={`toggle-button ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="List View"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 4h16v2H2V4zm0 4h16v2H2V8zm0 4h16v2H2v-2zm0 4h16v2H2v-2z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div className={`results-grid ${viewMode}`}>
                {data.map((property, idx) => (
                    <PropertyCard key={idx} property={property} viewMode={viewMode} />
                ))}
            </div>
        </div>
    );
}
