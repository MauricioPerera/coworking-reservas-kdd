import { root, runKdd } from './kdd.mjs';
import { requireApprovedRef } from './approval.mjs';
const reference = requireApprovedRef(root);
runKdd('validate_baseline.py', ['--all', '--approved-ref', reference]);
runKdd('verify_quality.py', ['--policy', 'quality.json', '--approved-ref', reference]);
