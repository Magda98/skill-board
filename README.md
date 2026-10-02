# Skill Board

Skill Board is a Claude Code plugin mod that makes skill use visible in the current session.

## What it shows

- A compact, colored skills strip above the prompt.
- A `/skill-board` pane with the skills Claude Code expanded, most recent first, and a count for repeated activations.
- A clear-history control in the pane (`c` while the pane is focused).

The tracker listens for Claude Code's `skill.prompt` event. It stores skill names and activation counts in session state; it never stores skill instructions. The list describes skills expanded during this session, not a guarantee that every skill's full text remains in the context after compaction.

Session state resets when the session ends or when `/clear`, `/resume`, or `/branch` starts a new session state. The tracker needs Claude Code v2.1.287 or newer, where plugin mods are supported.

## Try it

From this directory's parent, start Claude Code with the plugin:

```sh
claude --plugin-dir ./skill-board
```

Run `/skill-board` to open the dashboard. Once Claude loads or preloads a skill, it appears in the strip and the pane.

## Install for later sessions

The `--plugin-dir` option loads the mod for that session. For persistent installs, distribute it through a Claude Code marketplace. The plugin requires mods to be enabled by your Claude Code installation and organization settings.
