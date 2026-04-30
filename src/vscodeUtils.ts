import * as vscode from 'vscode';

export function getGitExtension(): any | undefined {
  const gitExt = vscode.extensions.getExtension('vscode.git');
  if (!gitExt?.exports) {
    return undefined;
  }
  return gitExt.exports;
}

export function getCurrentGitRepoInstance(): any | undefined {
  const git = getGitExtension();
  if (!git) {
    return undefined;
  }
  
  const model = git.model;
  const repositories = model.repositories;
  if (!repositories || repositories.length === 0) {
    return undefined;
  }
  
  return repositories[0];
}

export function getCommitMessage(): string {
  const repo = getCurrentGitRepoInstance();
  return repo?.inputBox?.value || '';
}

export function setCommitMessage(message: string): void {
  const repo = getCurrentGitRepoInstance();
  if (repo?.inputBox) {
    repo.inputBox.value = message;
  }
}

export function clearCommitMessage(): void {
  setCommitMessage('');
}

export function getGitRootFromSourceControl(sourceControl?: any): string | undefined {
  return sourceControl?.rootUri?.fsPath;
}

export function getGitRootFromWorkspace(): string | undefined {
  const activeEditor = vscode.window.activeTextEditor;
  let cwd = activeEditor?.document.uri.fsPath
    ? vscode.workspace.getWorkspaceFolder(activeEditor.document.uri)?.uri.fsPath
    : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  
  return cwd;
}
