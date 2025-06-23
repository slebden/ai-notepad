# Notepad Application

A full-stack notepad application with a FastAPI backend and React frontend.

## Project Structure

- `backend/` - FastAPI backend service
- `frontend/` - React frontend application

## Backend Setup

1. Install Poetry (if not already installed):
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

2. Install dependencies:
```bash
cd backend
poetry install
```

3. Run the backend service:
```bash
poetry run python main.py
```

The backend service will be available at `http://localhost:8000`

## Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Run the development server:
```bash
npm run dev
```

The frontend application will be available at `http://localhost:3000`

## Features

- Create, read, update, and delete notes
- Notes include timestamp, title, summary, and contents
- YAML-based storage with abstraction layer for future storage implementations
- Modern React frontend with Material-UI
- Real-time updates using React Query

## API Documentation

Once the backend service is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc` 