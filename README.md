# \# ⚡ AI Dev Studio

# 

# > \*\*AI-powered browser-based development workspace and intelligent coding IDE.\*\*

# 

# \*\*AI Dev Studio\*\* is a full-stack, browser-based development environment designed to bring modern AI-assisted software development directly into the browser.

# 

# Inspired by next-generation coding platforms such as \*\*Cursor, Windsurf, and Replit\*\*, AI Dev Studio combines a complete IDE workspace with an embedded AI coding assistant, virtual terminal, live preview, file management, and Git-based source control.

# 

# Instead of being just an AI chat application, AI Dev Studio provides a \*\*complete development workspace\*\* where developers can manage files, edit code, execute commands, preview applications, and interact with an AI coding agent from a single interface.

# 

# \---

# 

# \# ✨ Features

# 

# \## 🖥️ Full Browser-Based IDE

# 

# AI Dev Studio provides a modern three-panel development workspace directly inside the browser.

# 

# \### 📁 File Explorer

# 

# Manage your project files through an integrated file explorer.

# 

# Features include:

# 

# \* Folder tree navigation

# \* Custom indentation guides

# \* File and folder management

# \* Context menus

# \* Local file uploads

# \* Local folder uploads

# \* Workspace navigation

# \* Directory-aware terminal access

# 

# \---

# 

# \## 📝 AI-Powered Code Editor

# 

# Edit multiple files using a modern code editing experience.

# 

# Supported technologies include:

# 

# \* Python

# \* JavaScript

# \* TypeScript

# \* HTML

# \* CSS

# \* Node.js

# \* JSON

# \* Markdown

# \* Other common development formats

# 

# The editor supports:

# 

# \* Multi-file editing

# \* Tabs

# \* File switching

# \* Save states

# \* Syntax highlighting

# \* Code editing

# \* Workspace-aware editing

# 

# \---

# 

# \# 🤖 AI Coding Agent

# 

# AI Dev Studio includes an integrated AI coding assistant powered by:

# 

# ```text

# llama-3.3-70b-versatile

# ```

# 

# through the \*\*Groq API\*\*.

# 

# The AI assistant is designed to understand the code currently being worked on and provide development-focused assistance.

# 

# \### AI Actions

# 

# The coding agent provides dedicated actions for:

# 

# \* 💡 Explain

# \* 🔧 Fix

# \* ♻️ Refactor

# \* 🧪 Test

# \* 🔀 Review Git

# \* 📚 Document

# 

# Instead of manually describing every development task, developers can select the required AI action and work directly with their code.

# 

# \---

# 

# \# 💻 Virtual Terminal

# 

# AI Dev Studio includes an integrated terminal experience for executing development commands inside the workspace.

# 

# Examples include:

# 

# ```bash

# npm install

# ```

# 

# ```bash

# npm run dev

# ```

# 

# ```bash

# npm test

# ```

# 

# ```bash

# python main.py

# ```

# 

# ```bash

# node server.js

# ```

# 

# ```bash

# run.bat

# ```

# 

# The terminal is designed to make common development workflows accessible without leaving the browser.

# 

# \---

# 

# \# 📂 Context-Aware Terminal

# 

# The terminal automatically understands the selected workspace directory.

# 

# For example, right-clicking a folder in the File Explorer can open the terminal directly inside that directory.

# 

# This allows developers to work with commands such as:

# 

# ```bash

# cd project-folder

# ```

# 

# without manually navigating through directories.

# 

# \---

# 

# \# 🌐 Live Preview

# 

# AI Dev Studio provides an integrated preview environment for applications and web projects.

# 

# Developers can preview:

# 

# \* HTML applications

# \* Frontend projects

# \* Development servers

# \* Local web applications

# \* Running project interfaces

# 

# This creates a workflow where developers can:

# 

# ```text

# Write Code

# &#x20;    ↓

# Run Application

# &#x20;    ↓

# Preview

# &#x20;    ↓

# Test

# &#x20;    ↓

# Fix with AI

# &#x20;    ↓

