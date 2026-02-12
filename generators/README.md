# EventCatalog Generators - Declarative Configuration

This system allows you to manage EventCatalog generator configurations declaratively via YAML files, eliminating the need to manually edit `eventcatalog.config.js`.

## 📁 Structure

```
generators/
├── openapi/                       # OpenAPI configurations
│   ├── __config__.yaml            # Global OpenAPI config
│   ├── vehicule-service.yaml      # Service 1
│   ├── qr-reference.yaml          # Service 2
│   └── policy-outbound.yaml       # Service 3
├── asyncapi/                      # AsyncAPI configurations
│   ├── __config__.yaml            # Global AsyncAPI config
│   ├── regress.yaml               # Service 1
│   └── retribution.yaml           # Service 2
├── schemas/                       # JSON Schemas for validation
│   ├── openapi-config.schema.json
│   └── asyncapi-config.schema.json
├── generate.js                    # Generation script
├── generated.mjs                  # ⚠️ AUTO-GENERATED `genrators` array
├── EXAMPLE-openapi-service.yaml   # OpenAPI template
├── EXAMPLE-asyncapi-service.yaml  # AsyncAPI template
├── QUICKSTART.md                  # Quick guide
└── README.md                      # This file
```

## 🚀 Usage

### Adding a new API

1. **Create a YAML file** in the appropriate folder (`openapi/` or `asyncapi/`)

```yaml
# generators/openapi/my-new-api.yaml
id: "my-new-api"
path: "https://api.swaggerhub.com/apis/MyOrg/my-api/1.0.0"
headers:
  Authorization: "your-token-here"
domain:
  id: "my-domain"
  name: "My Domain"
  version: "1.0.0"
```


2. **Generate the catalog**

```bash
npm run generate
```

The `generated.mjs` file is automatically created and imported by `eventcatalog.config.js`.

### Environment Variables Support

YAML files support environment variables defined in your `.env` file. Use the `${VARIABLE_NAME}` syntax:

```yaml
# .env
API_TOKEN=your-secret-token
API_BASE_URL=https://api.example.com

# generators/openapi/my-api.yaml
id: "my-api"
path: "{{ API_BASE_URL }}/openapi.json"
headers:
  Authorization: "Bearer {{ API_TOKEN }}"
domain:
  id: "my-domain"
  name: "My Domain"
  version: "1.0.0"
```

**Benefits:**
- 🔒 Keep sensitive tokens out of version control
- 🌍 Different values per environment (dev, staging, prod)
- 🔄 Easy configuration changes without editing YAML files

## 🔧 Global vs Specific Configuration

### Global config (`__config__.yaml`)

Defines common parameters for all services of the same type:

```yaml
# generators/openapi/__config__.yaml
debug: true
sidebarBadgeType: "MESSAGE_TYPE"
httpMethodsToMessages:
  GET: "query"
  POST: "command"
  PUT: "command"
  DELETE: "command"
```

### Specific config (e.g., `service.yaml`)

Defines parameters for a specific service. **Can override global config**:

```yaml
# generators/openapi/special-service.yaml
id: "special-service"
path: "https://..."
debug: false  # ← Override: debug set to false for this service only

domain:
  id: "my-domain"
  name: "My Domain"
  version: "1.0.0"
```

### Priority order

```
Specific config > Global config
```

The merge is deep, so you can override individual properties.

## ✅ Validation

Each YAML file is validated against a JSON Schema during generation. Validation errors are clearly displayed:

```bash
✗ Validation failed for my-service.yaml:
  must NOT have additional properties
```

### Real-time validation in VS Code

The project includes VS Code configuration for real-time validation:

1. **Install the YAML extension** (`redhat.vscode-yaml`: https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)
2. **Reload VS Code** (`Ctrl+Shift+P` → "Developer: Reload Window")
3. **Edit a YAML file** - Invalid properties are underlined in red
4. **View errors** in the "Problems" panel (`Ctrl+Shift+M`)

**Features:**
- ✅ Real-time validation with error highlighting
- ✅ Auto-completion (`Ctrl+Space`)
- ✅ Inline documentation on hover
- ✅ Type checking

See [.vscode/README.md](../.vscode/README.md) for more details.

## 📝 Supported Properties

### OpenAPI Plugin

**Required:**
- `id` - Unique service identifier
- `path` - URL or path to OpenAPI file

