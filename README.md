# Claude Unleashed

A wrapper for the Claude CLI that runs in **Unleashed mode** (bypassing all safety checks) or **Safe mode** (standard Claude CLI behavior). Includes auto-updates, CI/container support, and mode persistence.

> **This project is a maintained fork of [claude-yolo](https://github.com/eastlondoner/claude-yolo) by [@eastlondoner](https://github.com/eastlondoner).** Full credit for the original idea and implementation goes to them. This fork diverged to add features, fix issues, and keep dependencies current.

## Security Warning

**Unleashed mode bypasses important safety checks.** This completely bypasses the "human in the loop" checks — it could delete your data, leak your secrets, and even brick your computer. Use at your own risk.

## Why Would You Need This?

Because Anthropic's Claude CLI has opinions about where it should run — and your infrastructure doesn't care about its feelings.

Here's the thing: `claude --dangerously-skip-permissions` sounds like it should let you do anything. The name literally has "dangerously" in it. You'd think that's as far as the guardrails go. But try running it as root in a container and you'll get a polite refusal. Claude CLI checks `process.getuid()`, sees you're root, and says *"nah, I don't think so"* — even with the dangerous flag. Even inside a Docker container. Even when you really, truly mean it.

This is a real problem if you're running Claude in environments where **root is not optional**:

- **Cloudflare Containers** — They run as root. Period. No `USER 1000` trick, no `gosu`, no workaround. This is exactly why [claudeflare](https://github.com/nikolanovoselec/claudeflare) (Claude Code in your browser via Cloudflare Containers) needs this wrapper — without it, Claude simply refuses to start.
- **CI/CD pipelines** — Many CI runners (GitHub Actions, GitLab CI, Jenkins agents) execute as root inside their containers. Adding `--dangerously-skip-permissions` gets you past the permission prompts, but the root check is a separate wall.
- **Minimal Docker images** — Some base images don't have `useradd`. You're root or you're nothing.
- **Development containers** — VS Code devcontainers, Codespaces, Gitpod — some of these run as root by default, and reconfiguring them just to appease a CLI tool is... not how you want to spend your afternoon.

The Claude CLI's root check exists for good reason on bare-metal machines. But in an ephemeral container that gets destroyed after every run? The root check is protecting a filesystem that won't exist in 30 seconds. Claude Unleashed understands the difference.

**TL;DR:** If Claude CLI is refusing to run in your container and you've already accepted the risks, this is the tool that makes it stop arguing with you.

## Installation

```bash
# Install from this repo
npm install -g github:nikolanovoselec/claude-unleashed

# Or clone and link locally
git clone https://github.com/nikolanovoselec/claude-unleashed.git
cd claude-unleashed && npm link
```

The first time you run `claude-unleashed`, you'll see a consent prompt explaining the security implications. You must explicitly agree to continue.

## Usage

### Command-line flags

```bash
# Run in Unleashed mode (default)
claude-unleashed

# Run in Safe mode (normal Claude CLI behavior)
claude-unleashed --safe
claude-unleashed --no-yolo

# Switch modes persistently
claude-unleashed mode yolo
claude-unleashed mode safe

# Check current mode
claude-unleashed mode
```

### The `cl` wrapper script

For quick mode switching:

```bash
cl /YON      # Switch to Unleashed mode and start Claude
cl /YOFF     # Switch to Safe mode and start Claude
cl /STATUS   # Show current mode
cl /HELP     # Show help

cl "write a hello world function"       # Run in current mode
```

Mode preference is saved in `~/.claude_yolo_state` and persists between sessions.

## Features

- **Dual mode** — Unleashed (bypass all checks) or Safe (standard Claude CLI)
- **Auto-update** — Checks for the latest `@anthropic-ai/claude-code` on every run
- **Root support** — Works even as root user (YOLO mode bypasses the root check)
- **Non-destructive** — Creates a modified copy of the CLI; your `claude` command is untouched
- **Mode persistence** — Your choice is saved between sessions
- **CI/Container support** — Silent and non-interactive modes for automation

## Environment Variables for CI / Container Use

When running in non-interactive environments (Docker, CI, automated scripts):

| Variable | CLI flag | Effect |
|----------|----------|--------|
| `CLAUDE_YOLO_SILENT=1` | `--silent` | Suppress all startup banners and npm update output |
| `CLAUDE_YOLO_SKIP_CONSENT=1` | `--no-consent` | Skip interactive consent prompt and auto-accept |
| `DEBUG=1` | — | Show debug output |

All flags and environment variables can be freely combined:

```bash
# Fully non-interactive, no output noise
claude-unleashed --silent --no-consent

# Same with env vars (better for Dockerfiles and CI)
CLAUDE_YOLO_SILENT=1 CLAUDE_YOLO_SKIP_CONSENT=1 claude-unleashed

# Mix and match
CLAUDE_YOLO_SILENT=1 claude-unleashed --no-consent
```

### Dockerfile example

```dockerfile
ENV CLAUDE_YOLO_SILENT=1
ENV CLAUDE_YOLO_SKIP_CONSENT=1
RUN npm install -g github:nikolanovoselec/claude-unleashed
```

## How It Works

In Unleashed mode, the wrapper:
1. Checks for and installs updates to the Claude package
2. Creates a modified copy of the Claude CLI code:
   - Replaces `getIsDocker()` calls with `true`
   - Replaces `hasInternetAccess()` calls with `false`
   - Bypasses root user checks (`process.getuid() === 0`)
   - Auto-accepts plan mode confirmations
   - Adds themed loading messages
3. Adds `--dangerously-skip-permissions` to the command line
4. Imports the modified copy (original CLI is untouched)

In Safe mode, it runs the original Claude CLI without modifications.

## Debugging

```bash
DEBUG=1 claude-unleashed
```

## Acknowledgments

This project is based on [claude-yolo](https://github.com/eastlondoner/claude-yolo) by [@eastlondoner](https://github.com/eastlondoner), which itself builds on the original work by [@maxparez](https://github.com/maxparez). Thank you for the idea and the foundation.

## License

[MIT](LICENSE)

## Disclaimer

This is an unofficial tool and is not supported by Anthropic. Anthropic designed the safety checks for good reason. Only use Unleashed mode if you fully understand and accept the risks. Use Safe mode when you want standard protections.
