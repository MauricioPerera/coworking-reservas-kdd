import { runKdd } from './kdd.mjs';
const metadataOnly = process.argv.slice(2).includes('--metadata-only');
runKdd('validate_contracts.py', ['knowledge/contracts', '--repo-root', '.']);
runKdd('validate_okf.py', ['knowledge']);
runKdd('validate_specs.py', ['specs']);
if (!metadataOnly) runKdd('validate_test_commands.py', ['knowledge/contracts', '.', '--timeout', '60']);
