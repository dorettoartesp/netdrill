import React from 'react';
import { ImportScreen } from '@/components/ImportScreen';
import { buildAuthoringPrompt } from '@/lib/content/prompt';

/**
 * Content import page. The authoring prompt is built on the server so the schema library stays out of the client bundle.
 */
export default function ImportPage() {
  return <ImportScreen prompt={buildAuthoringPrompt()} />;
}
