# 🚀 Quick Start Guide

## Add a new API in 3 steps

### 1️⃣ Create a YAML file

Copy the appropriate example and customize it:

```bash
# For OpenAPI
cp generators/EXAMPLE-openapi-service.yaml generators/openapi/my-new-api.yaml

# For AsyncAPI
cp generators/EXAMPLE-asyncapi-service.yaml generators/asyncapi/my-new-api.yaml
```

### 2️⃣ Edit the file

```yaml
# generators/openapi/my-new-api.yaml
id: "my-new-api"
path: "https://api.swaggerhub.com/apis/MyOrg/my-api/1.0.0"
headers:
  Authorization: "{{ MY_SWAGGER_HUB_TOKEN }}"
domain:
  id: "my-domain"
  name: "My Domain"
  version: "1.0.0"
```

### 3️⃣ Generate the catalog

```bash
npm run generate
```

That's it! 🎉

---

## Useful Commands

```bash
# Generate config only (without calling EventCatalog)
npm run generate:config

# Generate config + EventCatalog catalog
npm run generate

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Configuration Override

To override global config for a specific service, simply add the properties in the service file:

```yaml
# generators/openapi/__config__.yaml
debug: true  # Global config

# generators/openapi/special-service.yaml
id: "special-service"
debug: false  # ← Override for this service only
```

---

## File Structure

```
generators/
├── openapi/
│   ├── __config__.yaml       ← Global OpenAPI config
│   └── service.yaml          ← One file per service
├── asyncapi/
│   ├── __config__.yaml       ← Global AsyncAPI config
│   └── service.yaml          ← One file per service
└── generated.mjs              ← Auto-generated (do not edit)
```

---

## Automatic Validation

Each YAML file is validated automatically during generation. Errors are clearly displayed:

```bash
✗ Validation failed for my-service.yaml:
  /id is required
  /path is required
```

---

## Real-time Validation in VS Code

The project includes VS Code configuration for instant validation:

1. **Install YAML extension** (`redhat.vscode-yaml`)
2. **Reload VS Code** (`Ctrl+Shift+P` → "Developer: Reload Window")
3. **Edit a YAML file** - Invalid properties are underlined in red
4. **View errors** in the "Problems" panel (`Ctrl+Shift+M`)

**Features:**
- ✅ Real-time error highlighting
- ✅ Auto-completion (`Ctrl+Space`)
- ✅ Inline documentation on hover
- ✅ Type validation

---

## OpenAPI Properties

### Required
- `id` - Service identifier
- `path` - URL or path to OpenAPI file

### Optional
- `name` - Display name
- `summary` - Short description
- `owners` - List of owners
- `headers` - HTTP headers for authentication
- `domain` - Domain configuration
- `debug` - Enable detailed logging
- `sidebarBadgeType` - `"HTTP_METHOD"` or `"MESSAGE_TYPE"`
- `httpMethodsToMessages` - HTTP methods to message types mapping
- `draft` - Mark as draft
- More options in [EventCatalog documentation](https://www.eventcatalog.dev/docs/plugins/openapi/plugin-configuration)

---

## AsyncAPI Properties

### Required
- `id` - Service identifier
- `path` - URL or path to AsyncAPI file

### Optional
- `name` - Display name
- `summary` - Short description
- `owners` - List of owners
- `headers` - HTTP headers for authentication
- `domain` - Domain configuration
- `debug` - Enable detailed logging
- `saveParsedSpecFile` - Save parsed spec
- `parseSchemas` - Parse message schemas
- `parseChannels` - Generate channel resources
- `draft` - Mark as draft
- More options in [EventCatalog documentation](https://www.eventcatalog.dev/docs/plugins/asyncapi/plugin-configuration)

---

## More Info

👉 Check the [complete README](./README.md) for all details

👉 Official documentation: [EventCatalog](https://www.eventcatalog.dev/)
