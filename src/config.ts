import * as vscode from 'vscode';

export interface GerritPushConfig {
  defaultBranch: string;
  remote: string;
  confirmBeforePush: boolean;
  skipAllPrompts: boolean;
  confirmationStyle: 'quickpick' | 'message';
  compactRemoteUrl: boolean;
  quickPush: boolean;
  autoAddChangeId: boolean;
  reviewerPresets: string[];
  enableReviewers: boolean;
}

export function getConfig(): GerritPushConfig {
  const configFolder = getConfigFolder();
  const config = vscode.workspace.getConfiguration('gerritPush', configFolder?.uri);

  return {
    defaultBranch: config.get<string>('defaultBranch', '').trim(),
    remote: config.get<string>('remote', 'origin').trim() || 'origin',
    confirmBeforePush: config.get<boolean>('confirmBeforePush', true),
    skipAllPrompts: config.get<boolean>('skipAllPrompts', true),
    confirmationStyle: config.get<'quickpick' | 'message'>('confirmationStyle', 'quickpick'),
    compactRemoteUrl: config.get<boolean>('compactRemoteUrl', false),
    quickPush: config.get<boolean>('quickPush', true),
    autoAddChangeId: config.get<boolean>('autoAddChangeId', true),
    reviewerPresets: config.get<string[]>('reviewerPresets', [])
      .map(item => item.trim())
      .filter(item => item.length > 0),
    enableReviewers: config.get<boolean>('enableReviewers', false)
  };
}

function getConfigFolder(): vscode.WorkspaceFolder | undefined {
  let configFolder = vscode.workspace.workspaceFolders?.[0];
  const activeEditor = vscode.window.activeTextEditor;
  
  if (activeEditor) {
    const editorFolder = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);
    if (editorFolder) {
      configFolder = editorFolder;
    }
  }
  
  return configFolder;
}
