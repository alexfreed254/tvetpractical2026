import { PROJECT_CORE_FILES, type ExportProjectFile } from './projectCoreFiles';
import { PROJECT_APP_FILES } from './projectUiFiles';
import { PROJECT_COMPONENT_FILES } from './projectComponentFiles';

export type { ExportProjectFile };

export const ALL_PROJECT_FILES: ExportProjectFile[] = [
  ...PROJECT_CORE_FILES,
  ...PROJECT_APP_FILES,
  ...PROJECT_COMPONENT_FILES,
];
