# Property Tax Lookup

A web application to search and lookup property tax information from a database of 24,000+ properties.

## Features

- 🔍 Search properties by AIN, PID, Address, ZIP Code, City, County
- 💰 View estimated property tax information
- ⚡ Fast search with real-time results
- 📱 Responsive design
- 🗄️ MongoDB database integration
- 📊 CSV data import/update functionality

## Project Structure

```
PropertyTaxLookup/
├── backend/                 # Backend API server
│   ├── config/             # Database configuration
│   │   └── database.js     # MongoDB connection setup
│   ├── models/             # Database models
│   │   └── Property.js     # Property schema/model
│   ├── scripts/            # Database management scripts
│   │   ├── import-csv.js   # Import CSV data to MongoDB
│   │   └── update-database.js # Update existing data
│   ├── data/               # CSV data files
│   │   └── properties.csv  # Property data (24,394 records)
│   ├── index.js            # Main server file
│   └── package.json        # Backend dependencies
├── frontend/               # React frontend application
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   │   ├── SearchBar.jsx
│   │   │   └── ResultsList.jsx
│   │   ├── styles/         # CSS files
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── public/             # Static assets
│   ├── dist/               # Built files
│   └── package.json        # Frontend dependencies
├── scripts/                # Utility scripts
├── start.sh               # Unix/Linux start script
├── Makefile               # Windows start script
└── package.json           # Root package.json with scripts
```

## Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **JavaScript (ES6+)** - Programming language

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling
- **CSV Parser** - CSV data processing

### Database
- **MongoDB** - NoSQL database
- **24,394 property records** - Los Angeles County property data
- **CSV import/update system** - Data management

## Local Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Git** (for cloning the repository)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd PropertyTaxLookup
```

### 2. Install Dependencies
```bash
# Install all dependencies (root, backend, frontend)
npm run install:all

# Or install individually:
cd backend && npm install
cd ../frontend && npm install
```

### 3. Database Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Create `.env` file in `backend/` directory:
```env
MONGODB_URI=mongodb://localhost:27017/propertytax
PORT=5000
```

#### Option B: MongoDB Atlas (Cloud)
1. Create a MongoDB Atlas account
2. Create a cluster
3. Get your connection string
4. Create `.env` file in `backend/` directory:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/propertytax
PORT=5000
```

### 4. Import Data
```bash
# Import CSV data to MongoDB
npm run import-csv

# Or update existing data
npm run update-db
```

### 5. Start the Application

#### Quick Start (Recommended)
```bash
npm start
```

#### Manual Start
```bash
# Terminal 1 - Backend
cd backend && node index.js

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

#### Platform-Specific Scripts
```bash
# Unix/Linux/Mac
./start.sh

# Windows
start.bat
```

### 6. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Search**: http://localhost:5000/api/search

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start both backend and frontend |
| `npm run start:backend` | Start only backend server |
| `npm run start:frontend` | Start only frontend dev server |
| `npm run import-csv` | Import CSV data to MongoDB |
| `npm run update-db` | Update database with CSV data |
| `npm run build` | Build frontend for production |
| `npm run install:all` | Install all dependencies |

## API Documentation

### Search Endpoint
```
GET /api/search
```

#### Query Parameters
| Parameter | Description | Example |
|-----------|-------------|---------|
| `AIN` | Assessor's Identification Number | `4412013017` |
| `APN` | Assessor's Parcel Number | `4412-013-017` |
| `Address` | Property address | `677 VIA DE LA PAZ` |
| `SitusAddress` | Full situs address | `677 VIA DE LA PAZ` |
| `SitusFullAddress` | Complete address | `677 VIA DE LA PAZ LOS ANGELES CA 90272` |
| `ZIP Code` | ZIP code | `90272` |
| `SitusZIP` | Situs ZIP code | `90272-4365` |
| `City` | City name | `LOS ANGELES` |
| `SitusCity` | Situs city | `LOS ANGELES CA` |
| `County` | County name | `Los Angeles` |
| `LCITY` | Local city | `Los Angeles` |
| `Estimated Property Tax` | Tax amount | `17090.28` |
| `UseType` | Property use type | `Residential` |
| `UseDescription` | Use description | `Single` |
| `YearBuilt` | Year built | `2007` |
| `SQFT` | Square footage | `3708` |
| `Bedrooms` | Number of bedrooms | `5` |
| `Bathrooms` | Number of bathrooms | `5` |

#### Example Requests
```bash
# Search by city
GET /api/search?city=LOS ANGELES

# Search by address
GET /api/search?address=677 VIA DE LA PAZ

# Search by multiple criteria
GET /api/search?city=LOS ANGELES&county=Los Angeles&yearBuilt=2007

# Get all properties (limit 10)
GET /api/search
```

#### Response Format
```json
[
  {
    "Estimated Property Tax": "17090.28",
    "AIN": "4412013017",
    "APN": "4412-013-017",
    "SitusAddress": "677 VIA DE LA PAZ",
    "SitusCity": "LOS ANGELES CA",
    "SitusZIP": "90272-4365",
    "UseType": "Residential",
    "UseDescription": "Single",
    "YearBuilt1": "2007",
    "SQFTmain1": "3708",
    "Bedrooms1": "5",
    "Bathrooms1": "5"
  }
]
```

## How to use (Website)
- Go to https://property-tax-lookup.vercel.app/
- The website should have a UI like below
![Property Tax Lookup UI](./assets/readme1.png)
- If you want to search anything, hit `Search`
- If you want to get all information, clear all fields and hit `Search`
![Property Tax Lookup UI 2](./assets/readme2.png)

## Database Management

### Import New Data
```bash
# Place new CSV files in backend/data/
# Run import script
npm run import-csv
```

### Update Existing Data
```bash
# Update existing records and add new ones
npm run update-db
```

### Database Schema
The Property model includes fields for:
- Property identification (AIN, APN)
- Address information (SitusAddress, SitusCity, etc.)
- Property details (UseType, YearBuilt, SQFT, etc.)
- Tax information (Estimated_Property_Tax, Roll values)
- Geographic data (coordinates, maps)
- Legal descriptions and more

## Deployment

### Vercel (Current)
```bash
vercel --prod
```

### Other Platforms
- **Backend**: Deploy to Heroku, Railway, or similar
- **Frontend**: Deploy to Vercel, Netlify, or similar
- **Database**: Use MongoDB Atlas for production

## Troubleshooting

### Common Issues
1. **MongoDB connection failed**: Check if MongoDB is running and connection string is correct
2. **Port already in use**: Kill processes using ports 5000 or 5173
3. **CSV import failed**: Check file path and MongoDB connection
4. **Dependencies not found**: Run `npm run install:all`

### Getting Help
- Check the console for error messages
- Verify all prerequisites are installed
- Ensure MongoDB is running
- Check `.env` file configuration

---
*Built with ❤️ for property tax research*
