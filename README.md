 Country Currency & Exchange API

A simple **Node.js + Express + Sequelize + MySQL** REST API that fetches country data and exchange rates, stores them in a database, and generates a summary image.

Features
 `POST /countries/refresh` — Fetches country data, exchange rates, updates the database, and creates `cache/summary.png`.  
`GET /countries` — Lists all cached countries with optional filters and sorting (`?region=`, `?currency=`, `?sort=gdp_desc`).  
 `GET /countries/:name` — Retrieves a specific country by name.  
`DELETE /countries/:name` — Deletes a country record.  
 `GET /status` — Shows total countries and last refresh time.  
`GET /countries/image` — Serves the summary image.

 Setup

1. Clone the repo
git clone https://github.com/yourusername/country-currency-api.git
cd country-currency-api

2. Configure environment
3. Install dependencies
4.  Run the Server

Tech Stack
Node.js · Express.js · Sequelize · MySQL · Node-Canvas



