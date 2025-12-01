import './styles/NavigationBar.css';

export default function NavigationBar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'search', label: 'Search' },
    { id: 'appeal', label: 'Create Appeal' },
    { id: 'scraper', label: 'Scraper' }
  ];

  return (
    <nav className="navigation-bar">
      <div className="nav-container">
        <h1 className="nav-logo">Property Tax Lookup</h1>
        <div className="nav-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