# Repeat

# ```

# 

# \---

# 

# \# 🔀 Source Control

# 

# AI Dev Studio includes a source-control workspace designed around Git development.

# 

# The Source Control panel can provide:

# 

# \* Git changes

# \* File diffs

# \* Commit history

# \* Modified files

# \* Code change inspection

# \* Git review assistance

# 

# The integrated AI agent can also assist with Git-related code review tasks.

# 

# \---

# 

# \# 🧠 AI-Assisted Development Workflow

# 

# AI Dev Studio is designed around a continuous development workflow.

# 

# ```text

# ┌─────────────────────┐

# │   File Explorer     │

# └──────────┬──────────┘

# &#x20;          ↓

# ┌─────────────────────┐

# │    Code Editor      │

# └──────────┬──────────┘

# &#x20;          ↓

# ┌─────────────────────┐

# │    AI Coding Agent  │

# └──────────┬──────────┘

# &#x20;          ↓

# ┌─────────────────────┐

# │ Virtual Terminal    │

# └──────────┬──────────┘

# &#x20;          ↓

# ┌─────────────────────┐

# │    Live Preview     │

# └──────────┬──────────┘

# &#x20;          ↓

# ┌─────────────────────┐

# │   Source Control    │

# └─────────────────────┘

# ```

# 

# The goal is to reduce the need to switch between multiple development applications.

# 

# \---

# 

# \# 🏗️ Architecture

# 

# AI Dev Studio follows a modern web application architecture.

# 

# ```text

# &#x20;                   ┌─────────────────────┐

# &#x20;                   │      Browser        │

# &#x20;                   │    AI Dev Studio    │

# &#x20;                   └──────────┬──────────┘

# &#x20;                              │

# &#x20;             ┌────────────────┼────────────────┐

# &#x20;             ↓                ↓                ↓

# &#x20;     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐

# &#x20;     │ File System  │ │ Code Editor  │ │ AI Assistant │

# &#x20;     └──────────────┘ └──────────────┘ └──────┬───────┘

# &#x20;                                               │

# &#x20;                                               ↓

# &#x20;                                      ┌────────────────┐

# &#x20;                                      │   Groq API     │

# &#x20;                                      │ Llama 3.3 70B  │

# &#x20;                                      └────────────────┘

# 

# &#x20;             ┌────────────────┼────────────────┐

# &#x20;             ↓                ↓                ↓

# &#x20;      ┌────────────┐   ┌────────────┐   ┌────────────┐

# &#x20;      │  Terminal  │   │  Preview   │   │    Git     │

# &#x20;      └────────────┘   └────────────┘   └────────────┘

# ```

# 

# \---

# 

# \# 🛠️ Tech Stack

# 

# | Technology              | Purpose                       |

# | ----------------------- | ----------------------------- |

# | \*\*React\*\*               | Frontend application          |

# | \*\*TypeScript\*\*          | Type-safe development         |

# | \*\*Vite\*\*                | Development and build tooling |

# | \*\*Tailwind CSS\*\*        | UI styling                    |

# | \*\*Groq API\*\*            | AI inference                  |

# | \*\*Llama 3.3 70B\*\*       | AI coding model               |

# | \*\*Node.js\*\*             | Runtime environment           |

# | \*\*npm\*\*                 | Package management            |

# | \*\*Bun\*\*                 | Alternative package manager   |

# | \*\*Git\*\*                 | Source control                |

# | \*\*Monaco-style Editor\*\* | Code editing experience       |

# 

# \---

# 

# \# 📂 Project Structure

# 

# ```text

# AI Dev Studio/

# │

# ├── 📁 src/

# │   ├── 📁 components/

# │   ├── 📁 pages/

# │   ├── 📁 hooks/

# │   ├── 📁 lib/

# │   └── 📄 main.tsx

# │

# ├── 📄 .gitignore

# ├── 📄 .prettierignore

# ├── 📄 .prettierrc

# ├── 📄 LICENSE

# ├── 📄 README.md

# ├── 📄 bunfig.toml

