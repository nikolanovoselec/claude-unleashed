# Claude YOLO

A wrapper for the Claude CLI that always enables danger mode by bypassing Docker and internet permission checks.

⚠️ **SECURITY WARNING**: This wrapper bypasses important safety checks by forcibly adding the `--dangerously-skip-permissions` flag to all commands. This bypasses file access permissions that protect your system and privacy.

## Installation

```bash
npm install -g claude-yolo
```

During installation, you will be presented with a consent prompt explaining the security implications. You must explicitly agree to continue with the installation.

<img width="750" alt="image" src="https://github.com/user-attachments/assets/f8e07cf0-6c43-4663-b9e2-f61b1afb4e99" />

## Usage

```bash
claude-yolo [options]
```

All arguments and options are passed directly to the Claude CLI.

This wrapper:
1. Checks for and automatically installs updates to the Claude package
2. Displays "🔥 YOLO MODE ACTIVATED 🔥" warning in yellow text
3. Creates a modified copy of the Claude CLI code to bypass permission checks
   - Replaces all `getIsDocker()` calls with `true`
   - Replaces all `hasInternetAccess()` calls with `false`
   - Adds colorful YOLO-themed loading messages
4. Leaves the original Claude CLI file untouched (won't affect your normal `claude` command)
5. Adds the `--dangerously-skip-permissions` flag to command line arguments
6. Imports the modified copy of the CLI

## New in Version 1.6.0

- **Installation Consent Prompt**: Now requires explicit user consent during installation
- **Enhanced Security Warnings**: Clear explanations of the security implications
- **Installation Abort Option**: Users can cancel installation if they don't agree with the security implications

## New in Version 1.5.0

- **YOLO Mode Warning**: Displays a "🔥 YOLO MODE ACTIVATED 🔥" warning in yellow text
- **Colorful Loading Messages**: Adds fun YOLO-themed loading messages with colorful text
  - "Thinking (safety's off, hold on tight)" in red
  - "Computing (all gas, no brakes, lfg)" in yellow
  - "Clauding (yolo mode engaged)" in magenta
  - "Processing (dangerous mode! I guess you can just do things)" in cyan

## Features

- **Auto-update**: Automatically checks for and installs updates to the Claude package at runtime
- **Non-destructive approach**: Creates a separate modified copy of the CLI file instead of modifying the original
- **Safe for global installations**: Your regular `claude` command will work normally even after installing claude-yolo
- **Debug mode**: Set the `DEBUG=1` environment variable to see detailed logs about the modifications

## Why?

Sometimes you just want to YOLO and skip those pesky permission checks. This tool lets you do that without modifying your original Claude CLI installation.

## Debugging

If you encounter any issues, you can run with debug output:

```bash
DEBUG=1 claude-yolo
```

This will show additional information about:
- Claude package update checks
- Current and latest available versions
- When updates are being installed
- Modifications being made to the CLI file

## Auto-Update Feature

Claude YOLO automatically checks for updates to the Claude package each time it runs:

1. When you run `claude-yolo`, it checks for the latest version of `@anthropic-ai/claude-code` on npm
2. If your installed version is outdated, it will:
   - Update your package.json with the latest version
   - Run npm install to get the newest version
   - Notify you that an update was applied
3. This ensures you're always using the latest Claude CLI features

## Important Security Disclaimer

This is an unofficial tool and not supported by Anthropic. Use at your own risk.

**SECURITY WARNING**:
- This tool bypasses safety mechanisms intentionally built into the Claude CLI
- The `--dangerously-skip-permissions` flag was designed for use in container environments
- By using this tool, you acknowledge that:
  - Important safety checks are being bypassed
  - Claude may access files it normally would not have permission to access
  - You accept full responsibility for any security implications
  
Anthropic designed these safety checks for good reason. Only use claude-yolo if you fully understand and accept these risks.
