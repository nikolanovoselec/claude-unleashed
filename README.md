# Claude Unleashed

A wrapper for the Claude CLI that runs in **Unleashed mode** (bypassing all safety checks) or **Safe mode** (standard Claude CLI behavior). Includes auto-updates, CI/container support, and mode persistence.

> **This project is a maintained fork of [claude-yolo](https://github.com/eastlondoner/claude-yolo) by [@eastlondoner](https://github.com/eastlondoner).** Full credit for the original idea and implementation goes to them. This fork diverged to add features, fix issues, and keep dependencies current.

## Security Warning

**Unleashed mode bypasses important safety checks.** This completely bypasses the "human in the loop" checks -- it could delete your data, leak your secrets, and even brick your computer. Use at your own risk.

## Why Would You Need This?

Because Anthropic's Claude CLI has opinions about where it should run -- and your infrastructure doesn't care about its feelings.

Here's the thing: `claude --dangerously-skip-permissions` sounds like it should let you do anything. The name literally has "dangerously" in it. You'd think that's as far as the guardrails go. But try running it as root in a container and you'll get a polite refusal. Claude CLI checks `process.getuid()`, sees you're root, and says *"nah, I don't think so"* -- even with the dangerous flag. Even inside a Docker container. Even when you really, truly mean it.

This is a real problem if you're running Claude in environments where **root is not optional**:

- **Cloudflare Containers** -- They run as root. Period. No `USER 1000` trick, no `gosu`, no workaround. This is exactly why [Codeflare](https://github.com/nikolanovoselec/codeflare) -- an ephemeral cloud IDE that runs AI coding agents in your browser on Cloudflare infrastructure -- needs this wrapper. Without it, Claude refuses to run with `--dangerously-skip-permissions` as root.
- **CI/CD pipelines** -- Many CI runners (GitHub Actions, GitLab CI, Jenkins agents) execute as root inside their containers. Adding `--dangerously-skip-permissions` gets you past the permission prompts, but the root check is a separate wall.
- **Minimal Docker images** -- Some base images don't have `useradd`. You're root or you're nothing.
- **Development containers** -- VS Code devcontainers, Codespaces, Gitpod -- some of these run as root by default, and reconfiguring them just to appease a CLI tool is... not how you want to spend your afternoon.

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

This installs two binaries: `claude-unleashed` and `cu` (short alias).

The first time you run it, you'll see a consent prompt explaining the security implications. You must explicitly agree to continue. Consent is stored at `~/.claude_unleashed_consent` and persists across npm reinstalls.

## Usage

### Binaries

| Binary | Description |
|--------|-------------|
| `claude-unleashed` | Primary command |
| `cu` | Short alias with mode switching |

### Command-line flags

```bash
# Run in Unleashed mode (default) -- any of these work:
claude-unleashed
cu

# Run in Safe mode (normal Claude CLI behavior)
claude-unleashed --safe
claude-unleashed --no-yolo

# Switch modes persistently
claude-unleashed mode yolo
claude-unleashed mode safe

# Check current mode
claude-unleashed mode

# Disable auto-updates (useful for locked-down environments)
claude-unleashed --no-update

# Pin to a specific upstream version
claude-unleashed --pin-version=2.1.25

# Suppress upstream CLI installation checks (set automatically by default)
claude-unleashed --disable-installation-checks

# Suppress all startup output
claude-unleashed --silent
```

### The `cu` wrapper script

For quick mode switching:

```bash
cu /YON      # Switch to Unleashed mode and start Claude
cu /YOFF     # Switch to Safe mode and start Claude
cu /STATUS   # Show current mode
cu /HELP     # Show help

cu "write a hello world function"       # Run in current mode
```

Mode preference is saved in `~/.claude_yolo_state` and persists between sessions.

## Features

- **Dual mode** -- Unleashed (bypass all checks) or Safe (standard Claude CLI)
- **Auto-update** -- Checks for the latest `@anthropic-ai/claude-code` on every run; skips `npm install` when the installed version already matches (disable with `--no-update`)
- **Root support** -- Works even as root user (source-level patching bypasses the root check)
- **Non-destructive** -- Creates a modified copy of the CLI; your `claude` command is untouched
- **Mode persistence** -- Your choice is saved between sessions
- **CI/Container support** -- Silent and non-interactive modes for automation
- **Declarative patch system** -- Each modification is a self-contained patch with validation
- **Version pinning** -- Ships with `@anthropic-ai/claude-code` stable (2.1.25), auto-updates to latest on first run

## Environment Variables for CI / Container Use

When running in non-interactive environments (Docker, CI, automated scripts):

| Variable | CLI flag | Effect |
|----------|----------|--------|
| `CLAUDE_UNLEASHED_SILENT=1` | `--silent` | Suppress all startup banners and npm update output |
| `CLAUDE_UNLEASHED_SKIP_CONSENT=1` | `--no-consent` | Skip interactive consent prompt and auto-accept |
| `CLAUDE_UNLEASHED_NO_UPDATE=1` | `--no-update` | Disable auto-update checks entirely |
| `CLAUDE_UNLEASHED_CHANNEL` | `--stable` | Update channel: `latest` (default) or `stable` |
| `CLAUDE_UNLEASHED_VERSION` | `--pin-version=X.Y.Z` | Pin to a specific upstream CLI version |
| `DISABLE_INSTALLATION_CHECKS=1` | `--disable-installation-checks` | Suppress upstream CLI deprecation warning and internal auto-updater (always set internally) |
| `DEBUG=1` | -- | Show debug output including full patch report |

> **Legacy env vars:** `CLAUDE_YOLO_SILENT` and `CLAUDE_YOLO_SKIP_CONSENT` still work for backwards compatibility.

All flags and environment variables can be freely combined:

```bash
# Fully non-interactive, no output noise
claude-unleashed --silent --no-consent

# Same with env vars (better for Dockerfiles and CI)
CLAUDE_UNLEASHED_SILENT=1 CLAUDE_UNLEASHED_SKIP_CONSENT=1 claude-unleashed

# Locked-down: silent, no consent prompt, no update checks
CLAUDE_UNLEASHED_SILENT=1 CLAUDE_UNLEASHED_SKIP_CONSENT=1 CLAUDE_UNLEASHED_NO_UPDATE=1 claude-unleashed

# Pin to a known-good version
CLAUDE_UNLEASHED_VERSION=2.1.25 claude-unleashed --silent --no-consent
```

### Dockerfile example

```dockerfile
ENV CLAUDE_UNLEASHED_SILENT=1
ENV CLAUDE_UNLEASHED_SKIP_CONSENT=1
ENV CLAUDE_UNLEASHED_NO_UPDATE=1
RUN npm install -g github:nikolanovoselec/claude-unleashed
```

### Consent bypass note

`CLAUDE_UNLEASHED_SKIP_CONSENT=1` is designed for CI/container environments where interactive prompts are impossible. It auto-accepts the consent on your behalf. Only use this when you have already reviewed and accepted the security implications.

## Configuration

### Update channels

By default, `claude-unleashed` tracks the `latest` npm dist-tag of `@anthropic-ai/claude-code`. To pin to the `stable` channel (tested releases), use any of these methods (in priority order):

```bash
# 1. CLI flag (one-time)
claude-unleashed --stable

# 2. Environment variable
export CLAUDE_UNLEASHED_CHANNEL=stable

# 3. Config file (persistent)
echo "channel=stable" > ~/.claude_unleashed_config
```

When no option is set, the default is `latest`.

### Version pinning

The upstream CLI ships with the stable version (currently `2.1.25`). On first run, the auto-updater will upgrade to the latest version automatically. To prevent this and stay on a specific version:

```bash
# Pin to a specific version
export CLAUDE_UNLEASHED_VERSION=2.1.25
# or
claude-unleashed --pin-version=2.1.25
```

## How It Works

### Architecture

```
bin/claude-unleashed.js     Thin orchestrator (~95 lines)
bin/cu                      Bash wrapper with mode switching
lib/
  argv.js                   Centralized argument parsing
  cli-resolver.js           Finds Claude CLI installation
  colors.js                 ANSI color constants
  consent.js                Interactive consent prompt
  constants.js              Shared configuration values
  debug.js                  Conditional debug logging
  errors.js                 FatalError / RecoverableError classes
  mode.js                   Mode persistence (YOLO/SAFE)
  patcher.js                Patch orchestrator with hash caching
  updater.js                Auto-update with atomic writes
  patches/
    patch-base.js           Patch base class (canApply/apply/verify)
    index.js                Ordered patch registry
    is-docker.patch.js      [required] getIsDocker() -> true
    internet-access.patch.js [required] hasInternetAccess() -> false
    root-check.patch.js     [required] getuid/geteuid === 0 -> false
    punycode.patch.js       [optional] Fix Node.js punycode deprecation
    plan-autoaccept.patch.js [optional] Auto-accept plan mode
    loading-messages.patch.js [optional] Unleashed-themed loading messages
```

### Patch system

In Unleashed mode, the wrapper applies a series of source-level patches to the Claude CLI:

1. Reads the original CLI source file
2. Applies each patch from the registry in order
3. Each patch has a `canApply` pre-flight check and a `verify` post-check
4. Required patches (is-docker, internet-access, root-check) must succeed or the tool aborts with a clear error
5. Optional patches (punycode, plan-autoaccept, loading-messages) gracefully skip if the target pattern is missing
6. The patched file is written atomically (write to .tmp, rename) and cached by source hash
7. On subsequent runs, if the upstream source hasn't changed, patching is skipped entirely

The `is-docker` and `internet-access` patches support both old call-site patterns (e.g., `x.getIsDocker()`) and new property-assignment patterns (e.g., `getIsDocker:jG9`) to handle upstream minification changes across Claude CLI versions.

In Safe mode, it runs the original Claude CLI without modifications.

### DISABLE_INSTALLATION_CHECKS

This environment variable is **always** set to `'1'` automatically by the orchestrator before importing the upstream CLI. This suppresses the upstream CLI's own deprecation warnings. Additionally, `DISABLE_AUTOUPDATER=1` is set to disable the CLI's internal background auto-updater (which checks for native builds and causes "Auto-update failed" errors in containerized environments). Together, these prevent the upstream CLI from interfering with claude-unleashed's own update system.

## Debugging

```bash
DEBUG=1 claude-unleashed
```

This shows the full patch report with status for each patch (OK / SKIP / FAIL).

## Acknowledgments

This project is based on [claude-yolo](https://github.com/eastlondoner/claude-yolo) by [@eastlondoner](https://github.com/eastlondoner), which itself builds on the original work by [@maxparez](https://github.com/maxparez). Thank you for the idea and the foundation.

## License

[MIT](LICENSE)

## Disclaimer

This is an unofficial tool and is not supported by Anthropic. Anthropic designed the safety checks for good reason. Only use Unleashed mode if you fully understand and accept the risks. Use Safe mode when you want standard protections.