# ├── 📄 components.json

# ├── 📄 eslint.config.js

# ├── 📄 package.json

# ├── 📄 package-lock.json

# ├── 📄 run.bat

# ├── 📄 run.sh

# ├── 📄 tsconfig.json

# └── 📄 vite.config.ts

# ```

# 

# The primary application source code is contained inside the `src/` directory.

# 

# \---

# 

# \# 💻 Requirements

# 

# Before running AI Dev Studio, make sure you have:

# 

# \* Windows 10 / Windows 11, macOS, or Linux

# \* Node.js 20+

# \* npm

# \* Internet connection

# \* Groq API access for AI functionality

# 

# Check your installation:

# 

# ```bash

# node --version

# ```

# 

# ```bash

# npm --version

# ```

# 

# \---

# 

# \# 🚀 Installation

# 

# \## 1. Clone the Repository

# 

# ```bash

# git clone https://github.com/rsamwilson2323-cloud/AI-Dev-Studio.git

# ```

# 

# Move into the project directory:

# 

# ```bash

# cd AI-Dev-Studio

# ```

# 

# \---

# 

# \## 2. Install Dependencies

# 

# Using npm:

# 

# ```bash

# npm install

# ```

# 

# Or using Bun:

# 

# ```bash

# bun install

# ```

# 

# \---

# 

# \# ▶️ Running the Application

# 

# \## Windows — Recommended

# 

# AI Dev Studio includes a Windows launcher:

# 

# ```text

# run.bat

# ```

# 

# Double-click:

# 

# ```text

# run.bat

# ```

# 

# The launcher will:

# 

# 1\. Check whether Node.js is installed

# 2\. Display the Node.js version

# 3\. Check project dependencies

# 4\. Install missing dependencies

# 5\. Start the development server

# 6\. Launch the application in your browser

# 7\. Run the application on port `8080`

# 

# \---

# 

# \## Manual Start

# 

# You can also start the application manually:

# 

# ```bash

# npm run dev -- --port 8080

# ```

# 

# The application will be available at:

# 

# ```text

# http://localhost:8080

# ```

# 

# You can also access:

# 

# ```text

# http://127.0.0.1:8080

# ```

# 

# \---

# 

# \# ⚙️ Groq AI Configuration

# 

# AI Dev Studio uses the \*\*Groq API\*\* to power its AI coding assistant.

# 

# The configured model is:

# 

# ```text

# llama-3.3-70b-versatile

# ```

# 

# The AI assistant can perform tasks such as:

# 

# ```text

# Explain

# Fix

# Refactor

# Test

# Review Git

# Document

# ```

# 

# \## 🔐 API Key Security

# 

# Never commit your personal Groq API key to GitHub.

# 

# Do not place real API credentials directly inside publicly accessible source code.

# 

# If environment variables are used, make sure the environment file is ignored by Git.

# 

# Example:

# 

# ```env

# GROQ\_API\_KEY=your\_groq\_api\_key\_here

# ```

# 

# Replace the placeholder with your own API key.

# 

# \---

# 

# \# 🧭 Application Modules

# 

# \## 🗂️ File Explorer

# 

# The File Explorer provides a structured view of the current workspace.

# 

# Users can:

# 

# \* Browse folders

# \* Open files

# \* Upload files

# \* Upload folders

# \* Navigate project structures

# \* Access folder context menus

# \* Open terminal locations

# 

# \---

# 

# \## 📝 Code Editor

# 

# The editor provides a multi-file coding environment.

# 

# Typical workflow:

# 

# ```text

# Open File

# &#x20;   ↓

# Edit Code

# &#x20;   ↓

# Save

# &#x20;   ↓

# Ask AI

# &#x20;   ↓

# Test

# &#x20;   ↓

# Preview

# ```

# 

# \---

# 

# \## 🤖 AI Assistant

# 

# The AI coding agent can assist developers with common programming tasks.

# 

# \### Explain

# 

# Understand unfamiliar code.

# 

# ```text

# Explain this function.

# ```

# 

# \### Fix

