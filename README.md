# RPG Game Client

Open-source game client for a fantasy MMORPG built with Electron and Phaser 3.

## Features

- Cross-platform desktop client (Windows, macOS, Linux)
- Real-time multiplayer gameplay
- Tile-based 2D game world
- Auto-update functionality
- Multiple world support

## Tech Stack

- **Electron**: Cross-platform desktop application framework
- **Phaser 3**: HTML5 game engine for rendering and game logic
- **Socket.io**: Real-time WebSocket communication
- **HTML5**: UI overlays for menus, inventory, and chat

## Project Structure

```
/client
├── src/
│   ├── game/             # Phaser 3 game logic
│   │   ├── scenes/       # Game scenes (boot, login, world, etc.)
│   │   ├── entities/     # Player, NPC, Item sprite classes
│   │   └── systems/      # Rendering, animation, input handling
│   ├── network/          # Socket.io client and message handlers
│   ├── ui/               # HTML5 overlay components
│   ├── updater/          # Auto-update functionality
│   └── main.js           # Electron entry point
├── assets/
│   ├── sprites/          # Game sprites and spritesheets
│   ├── sounds/           # Sound effects and music
│   └── maps/             # Map data and tilesets
└── tests/                # Unit and integration tests
```

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- **Game server running** (from the server repository with Docker)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env if your server's Redis is not on localhost:6379

# 3. Start the game server (in a separate terminal)
# Go to the server repository and run:
# docker-compose up

# 4. Start the client
npm run dev
```

The client will connect to the server's Redis instance to discover available worlds.

### Configuration

The client uses a `.env` file for configuration:

```env
# Redis URL - Connects to the server's Redis for world discovery
# This should point to the same Redis instance that the game servers use
# When running server via Docker, this is typically localhost:6379
REDIS_URL=redis://localhost:6379

# Environment
NODE_ENV=development
```

**Important:** The client is just an application that connects to server infrastructure. It does not run its own services. You must have the game server (and its Redis) running for the client to discover and connect to worlds.

### Building

```bash
# Build for current platform
npm run build

# Build for all platforms
npm run package:all
```

## Scripts

- `npm start` - Start the client
- `npm run dev` - Start in development mode
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run lint:fix` - Lint and fix code
- `npm run format` - Format code with Prettier
- `npm run build` - Build application
- `npm run package` - Package for distribution

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the ESLint configuration
- Use Prettier for formatting
- Write tests for new features
- Maintain test coverage above 80%

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Phaser 3](https://phaser.io/)
- Powered by [Electron](https://www.electronjs.org/)
- Real-time communication via [Socket.io](https://socket.io/)
