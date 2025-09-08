# KubeLingoAssist

A VS Code extension for Kubernetes documentation translation workflows.

## Installation & Usage

### Installation
1. Download the latest VSIX file from [Releases](https://github.com/eundms/kubelingoassist/releases)
2. Install in VS Code: `code --install-extension kubelingoassist-x.x.x.vsix`

### Key Features
- **Open Translation Files**: `Cmd+Shift+T` (Mac) / `Ctrl+Shift+T` (Windows/Linux)
- **Scroll Synchronization**: `Cmd+Shift+S` (Mac) / `Ctrl+Shift+S` (Windows/Linux)
- **Activity Bar Panel**: Click 🌐 icon for control panel

## Development

### Prerequisites
- Node.js 18+
- VS Code 1.74.0+

### Setup
```bash
npm install
cd ui && npm install && cd ..
npm run compile
```

### Commands
```bash
npm test          # Run tests
npm run package   # Build VSIX package
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Create a pull request

## 📝 License

MIT