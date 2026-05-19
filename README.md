# Genesys Cloud Architect Claude Code Plugin

## Development

Test the plugin locally:

```shell
CLAUDE_PLUGIN_ROOT=$(pwd) claude --plugin-dir .
```

To aid in the development of the MCP server install the MCP Server Skill:

```
npx skills add https://github.com/anthropics/claude-plugins-official/tree/main/plugins/mcp-server-dev/skills/build-mcp-server
```

Claude Code plugin for developing plugins

https://github.com/anthropics/claude-code/tree/main/plugins/plugin-dev