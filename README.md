# Master Downloader

A powerful and elegant video downloader desktop application built with Electron, React, Vite, and Tailwind CSS. It leverages `yt-dlp` to download media from a wide variety of sources.

## Features
- **Video & Audio Downloading**: Fast and reliable downloading powered by `yt-dlp`.
- **Modern UI**: Clean, responsive, and beautiful interface designed with Tailwind CSS and React.
- **Cross-Platform**: Available for Windows (and can be built for macOS and Linux).

## Tech Stack
- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- `ffmpeg` (Optional but recommended for media conversion and merging, depending on yt-dlp usage)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Forkee4ik/master-downloader.git
   cd master-downloader
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Development
Start the application in development mode with Hot Module Replacement (HMR):
```bash
npm run dev
```

### Build
To build the application for production (this will create an installer):
```bash
npm run build
```
The compiled files and installer will be available in the `dist-electron` directory.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
