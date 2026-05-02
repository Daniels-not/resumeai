// No longer needed — key is server-side. This file is kept as a stub
// in case you ever want to support bring-your-own-key in the future.
export default function ApiKeyModal({ onSave }: { onSave: () => void }) {
  // Auto-dismiss immediately since no key is needed from the user
  if (typeof window !== "undefined") onSave();
  return null;
}
