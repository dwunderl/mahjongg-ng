# Mahjongg Tools

A modern web application for Mahjong hand analysis and training. This tool helps players understand and practice different Mahjong hands and scoring patterns.

## Features

- 🃏 Interactive tile display and manipulation
- 🧠 Hand analysis and pattern recognition
- 🎯 Training mode for practicing specific hands
- 📱 Responsive design for desktop and mobile

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm (v8 or later)

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:dwunderl/mahjongg-ng.git
   cd mahjongg-ng
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

## Project Structure

```
mahjongg-ng/
├── src/
│   ├── core/           # Core game logic
│   │   ├── deck.js     # Deck and tile management
│   │   └── analyzer/   # Hand analysis logic
│   ├── ui/             # React components
│   └── assets/         # Images and other static assets
├── public/             # Static files
└── vite.config.js      # Vite configuration
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
