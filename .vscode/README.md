# VS Code Configuration for EventCatalog

This directory contains VS Code configuration for the EventCatalog project.

## Real-time YAML Validation

The `settings.json` file configures real-time validation of YAML files with JSON Schemas.

### Prerequisites

Make sure you have the **YAML** extension installed in VS Code:
- Name: YAML
- ID: `redhat.vscode-yaml`
- [Install from marketplace](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)

### How it works

YAML files in `generators/openapi/` and `generators/asyncapi/` are automatically validated against their respective JSON Schemas.

**Real-time validation features:**
- ✅ Invalid properties are underlined in red
- ✅ Errors appear in the "Problems" panel (Ctrl+Shift+M)
- ✅ Auto-completion for available properties (Ctrl+Space)
- ✅ Inline documentation on property hover

### Testing validation

1. Open `generators/openapi/__config__.yaml`
2. Add a line with an invalid property: `foobar: test`
3. The editor should underline the error in red
4. Open the "Problems" panel to see the error message

### Available schemas

- **OpenAPI**: `generators/schemas/openapi-config.schema.json`
  - Applied to: `generators/openapi/*.yaml`

- **AsyncAPI**: `generators/schemas/asyncapi-config.schema.json`
  - Applied to: `generators/asyncapi/*.yaml`

### Customization

To add other file patterns, modify `settings.json`:

```json
{
  "yaml.schemas": {
    "./generators/schemas/openapi-config.schema.json": [
      "generators/openapi/**/*.yaml",  // All YAML in openapi/
      "custom-path/*.yaml"             // Custom pattern
    ]
  }
}
```

## Troubleshooting

### Validation not working

1. **Check YAML extension**: `Ctrl+Shift+X` → search "YAML" → install/enable
2. **Reload VS Code**: `Ctrl+Shift+P` → "Developer: Reload Window"
3. **Check paths**: Paths in `settings.json` are relative to project root
4. **View logs**: `Ctrl+Shift+P` → "YAML: Show Output Channel"

### Auto-completion not working

- Press `Ctrl+Space` to trigger auto-completion
- Check that cursor is at the correct indentation level

### False positives

If a valid YAML file is marked as invalid:
- Verify that the JSON Schema is correct
- Check YAML indentation (spaces, not tabs)
- Check logs: `Output` → `YAML Support`
