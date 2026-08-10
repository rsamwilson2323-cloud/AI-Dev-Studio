# ⚡ AI Dev Studio

> **AI-powered browser-based development workspace and intelligent coding IDE.**

AI Dev Studio is a full-stack, browser-based development environment that brings modern AI-assisted software development directly into the browser.

Inspired by modern AI development platforms such as **Cursor, Windsurf, and Replit**, AI Dev Studio combines a complete IDE workspace with an integrated AI coding assistant, file explorer, code editor, virtual terminal, live preview, and Git-based source control.

The goal is simple: **bring coding, AI assistance, testing, previewing, and source control into one development workspace.**

---

## ✨ Features

### 🖥️ Browser-Based IDE

AI Dev Studio provides a modern multi-panel development workspace directly in the browser.

**File Explorer**

* 📁 Folder tree navigation
* 📄 File management
* 📂 Folder management
* ⬆️ File uploads
* 📤 Folder uploads
* 🖱️ Context menus
* 🧭 Workspace navigation
* 💻 Directory-aware terminal access

---

### 📝 AI-Powered Code Editor

Edit and manage multiple project files from a single development workspace.

Supported technologies include:

* Python
* JavaScript
* TypeScript
* HTML
* CSS
* Node.js
* JSON
* Markdown
* Other common development formats

Editor capabilities include:

* Multi-file editing
* Editor tabs
* File switching
* Syntax highlighting
* Code editing
* Save states
* Workspace-aware editing

---

## 🤖 AI Coding Agent

AI Dev Studio includes an integrated AI coding assistant powered by **Groq** and the configured **Llama 3.3 70B** model.

The AI assistant is designed to understand the code being worked on and provide development-focused assistance.

### AI Actions

| Action        | Purpose                           |
| ------------- | --------------------------------- |
| 💡 Explain    | Understand unfamiliar code        |
| 🔧 Fix        | Identify and fix potential issues |
| ♻️ Refactor   | Improve code structure            |
| 🧪 Test       | Generate or suggest tests         |
| 🔀 Review Git | Analyze Git changes               |
| 📚 Document   | Generate documentation            |

This allows developers to perform common development tasks without leaving the IDE.

---

## 💻 Virtual Terminal

AI Dev Studio provides an integrated terminal experience for running development commands directly from the workspace.

Example commands:

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

```bash
npm run build
```

```bash
python main.py
```

```bash
node server.js
```

Windows batch scripts are also supported:

```text
run.bat
```

---

## 📂 Context-Aware Terminal

The terminal understands the currently selected workspace directory.

For example, developers can open a terminal directly from a selected folder and work within that directory without manually navigating from the project root.

```bash
cd project-folder
```

This creates a more efficient workflow between the file explorer and terminal.

---

## 🌐 Live Preview

AI Dev Studio provides an integrated preview workflow for web applications and development projects.

Developers can preview:

* HTML applications
* Frontend projects
* Local web applications
* Development servers
* Running project interfaces

### Development Workflow

```text
Write Code
    ↓
Run Application
    ↓
Live Preview
    ↓
Test
    ↓
Fix with AI
    ↓
Repeat
```

---

## 🔀 Git & Source Control

AI Dev Studio includes a source-control workspace designed around Git-based development.

The source-control workflow can provide:

* Git changes
* Modified files
* File diffs
* Commit history
* Code change inspection
* Git review assistance

The integrated AI agent can also assist with reviewing Git changes before committing.

---

## 🧠 AI-Assisted Development Workflow

```text
┌─────────────────────┐
│   File Explorer     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│    Code Editor      │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   AI Coding Agent   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Virtual Terminal   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│    Live Preview     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   Source Control    │
└─────────────────────┘
```

AI Dev Studio aims to reduce the need to switch between multiple development applications.

---

# 🏗️ Architecture

```text
                         ┌─────────────────────┐
                         │       Browser       │
                         │     AI Dev Studio   │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ↓                     ↓                     ↓
      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
      │ File System  │      │ Code Editor  │      │ AI Assistant │
      └──────────────┘      └──────────────┘      └──────┬───────┘
                                                         │
                                                         ↓
                                                ┌────────────────┐
                                                │    Groq API    │
                                                │ Llama 3.3 70B  │
                                                └────────────────┘

              ┌─────────────────────┼─────────────────────┐
              ↓                     ↓                     ↓
       ┌────────────┐        ┌────────────┐        ┌────────────┐
       │  Terminal  │        │  Preview   │        │    Git     │
       └────────────┘        └────────────┘        └────────────┘
```