**Optional:**
- `name` - Display name
- `summary` - Short description
- `owners` - List of owners
- `headers` - HTTP headers for authenticated URLs
- `domain` - Domain configuration (id, name, version)
- `debug` - Enable detailed logging
- `sidebarBadgeType` - `"HTTP_METHOD"` or `"MESSAGE_TYPE"`
- `httpMethodsToMessages` - HTTP methods to message types mapping
- `draft` - Mark service as draft
- More options in [EventCatalog documentation](https://www.eventcatalog.dev/docs/plugins/openapi/plugin-configuration)

### AsyncAPI Plugin

**Required:**
- `id` - Unique service identifier
- `path` - URL or path to AsyncAPI file

**Optional:**
- `name` - Display name
- `summary` - Short description
- `owners` - List of owners
- `headers` - HTTP headers for authenticated URLs
- `domain` - Domain configuration (id, name, version)
- `debug` - Enable detailed logging
- `saveParsedSpecFile` - Save parsed spec
- `parseSchemas` - Parse message schemas (default: true)
- `parseChannels` - Generate channel resources (default: false)
- `draft` - Mark service as draft
- More options in [EventCatalog documentation](https://www.eventcatalog.dev/docs/plugins/asyncapi/plugin-configuration)

## 🔄 Workflow

### Daily development

```bash
# 1. Edit/add YAML files
vim generators/openapi/my-new-api.yaml

# 2. Generate config + catalog
npm run generate

# 3. Start dev server
npm run dev
```

### Automatic hook

The `pregenerate` script runs automatically before `npm run generate`, so you don't need to manually call `generate:config`:

```json
{
  "scripts": {
    "generate:config": "node generators/generate.js",
    "pregenerate": "npm run generate:config",
    "generate": "eventcatalog generate"
  }
}
```

## 📊 Complete Example

### Global configuration

```yaml
# generators/openapi/__config__.yaml
debug: true
sidebarBadgeType: "MESSAGE_TYPE"
httpMethodsToMessages:
  GET: "query"
  POST: "command"
  PUT: "command"
  DELETE: "command"
  PATCH: "command"
```

### Service with override

```yaml
# generators/openapi/legacy-api.yaml
id: "legacy-api"
path: "https://api.example.com/legacy/openapi.json"
debug: false  # Override: no debug for this API
owners:
  - "Legacy Team"
headers:
  Authorization: "Bearer xyz123"
domain:
  id: "legacy"
  name: "Legacy Systems"
  version: "2.0.0"
  draft: true  # Mark as draft
```

### Generated result

```javascript
export default [
  [
    "@eventcatalog/generator-openapi",
    {
      debug: false,  // ← Overridden
      sidebarBadgeType: "MESSAGE_TYPE",  // ← From global
      httpMethodsToMessages: {  // ← From global
        GET: "query",
        POST: "command",
        PUT: "command",
        DELETE: "command",
        PATCH: "command"
      },
      domain: {
        id: "legacy",
        name: "Legacy Systems",
        version: "2.0.0",
        draft: true
      },
      services: [
        {
          id: "legacy-api",
          path: "https://api.example.com/legacy/openapi.json",
          owners: ["Legacy Team"],
          headers: {
            Authorization: "Bearer xyz123"
          }
        }
      ]
    }
  ]
];
```

## 🎯 Benefits

✅ **Declarative** - Readable and maintainable configuration

✅ **DRY** - No configuration duplication

✅ **Validated** - JSON Schema ensures consistency

✅ **Scalable** - Easily add dozens of APIs

✅ **Override** - Flexibility for special cases

✅ **Git-friendly** - Easy to version and merge

✅ **IDE Support** - Real-time validation in VS Code

## 🐛 Troubleshooting

### Error: "Cannot find module './generators/generated.mjs'"

Run `npm run generate:config` to create the file.

### Validation fails

Verify that your YAML file contains at minimum `id` and `path`.

### Service doesn't appear

1. Check that the YAML file is in the correct folder
2. Check that it has the `.yaml` extension (not `.yml`)
3. Run `npm run generate:config` and check the logs

### VS Code validation not working

1. Install the YAML extension: `redhat.vscode-yaml`
2. Reload VS Code: `Ctrl+Shift+P` → "Developer: Reload Window"
3. Check logs: `Output` → `YAML Support`

## 📚 Resources

- [EventCatalog Documentation](https://www.eventcatalog.dev/)
- [OpenAPI Plugin](https://www.eventcatalog.dev/docs/plugins/openapi/plugin-configuration)
- [AsyncAPI Plugin](https://www.eventcatalog.dev/docs/plugins/asyncapi/plugin-configuration)
