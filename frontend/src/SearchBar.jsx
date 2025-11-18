import { useState } from "react";
import "./styles/SearchBar.css";

// Example static options — you can expand these
const states = ["AZ", "CA"];
const countiesByState = {
  AZ: ["Maricopa", "Pima", "Pinal"],
  CA: ["Los Angeles"],
};


export default function SearchBar({ onSearch }) {

  // Shared dropdown state
  const [selectedState, setSelectedState] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("");

  // Section 1: APN/AIN
  const [apnAin, setApnAin] = useState({ APN: "", AIN: "" });

  // Section 2: Address
  const [address, setAddress] = useState({
    streetNumber: "",
    streetDirection: "",
    streetName: "",
    streetSuffix: ""
  });

  // Section 3: Owner
  const [owner, setOwner] = useState({ owner: "" });

  // Generic handler
  const update = (setter) => (e) => {
    const { name, value } = e.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  // Validate state + county before searching
  const checkRegionSelected = () => {
    if (!selectedState) {
      alert("Please select a State.");
      return false;
    }
    if (!selectedCounty) {
      alert("Please select a County.");
      return false;
    }
    return true;
  };

  // Submit handlers
  const submitApnAin = (e) => {
    e.preventDefault();
    if (!checkRegionSelected()) return;

    onSearch(
      { APN: apnAin.APN.trim(), AIN: apnAin.AIN.trim() }, // criteria
      { state: selectedState, county: selectedCounty }     // routing info
    );

  };

  const submitAddress = (e) => {
    e.preventDefault();

    const fullAddress = [
      address.streetNumber,
      address.streetDirection,
      address.streetName,
      address.streetSuffix
    ]
      .filter(Boolean)          // removes empty strings
      .join(" ");               // joins with spaces

    onSearch(
      { Address: fullAddress },
      { state: selectedState, county: selectedCounty }     // routing info
    );
  };

  const submitOwner = (e) => {
    e.preventDefault();
    if (!checkRegionSelected()) return;

    onSearch(
      { Owner: owner.owner.trim() },
      { state: selectedState, county: selectedCounty }     // routing info
    );
  };

  return (
    <div className="search-sections">

      {/* ======================
          STATE + COUNTY DROPDOWNS
      ====================== */}
      <div className="region-select">
        <h3>Select Region</h3>

        <select
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value);
            setSelectedCounty(""); // reset county
          }}
        >
          <option value="">Select State</option>
          {states.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        <select
          value={selectedCounty}
          onChange={(e) => setSelectedCounty(e.target.value)}
          disabled={!selectedState}
        >
          <option value="">Select County</option>
          {selectedState &&
            countiesByState[selectedState].map((county) => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
        </select>
      </div>

      {/* ======================
          SECTION 1 — APN / AIN
      ====================== */}
      <form onSubmit={submitApnAin} className="search-section">
        <h3>Search by APN / AIN</h3>

        <input
          type="text"
          name="APN"
          placeholder="APN"
          value={apnAin.APN}
          onChange={update(setApnAin)}
        />

        <input
          type="text"
          name="AIN"
          placeholder="AIN"
          value={apnAin.AIN}
          onChange={update(setApnAin)}
        />

        <button type="submit">Search APN / AIN</button>
      </form>

      {/* ======================
          SECTION 2 — ADDRESS
      ====================== */}
      <form onSubmit={submitAddress} className="search-section">
        <h3>Search by Address</h3>

        <input
          type="text"
          name="streetNumber"
          placeholder="Street Number"
          value={address.streetNumber}
          onChange={update(setAddress)}
        />

        <input
          type="text"
          name="streetDirection"
          placeholder="Street Direction"
          value={address.streetDirection}
          onChange={update(setAddress)}
        />

        <input
          type="text"
          name="streetName"
          placeholder="Street Name (required)"
          value={address.streetName}
          onChange={update(setAddress)}
        />

        <input
          type="text"
          name="streetSuffix"
          placeholder="Street Suffix"
          value={address.streetSuffix}
          onChange={update(setAddress)}
        />

        <button type="submit">Search Address</button>
      </form>

      {/* ======================
          SECTION 3 — OWNER
      ====================== */}
      <form onSubmit={submitOwner} className="search-section">
        <h3>Search by Owner</h3>

        <input
          type="text"
          name="owner"
          placeholder="Owner Name"
          value={owner.owner}
          onChange={update(setOwner)}
        />

        <button type="submit">Search Owner</button>
      </form>
    </div>
  );
}