---

# 🛠️ Tech Stack

| Technology              | Purpose                       |
| ----------------------- | ----------------------------- |
| **React**               | Frontend application          |
| **TypeScript**          | Type-safe development         |
| **Vite**                | Development and build tooling |
| **Tailwind CSS**        | UI styling                    |
| **Groq API**            | AI inference                  |
| **Llama 3.3 70B**       | AI coding model               |
| **Node.js**             | Runtime environment           |
| **npm**                 | Package management            |
| **Bun**                 | Alternative package manager   |
| **Git**                 | Source control                |
| **Monaco-style Editor** | Code editing experience       |

---

# 📂 Project Structure

```text
AI-Dev-Studio/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── lib/
│   └── main.tsx
│
├── .gitignore
├── .prettierignore
├── .prettierrc
├── LICENSE
├── README.md
├── bunfig.toml
├── components.json
├── eslint.config.js
├── package.json
├── package-lock.json
├── run.bat
├── run.sh
├── tsconfig.json
└── vite.config.ts
```

The primary application source code is located inside the `src/` directory.

---

# 💻 Requirements

Before running AI Dev Studio, make sure you have:

* Windows 10 / Windows 11, macOS, or Linux
* Node.js 20+
* npm
* Internet connection
* Groq API access for AI functionality

Check your installed versions:

```bash
node --version
```

```bash
npm --version
```

---

# 🚀 Installation

## 1. Clone the Repository

```bash
git clone https://github.com/rsamwilson2323-cloud/AI-Dev-Studio.git
```

Navigate into the project:

```bash
cd AI-Dev-Studio
```

---

## 2. Install Dependencies

Using npm:

```bash
npm install
```

Or using Bun:

```bash
bun install
```

---

# ▶️ Running the Application

## Windows — Recommended

AI Dev Studio includes a Windows launcher:

```text
run.bat
```

Double-click `run.bat` to start the application.

The launcher is designed to:

1. Check whether Node.js is installed
2. Display the Node.js version
3. Check project dependencies
4. Install missing dependencies
5. Start the development server
6. Launch the application
7. Run the application on port `8080`

---

## Manual Start

Start the development server manually:

```bash
npm run dev -- --port 8080
```

Open:

```text
http://localhost:8080
```

or:

```text
http://127.0.0.1:8080
```

---

# ⚙️ Groq AI Configuration

AI Dev Studio uses the **Groq API** to power its AI coding assistant.

Configured model:

```text
llama-3.3-70b-versatile
```

The AI assistant provides actions including:

```text
Explain
Fix
Refactor
Test
Review Git
Document
```

## 🔐 API Key Security

**Never commit your personal Groq API key to GitHub.**

If your project uses environment variables, keep your environment files excluded from Git.

Example:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Replace the placeholder with your own API key.

> ⚠️ Never expose private API credentials in publicly accessible frontend source code.

---

# 🧭 Application Modules

## 🗂️ File Explorer

The File Explorer provides a structured view of the current workspace.

Users can:

* Browse folders
* Open files
* Upload files
* Upload folders
* Navigate project structures
* Use folder context menus
* Open terminals in selected locations

---

## 📝 Code Editor

The editor provides a multi-file coding environment.

Typical workflow:

```text
Open File
    ↓
Edit Code
    ↓
Save
    ↓
Ask AI
    ↓
Test
    ↓
Preview
```

---

## 🤖 AI Assistant

### Explain

Understand unfamiliar code.

```text
Explain this function.
```

### Fix

Identify and correct potential issues.

```text
Fix the errors in this file.
```

### Refactor

Improve code structure and maintainability.

```text
Refactor this component.
```

### Test

Generate or suggest tests.

```text
Create tests for this function.
```

### Review Git

Analyze current Git changes.

```text
Review my current Git changes.
```

### Document

Generate useful technical documentation.

```text
Document this function.
```

---

# 💻 Terminal

The integrated terminal supports common development commands:

```bash
npm install
npm run dev
npm run build
npm test
python app.py
node server.js
```

Windows batch scripts can also be executed:

```text
run.bat
```

---

# 🌐 Local Network Access

The development server can be exposed to devices connected to the same local network.

Run:

```bash
npm run dev -- --host 0.0.0.0 --port 8080
```

Then access the application using your computer's local IP:

```text
http://YOUR_LOCAL_IP:8080
```

Example:

```text
http://192.168.1.10:8080
```

If another device cannot connect, make sure your operating system firewall allows port `8080`.

---

# 🧪 Development

Start the development server:

