# Air Quality Forecasting System (SIH 2025)

A comprehensive full-stack application designed to forecast and visualize air quality parameters (specifically O3 and NO2) using advanced machine learning models and satellite data integration.

## 🚀 Overview

This system provides real-time and forecasted air quality analytics for specific monitoring sites. It combines a modern interactive dashboard with a robust backend powered by XGBoost models.

### Key Features
- **Interactive Dashboard**: Built with Next.js, featuring dynamic charts, heatmaps, and site selection.
- **ML Forecasting**: Custom XGBoost models trained on historical and satellite data to predict O3 and NO2 levels.
- **API First**: FastAPI backend serving predictions and historical data.
- **Containerized**: Fully dockerized for consistent deployment.



## 🎥 Demo
Do Check our demo for best understanding of our work!

https://drive.google.com/drive/folders/14cRGK1E01P8AqV4CJVEGJ45lSxQIex2J

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn UI, Recharts.
- **Backend**: FastAPI (Python), Pandas, XGBoost, Joblib.
- **Infrastructure**: Docker, Docker Compose, Nginx.
- **Data**: Historical AQI data, Sentinel-5P Satellite data, ERA5 Reanalysis data.

## 🏁 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)
- OR [Bun](https://bun.sh/) and Python 3.10+ for local development.

### Running with Docker (Recommended)

The easiest way to run the entire stack is using Docker Compose.

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PS2-SIH25
   ```

2. **Start the services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - **Dashboard**: [http://localhost](http://localhost) (via Nginx)
   - **Backend API Docs**: [http://localhost/api/docs](http://localhost/api/docs)

### Local Development

### Environment Configuration

Before running the application, you must set up environment variables:

1. **Copy the example file**
   ```bash
   cp webdev/.env.example webdev/.env

### Config the .env to start this running

#### Frontend (`webdev/`)
```bash
cd webdev
bun install
bun run dev
# App running at http://localhost:3000
```

#### Backend (`ML/`)
```bash
cd ML
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
# API running at http://localhost:8000
```

## 📂 Project Structure

```
PS2-SIH25/
├── ML/                 # FastAPI Backend & ML Models
│   ├── model/          # Pre-trained .pkl and .json models
│   ├── server.py       # Main API server entry point
│   ├── pipeline.py     # Forecasting pipeline logic
│   └── Data_.../       # Training datasets
├── webdev/             # Next.js Frontend
│   ├── src/            # Source code (Components, Pages)
│   └── public/         # Static assets
├── docker/             # Docker configuration files
├── docker-compose.yml  # Orchestration
└── nginx/              # Reverse proxy config
```
## Deployment
### Azure Deployment

The application is deployed on Azure and accessible at:

- **Live Dashboard**: [http://52.172.175.100:3000/](http://52.172.175.100:3000/)
- **API Documentation**: [http://52.172.175.100:3000/api/docs](http://52.172.175.100:3000/api/docs)
