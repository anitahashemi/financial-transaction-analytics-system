# Financial Transaction Analytics System

A full-stack personal finance web application that transforms raw BMO bank transaction data into meaningful financial insights and visualizations.

## Overview 

User upload BMO CSV exports and the system automatically processes transactions through a multi-stage pipeline — cleaning, deduplicating, AI-categorizing, and storing them persistently in PostgreSQL. An interactive React dashboard surfaces spending patterns, category breakdowns, and monthly trends.

## Features

- **Automated data ingestion** -> parses and cleans raw BMO CSV exports
- **SHA-256 fingerprint deduplication** -> prevents duplicate transactions across uploads
- **AI categorization** -> integrates Claude API to automatically categorize transactions into spending categories using prompt engineering with Canadian banking context
- **PostgreSQL persistence** -> accumulates months of transaction history across sessions
- **REST API** -> Flask backend with endpoints for upload, transactions, and analytics
- **Interactive dashboard** -> spending breakdown, monthly trend chart, and summary cards
- **Date range filtering** -> filter all visualizations by 30, 60, 90 days, last year, or all time
- **Dynamic granularity** -> trend chart automatically switches between daily and monthly view


## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Flask, SQLAlchemy |
| Database | PostgreSQL |
| AI Categorization | Anthropic Claude API (claude-haiku-4-5-20251001) |
| Data Processing | pandas, hashlib |
| Frontend | React, Vite, Recharts |
| Styling | Tailwind CSS |


## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /health | API health check |
| POST | /upload | Upload BMO CSV and trigger pipeline |
| GET | /transactions | Fetch transactions with optional date filter |
| GET | /analytics/summary | Income, spending, savings, by category |
| GET | /analytics/trends | Monthly or daily spending trends |


## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Backend setup
```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:
DB_HOST=localhost
DB_PORT=PORT
DB_NAME=financial_analytics
DB_USER=postgres
DB_PASSWORD=your_password
ANTHROPIC_API_KEY=your_key

Run Flask:
```bash
python app.py
```

### Frontend setup
```bash
cd frontend
npm install
npm run dev
```

## Data Pipeline
BMO CSV upload
↓
Parse and clean (pandas)
↓
SHA-256 fingerprint deduplication
↓
Insert into PostgreSQL
↓
Claude API categorization
↓
React dashboard visualization

## Notebooks

Exploratory notebooks in `/notebooks` document the development process:
- CSV parsing and cleaning exploration
- Database setup and testing
- Categorization prompt engineering and accuracy testing

## Future Improvements

- Docker containerization for portable deployment
- AI-powered chatbot for natural language financial queries
- Rent and Savings & Investments category support
- Support for additional Canadian banks
