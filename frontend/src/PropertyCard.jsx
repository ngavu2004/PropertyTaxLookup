import { useState } from 'react';
import './styles/PropertyCard.css';

export default function PropertyCard({ property, viewMode = 'grid' }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Function to determine tax indicator class
  const getTaxIndicatorClass = (taxAmount) => {
    if (!taxAmount) return 'tax-unknown';
    
    const tax = parseFloat(taxAmount.toString().replace(/[^0-9.-]/g, ''));
    
    if (isNaN(tax)) return 'tax-unknown';
    
    if (tax < 10000) return 'tax-low';
    if (tax < 25000) return 'tax-medium';
    return 'tax-high';
  };

  // Extract key fields
  const address = property.Address || property.SitusAddress || 'N/A';
  const city = property.City || property.SitusCity || 'N/A';
  const estimatedTax = property['Estimated Property Tax'] || property.Estimated_Property_Tax || 'N/A';
  const ain = property.AIN || 'N/A';
  const apn = property.APN || 'N/A';
  const zipCode = property['ZIP Code'] || property.SitusZIP || 'N/A';
  
  // Additional fields for expandable section
  const assessedLPV = property['Assessed LPV'] || property.Roll_LandValue || 'N/A';
  const avgTaxRate = property['Average Tax Rate'] || property.Avg_Tax_Rate || 'N/A';

  // Get all other fields for expandable section
  const otherFields = Object.keys(property).filter(key => 
    !['Address', 'SitusAddress', 'City', 'SitusCity', 'Estimated Property Tax', 
      'Estimated_Property_Tax', 'AIN', 'APN', 'ZIP Code', 'SitusZIP', 
      'Assessed LPV', 'Roll_LandValue', 'Average Tax Rate', 'Avg_Tax_Rate'].includes(key)
  );

  const taxIndicatorClass = getTaxIndicatorClass(estimatedTax);

  return (
    <div className={`property-card ${viewMode} ${taxIndicatorClass}`}>
      <div className="card-header">
        <h3 className="card-address">{address}</h3>
        <p className="card-city">{city}</p>
      </div>

      <div className="card-body">
        <div className="card-tax-section">
          <div className="tax-label">Estimated Property Tax</div>
          <div className={`tax-amount ${taxIndicatorClass}`}>
            ${typeof estimatedTax === 'string' && estimatedTax !== 'N/A' 
              ? estimatedTax.replace(/[^0-9.-]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              : estimatedTax}
          </div>
        </div>

        <div className="card-details">
          <div className="detail-item">
            <span className="detail-label">AIN:</span>
            <span className="detail-value">{ain}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">APN:</span>
            <span className="detail-value">{apn}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">ZIP Code:</span>
            <span className="detail-value">{zipCode}</span>
          </div>
        </div>

        {isExpanded && (
          <div className="card-expanded-details">
            <div className="detail-item">
              <span className="detail-label">Assessed LPV:</span>
              <span className="detail-value">{assessedLPV}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Average Tax Rate:</span>
              <span className="detail-value">{avgTaxRate}</span>
            </div>
            {otherFields.length > 0 && (
              <div className="other-fields">
                {otherFields.map(key => (
                  <div key={key} className="detail-item">
                    <span className="detail-label">{key}:</span>
                    <span className="detail-value">{property[key] || 'N/A'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card-footer">
        <button 
          className="expand-button"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show Less' : 'Show More Details'}
        </button>
      </div>
    </div>
  );
}
