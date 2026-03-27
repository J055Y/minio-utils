# Minio Upload Utility

A simple tool to compare local directories with a Minio S3 bucket and upload any missing files. It provides both a CLI
entry point and a real-time web interface.

## Features

- **Efficient Comparison**: Scans local directories and compares them with remote objects in Minio.
- **Smart Upload**: Only uploads files that do not exist in the specified remote path.
- **Large Directory Support**: Robust object listing using manual pagination (max 500 keys per request) to avoid XML
  expansion limit errors when dealing with 1000+ files.
- **Web Interface**: A user-friendly Vue 3 + Vite frontend.
- **Real-time Progress Tracking**: Uses Server-Sent Events (SSE) to report upload progress, showing completed/total
  counts and the name of the file currently being uploaded.
- **Retry Logic**: Automatically retries failed uploads (up to 3 attempts).

## Prerequisites

- **Node.js**: Version 24 or higher is recommended.
- **Minio S3 Storage**: An accessible Minio instance and credentials.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/J055Y/minio-utils.git
   cd minio-utils
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

## Configuration

The application uses environment variables for Minio configuration. Create a file named `minio.env` in the root
directory with the following content:

```env
MINIO_ENDPOINT=your-minio-endpoint (e.g., play.min.io)
MINIO_PORT=443
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
```

**IMPORTANT:** It is highly recommended to add the `minio.env` file to your `.gitignore` file to prevent sensitive
information from being committed to version control.

## Usage

### Web Interface (Recommended)

To run both the backend server and the frontend development server simultaneously:

```bash
npm run web
```

- **Backend**: Runs at `http://localhost:3000`
- **Frontend**: Runs at `http://localhost:5173` (or the port specified by Vite)

Open your browser to the frontend URL, enter the local directory path, remote path, and bucket name, then click **Start
Upload**.

### Command Line Interface (CLI)

You can also run the utility directly via the CLI:

1. Edit `src/index.ts` to set your desired `localPath`, `remotePath`, and `bucket`.
2. Run the development script:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/`: Backend source code.
    - `compare.ts`: Core logic for directory walking and Minio interaction.
    - `server.ts`: Express server with SSE progress reporting.
    - `minio_client_handler.ts`: Minio client initialization and configuration.
    - `logger.ts`: Pino-based logging.
- `frontend/`: Vue 3 + Vite frontend application.
    - `src/App.vue`: Main application container.
    - `src/components/DirectoryUpload.vue`: Component for the upload form and progress bar.
- `minio.env`: Configuration for Minio credentials (not tracked in Git).
- `package.json`: Main project scripts and dependencies.

## License

GNU AGPLv3