# 

# Identify and correct potential issues.

# 

# ```text

# Fix the errors in this file.

# ```

# 

# \### Refactor

# 

# Improve code structure and maintainability.

# 

# ```text

# Refactor this component.

# ```

# 

# \### Test

# 

# Generate or suggest tests.

# 

# ```text

# Create tests for this function.

# ```

# 

# \### Review Git

# 

# Analyze changes before committing.

# 

# ```text

# Review my current Git changes.

# ```

# 

# \### Document

# 

# Generate useful documentation.

# 

# ```text

# Document this function.

# ```

# 

# \---

# 

# \# 💻 Terminal

# 

# The integrated terminal supports common development commands.

# 

# Examples:

# 

# ```bash

# npm install

# ```

# 

# ```bash

# npm run dev

# ```

# 

# ```bash

# npm run build

# ```

# 

# ```bash

# npm test

# ```

# 

# ```bash

# python app.py

# ```

# 

# ```bash

# node server.js

# ```

# 

# Windows batch scripts can also be executed:

# 

# ```text

# run.bat

# ```

# 

# \---

# 

# \# 🌐 Local Network Access

# 

# The development server can be exposed to devices connected to the same local network.

# 

# Run:

# 

# ```bash

# npm run dev -- --host 0.0.0.0 --port 8080

# ```

# 

# Then access the application using your computer's local IP address:

# 

# ```text

# http://YOUR\_LOCAL\_IP:8080

# ```

# 

# Example:

# 

# ```text

# http://192.168.1.10:8080

# ```

# 

# Make sure Windows Firewall or your operating system firewall allows port `8080` if another device cannot connect.

# 

# \---

# 

# \# 🧪 Development

# 

# Start the development server:

# 

# ```bash

# npm run dev

# ```

# 

# Start on port `8080`:

# 

# ```bash

# npm run dev -- --port 8080

# ```

# 

# Build the application:

# 

# ```bash

# npm run build

# ```

# 

# Preview the production build:

# 

# ```bash

# npm run preview

# ```

# 

# Run linting:

# 

# ```bash

# npm run lint

# ```

# 

# \---

# 

# \# 📦 Production Build

# 

# Create a production build:

# 

# ```bash

# npm run build

# ```

# 

# Then preview the generated application:

# 

# ```bash

# npm run preview

# ```

# 

# Before deployment, verify:

# 

# \* AI configuration

# \* Environment variables

# \* API security

# \* Build output

# \* Browser compatibility

# 

# \---

# 

# \# 🐛 Troubleshooting

# 

# \## `node` is not recognized

# 

# Install Node.js 20 or newer and restart your terminal.

# 

# Verify:

# 

# ```bash

# node --version

# ```

# 

# \---

# 

# \## `npm` is not recognized

# 

# Reinstall Node.js and make sure npm is included in the installation.

# 

# Verify:

# 

# ```bash

# npm --version

# ```

# 

# \---

# 

# \## Dependencies are missing

# 

# Run:

# 

# ```bash

# npm install

# ```

# 

# Then:

# 

# ```bash

# npm run dev -- --port 8080

# ```

# 

# \---

# 

# \## Port 8080 is already in use

# 

# Start the application on another port:

# 

# ```bash

# npm run dev -- --port 8081

# ```

# 

# Then open:

# 

# ```text

# http://localhost:8081

# ```

# 

# \---

# 

# \## AI assistant is not responding

# 

# Check:

# 

# \* Groq API configuration

# \* API key validity

# \* Internet connection

# \* Selected AI model

# \* API usage limits

# \* Application configuration

# 

# Never expose your API key in publicly accessible frontend code.

# 

# \---

# 

# \# 🔐 Security

# 

# AI Dev Studio is intended primarily as a local development environment.

# 

# Because the application provides development-oriented functionality, users should take care when exposing it to a network.

# 

# \### Recommended Security Practices

# 

# \* Never commit API keys.

# \* Never commit `.env` files.

# \* Do not expose the development server publicly without proper security controls.

# \* Avoid executing untrusted commands.

