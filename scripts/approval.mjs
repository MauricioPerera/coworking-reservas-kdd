import { git } from '../src/git.mjs';
export function requireApprovedRef(root, env = process.env) {
  const reference = env.KDD_QUALITY_APPROVED_REF;
  if (!/^[a-f0-9]{40}$/.test(reference ?? '')) throw new Error('Set KDD_QUALITY_APPROVED_REF to the full commit SHA explicitly approved by a human reviewer; symbolic references are rejected');
  git(root, ['rev-parse', '--verify', '--end-of-options', `${reference}^{commit}`]);
  git(root, ['merge-base', '--is-ancestor', reference, 'HEAD']);
  return reference;
}
