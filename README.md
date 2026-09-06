# Financial Transaction Analytics System

A web application that takes in bank transaction CSV files and provides detailed analytics on spending and income.

I realized I'd lost track of my spending and transactions. Going into online banking and looking through my transaction history wasn't giving me enough context on where my money was actually going. I wanted a system designed specifically for the bank I use and adjusted to my own spending habits and categories. That's where I started building this.

## Tech Stack

**Backend:** Python, Flask, SQLAlchemy, pandas  
**Database:** PostgreSQL  
**Frontend:** React, JavaScript, CSS, Recharts  
**AI:** Claude API  

## Main Features

**Data Ingestion:** Cleans and processes raw BMO CSV files containing transaction data.

**SHA-256 Fingerprint Deduplication:** Generates a fingerprint for each transaction to prevent duplicate entries when an uploaded CSV contains transactions that are already in the database.

**AI Categorization:** Uses the Claude API to categorize transactions into spending categories using a prompt designed around Canadian banking data and my transaction patterns.

**Data Storage:** Stores processed transactions and their assigned categories in PostgreSQL using SQLAlchemy.

**REST API:** Flask endpoints handle CSV uploads, transactions, analytics, budgets, and chatbot requests.

**Interactive Dashboard:** Breaks down spending and income using horizontal category charts, spending trends, and financial summaries.

**Date Range Filtering:** Filters analytics by the last 30, 60, 90 days, one year, or all time. Spending trends automatically switch between daily and monthly aggregation depending on the selected time range.

**Budget Tracking:** Stores category-based budgets in a separate `budgets` table. When the dashboard loads, Flask joins budget and transaction data to compare each category's spending against its budget and classify it as within budget, near its limit, or over budget.

**Financial Assistant:** Uses Claude with context retrieved from the database, including overall spending, category breakdowns, monthly spending, top transactions, and conversation history. This allows the assistant to answer questions using the user's actual financial data.

## Running the Project

### Backend

```bash
python backend/app.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Notebooks
Exploratory notebooks in `/Notebooks` document the development process. Data exploration, CSV cleaning, database setup and testing, and the transaction categorization prompt were developed and tested there before being moved into the main application.
