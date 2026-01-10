# Database Setup

This project uses PostgreSQL with a manually managed schema (no ORM migrations).

## Prerequisites

- PostgreSQL installed and running
- A database created (e.g., `gtc_db`)

## Quick Start with Docker

1.  **Start Database**:
    ```bash
    docker compose up -d db
    ```
    This will start a PostgreSQL container and automatically apply the schema from `database/schema.sql`.

2.  **Verify**:
    The database will be available at `localhost:5432`.
    Username: `gtc_user`
    Password: `gtc_password`
    Database: `gtc_db`

    You can check the logs to ensure the schema was loaded:
    ```bash
    docker compose logs db
    ```

## Manual Setup (without Docker)

1.  **Environment Variables**:
    Ensure your `.env` file has the correct `DATABASE_URL`.
    ```
    DATABASE_URL="postgresql://user:password@localhost:5432/gtc_db"
    ```

2.  **Initialize Schema**:
    Run the `database/schema.sql` script against your database to create the tables.

    **Using command line (psql):**
    ```bash
    psql -U your_username -d your_database_name -f database/schema.sql
    ```
    *Note: You may need to create the `uuid-ossp` extension if it's not enabled. The script attempts to do this.*

3.  **Verify**:
    Check if tables are created.
    ```bash
    psql -U your_username -d your_database_name -c "\dt"
    ```

## Managing Changes

To make changes to the database schema:
1.  Create a new SQL script in `database/migrations/` (create the folder if it doesn't exist).
2.  Write the SQL commands (e.g., `ALTER TABLE ...`).
3.  Run the script against the database.
4.  Update `database/schema.sql` to reflect the current state of the schema for new setups.