```bash
npm run dev
```

Start on port `8080`:

```bash
npm run dev -- --port 8080
```

Build the application:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run linting:

```bash
npm run lint
```

---

# 📦 Production Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Before deployment, verify:

* AI configuration
* Environment variables
* API security
* Build output
* Browser compatibility
* Dependency configuration

---

# 🐛 Troubleshooting

## `node` is not recognized

Install Node.js 20 or newer and restart your terminal.

Verify:

```bash
node --version
```

---

## `npm` is not recognized

Reinstall Node.js and ensure npm is included in the installation.

Verify:

```bash
npm --version
```

---

## Dependencies are missing

Run:

```bash
npm install
```

Then:

```bash
npm run dev -- --port 8080
```

---

## Port 8080 is already in use

Start the application on another port:

```bash
npm run dev -- --port 8081
```

Then open:

```text
http://localhost:8081
```

---

## AI Assistant Is Not Responding

Check:

* Groq API configuration
* API key validity
* Internet connection
* Selected AI model
* API usage limits
* Application configuration

Never expose your API key in publicly accessible frontend code.

---

# 🔐 Security

AI Dev Studio is primarily intended as a local development environment.

Because the application provides development-oriented functionality, take appropriate precautions when exposing it to a network.

### Recommended Practices

* 🔑 Never commit API keys
* 🚫 Never commit `.env` files
* 🌐 Do not publicly expose the development server without proper security controls
* ⚠️ Avoid executing untrusted commands
* 🤖 Review AI-generated code before execution
* 🔀 Review Git changes before committing
* 📦 Keep dependencies updated
* 🔒 Avoid sending sensitive source code to external AI services without understanding the applicable privacy policies

---

# 🎯 Use Cases

### 👨‍💻 Software Developers

* Full-stack development
* Rapid prototyping
* Debugging
* Refactoring
* Code review
* Documentation

### 🎓 Students

* Learning programming
* Building academic projects
* Understanding code
* AI-assisted development
* Application testing
* Experimentation

### 🚀 Startup & Product Teams

* MVP development
* Feature prototyping
* Internal tools
* AI-assisted development workflows

### 🔬 Researchers

* Experiment development
* Data-processing scripts
* Research prototypes
* Technical experimentation

---

# 🌟 Why AI Dev Studio?

Traditional development often requires switching between multiple applications:

```text
File Explorer
      ↓
Code Editor
      ↓
Terminal
      ↓
Browser
      ↓
Git
      ↓
AI Assistant
```

AI Dev Studio brings these workflows together:

```text
              AI DEV STUDIO

       ┌─────────────────────────┐
       │      File Explorer      │
       ├────────────┬────────────┤
       │            │            │
       │    Code    │     AI     │
       │   Editor   │    Agent   │
       │            │            │
       ├────────────┴────────────┤
       │ Terminal │ Preview │ Git│
       └─────────────────────────┘
```

The result is a unified environment for:

**Writing → Understanding → Testing → Previewing → Reviewing → Managing Code**

---

# 🔮 Future Improvements

Potential future improvements include:

* 🧠 Advanced agentic coding workflows
* 🔍 Project-wide semantic code search
* 📚 Retrieval-augmented code intelligence
* 🗃️ Persistent workspace storage
* 🌐 Remote development environments
* 👥 Real-time collaborative coding
* 🔐 Secure sandboxed command execution
* 🐳 Docker-based development environments
* ☁️ Cloud deployment
* 🌎 GitHub integration
* 🔀 Automated pull request assistance
* 🧪 Automated test generation
* 🛠️ AI-powered debugging
* 📊 Project analytics
* 🧩 Extension/plugin system
* 🎙️ Voice-controlled coding
* 📱 Progressive Web App support
* ⚡ Streaming AI responses
* 🖥️ Multi-workspace support

---

# 📜 License

This project is licensed under the **MIT License**.

See the [`LICENSE`](LICENSE) file for more information.

---

# 👨‍💻 Author

**Sam Wilson**

B.E. Computer Science Engineering
Artificial Intelligence & Machine Learning

---

# 🔗 Repository

**AI Dev Studio**

```text
https://github.com/rsamwilson2323-cloud/AI-Dev-Studio
```

---

# ⭐ Support the Project

If you find **AI Dev Studio** useful:

* ⭐ Star the repository
* 🍴 Fork the project
* 🐛 Report bugs
* 💡 Suggest new features
* 🔧 Submit improvements
* 📢 Share the project

---

<p align="center">
  Built with ❤️ for AI-assisted software development.
</p>
