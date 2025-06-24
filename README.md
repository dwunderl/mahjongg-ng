# Mahjongg Tools

A modern web application for Mahjong hand analysis and training, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Hand analysis against multiple template patterns
- Interactive hand building and visualization
- Responsive design that works on desktop and mobile
- Modern, accessible UI with dark mode support

## Getting Started

### Prerequisites

- Node.js 18.15.0 or later
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/mahjongg-tools.git
   cd mahjongg-tools
   ```

2. Install dependencies
   ```bash
   cd client
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
mahjongg-ng/
├── client/                  # Next.js application
│   ├── src/
│   │   ├── app/            # App Router
│   │   ├── components/      # Reusable components
│   │   ├── lib/            # Utility functions
│   │   └── styles/         # Global styles
│   ├── public/             # Static files
│   └── package.json
├── .gitignore
└── README.md
```

## Development

- Run the development server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm start`
- Lint code: `npm run lint`
- Run tests: `npm test`

## License

MIT
