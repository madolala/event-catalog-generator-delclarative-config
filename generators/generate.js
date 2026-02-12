#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Ajv = require('ajv');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}✗${colors.reset} ${msg}`),
};

// Plugin types mapping
const PLUGIN_PACKAGES = {
  openapi: '@eventcatalog/generator-openapi',
  asyncapi: '@eventcatalog/generator-asyncapi',
};

/**
 * Load and validate YAML file
 */
function loadYamlFile(filePath, schema = null) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(content);

    if (schema) {
      const ajv = new Ajv({ allErrors: true });
      const validate = ajv.compile(schema);
      const valid = validate(data);

      if (!valid) {
        log.error(`Validation failed for ${path.basename(filePath)}:`);
        validate.errors.forEach((err) => {
          log.error(`  ${err.instancePath} ${err.message}`);
        });
        throw new Error('YAML validation failed');
      }
    }

    return data;
  } catch (error) {
    log.error(`Failed to load ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Deep merge two objects, with source overriding target
 */
function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (target[key]) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    } else {
      output[key] = source[key];
    }
  }

  return output;
}

/**
 * Process a plugin type directory (e.g., openapi, asyncapi)
 */
function processPluginDirectory(pluginType, generatorsDir) {
  const pluginDir = path.join(generatorsDir, pluginType);

  if (!fs.existsSync(pluginDir)) {
    log.warning(`Directory not found: ${pluginDir}`);
    return [];
  }

  log.info(`Processing ${pluginType} generators...`);

  // Load schema if available
  const schemaPath = path.join(generatorsDir, 'schemas', `${pluginType}-config.schema.json`);
  let schema = null;
  if (fs.existsSync(schemaPath)) {
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    log.info(`  Using schema: ${path.basename(schemaPath)}`);
  }

  // Load global config
  const globalConfigPath = path.join(pluginDir, '__config__.yaml');
  let globalConfig = {};

  if (fs.existsSync(globalConfigPath)) {
    globalConfig = loadYamlFile(globalConfigPath, schema);
    log.success(`  Loaded global config: __config__.yaml`);
  }

  // Load all service-specific configs
  const files = fs.readdirSync(pluginDir);
  const serviceFiles = files.filter(
    (f) => f.endsWith('.yaml') && f !== '__config__.yaml'
  );

  if (serviceFiles.length === 0) {
    log.warning(`  No service configs found in ${pluginType}/`);
    return [];
  }

  const generators = [];

  for (const serviceFile of serviceFiles) {
    const serviceFilePath = path.join(pluginDir, serviceFile);
    const serviceConfig = loadYamlFile(serviceFilePath, schema);

    // Validate required fields for service
    if (!serviceConfig.id) {
      log.error(`  Missing required field 'id' in ${serviceFile}`);
      continue;
    }
    if (!serviceConfig.path) {
      log.error(`  Missing required field 'path' in ${serviceFile}`);
      continue;
    }

    // Deep merge: global config + service-specific config (service overrides global)
    const mergedConfig = deepMerge(globalConfig, serviceConfig);

    // Extract service-level properties
    const { id, path: servicePath, name, summary, owners, headers, ...restConfig } = mergedConfig;

    // Build service object
    const service = {
      id,
      path: servicePath,
    };

    if (name) service.name = name;
    if (summary) service.summary = summary;
    if (owners) service.owners = owners;
    if (headers) service.headers = headers;

    // Build plugin config
    const pluginConfig = {
      ...restConfig,
      services: [service],
    };

    // Add to generators array
    generators.push([PLUGIN_PACKAGES[pluginType], pluginConfig]);

    log.success(`  ✓ ${serviceFile} → ${id}`);
  }

  return generators;
}

/**
 * Main generation function
 */
function generateConfig() {
  const generatorsDir = path.join(__dirname);
  const outputPath = path.join(generatorsDir, 'generated.mjs');

  log.info('Starting EventCatalog generators configuration...\n');

  const allGenerators = [];

  // Process each plugin type
  for (const pluginType of Object.keys(PLUGIN_PACKAGES)) {
    const generators = processPluginDirectory(pluginType, generatorsDir);
    allGenerators.push(...generators);
  }

  if (allGenerators.length === 0) {
    log.warning('\nNo generators were created!');
    return;
  }

  // Generate the output file (ES module format)
  // Replace {{ VAR_NAME }} patterns with process.env.VAR_NAME references
  const jsonOutput = JSON.stringify(allGenerators, null, 2)
    .replace(/"([^"]*\{\{\s*\w+\s*\}\}[^"]*)"/g, (_match, content) => {
      const resolved = content.replace(/\{\{\s*(\w+)\s*\}\}/g, '${process.env.$1}');
      return '`' + resolved + '`';
    });

  const outputContent = `// THIS FILE IS AUTO-GENERATED BY generators/generate.js
// DO NOT EDIT MANUALLY - Your changes will be overwritten
// Generated at: ${new Date().toISOString()}

export default ${jsonOutput};
`;

  fs.writeFileSync(outputPath, outputContent, 'utf8');

  // Also copy to .eventcatalog-core/generators/ if it exists (for dev server)
  const eventcatalogCoreDir = path.join(process.cwd(), '.eventcatalog-core', 'generators');
  if (!fs.existsSync(eventcatalogCoreDir)) {
    fs.mkdirSync(eventcatalogCoreDir, { recursive: true });
  }
  const coreOutputPath = path.join(eventcatalogCoreDir, 'generated.mjs');
  fs.writeFileSync(coreOutputPath, outputContent, 'utf8');

  log.success(`\n✓ Generated ${allGenerators.length} generator(s)`);
  log.success(`✓ Output written to: ${path.relative(process.cwd(), outputPath)}`);
  log.success(`✓ Output copied to: ${path.relative(process.cwd(), coreOutputPath)}`);
}

// Run the generation
try {
  generateConfig();
} catch (error) {
  log.error(`\nGeneration failed: ${error.message}`);
  process.exit(1);
}