# \* Review AI-generated code before execution.

# \* Review Git changes before committing.

# \* Keep dependencies updated.

# \* Avoid uploading sensitive source code to external AI services without understanding the applicable privacy policies.

# 

# \---

# 

# \# 🎯 Use Cases

# 

# AI Dev Studio can be useful for:

# 

# \### 👨‍💻 Software Developers

# 

# \* Full-stack development

# \* Rapid prototyping

# \* Debugging

# \* Refactoring

# \* Code review

# \* Documentation

# 

# \### 🎓 Students

# 

# \* Learning programming

# \* Building academic projects

# \* Understanding code

# \* Experimenting with AI-assisted development

# \* Testing applications

# 

# \### 🚀 Startup \& Product Teams

# 

# \* Rapid MVP development

# \* Feature prototyping

# \* Internal tools

# \* AI-assisted development workflows

# 

# \### 🔬 Researchers

# 

# \* Experiment development

# \* Data-processing scripts

# \* Research prototypes

# \* Technical experimentation

# 

# \---

# 

# \# 🌟 Why AI Dev Studio?

# 

# Traditional development often requires switching between multiple tools:

# 

# ```text

# File Explorer

# &#x20;     ↓

# Code Editor

# &#x20;     ↓

# Terminal

# &#x20;     ↓

# Browser

# &#x20;     ↓

# Git

# &#x20;     ↓

# AI Assistant

# ```

# 

# AI Dev Studio attempts to bring these workflows together:

# 

# ```text

# &#x20;             AI DEV STUDIO

# 

# &#x20;       ┌───────────────────────┐

# &#x20;       │     File Explorer     │

# &#x20;       ├───────────┬───────────┤

# &#x20;       │           │           │

# &#x20;       │   Code    │    AI     │

# &#x20;       │  Editor   │  Agent    │

# &#x20;       │           │           │

# &#x20;       ├───────────┴───────────┤

# &#x20;       │ Terminal │ Preview │ Git

# &#x20;       └───────────────────────┘

# ```

# 

# The result is a unified environment for \*\*writing, understanding, testing, previewing, and managing code\*\*.

# 

# \---

# 

# \# 🔮 Future Improvements

# 

# Potential future improvements include:

# 

# \* 🧠 Advanced agentic coding workflows

# \* 🔍 Project-wide semantic code search

# \* 📚 Retrieval-augmented code intelligence

# \* 🗃️ Persistent workspace storage

# \* 🌐 Remote development environments

# \* 👥 Real-time collaborative coding

# \* 🔐 Secure sandboxed command execution

# \* 🐳 Docker-based development environments

# \* 🌎 Cloud deployment

# \* ☁️ GitHub integration

# \* 🔀 Automated pull request assistance

# \* 🧪 Automated test generation

# \* 🛠️ AI-powered debugging

# \* 📊 Project analytics

# \* 🧩 Extension/plugin system

# \* 🎙️ Voice-controlled coding

# \* 📱 Progressive Web App support

# \* ⚡ Streaming AI responses

# \* 🖥️ Multi-workspace support

# 

# \---

# 

# \# 📜 License

# 

# This project is licensed under the \*\*MIT License\*\*.

# 

# See the `LICENSE` file for more information.

# 

# \---

# 

# \# 👨‍💻 Author

# 

# \*\*Sam Wilson\*\*

# 

# B.E. Computer Science Engineering

# Artificial Intelligence \& Machine Learning

# 

# \---

# 

# \# 🔗 Repository

# 

# \*\*AI Dev Studio\*\*

# 

# ```text

# https://github.com/rsamwilson2323-cloud/AI-Dev-Studio

# ```

# 

# \---

# 

# \# ⭐ Support the Project

# 

# If you find \*\*AI Dev Studio\*\* useful:

# 

# \* ⭐ Star the repository

# \* 🍴 Fork the project

# \* 🐛 Report bugs

# \* 💡 Suggest new features

# \* 🔧 Submit improvements

# \* 📢 Share the project

# 

# \---
