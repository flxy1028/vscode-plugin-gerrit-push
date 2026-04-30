import * as vscode from 'vscode';
import { getText } from './i18n';
import { getConfig } from './config';
import { 
  runGit, 
  resolveGitRoot, 
  getCurrentBranch, 
  listRemotes, 
  listRemoteBranches, 
  getRemoteUrl, 
  generateCommitSha,
  buildPushRef,
  normalizeReviewers 
} from './git';
import { chooseBranch, chooseRemote, showPushConfirmation, promptReviewers } from './ui';
import { getCurrentGitRepoInstance, clearCommitMessage } from './vscodeUtils';

const outputChannel = vscode.window.createOutputChannel(getText('outputChannelName') as string);

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('gerritPush.pushToGerrit', async (sourceControl?: any) => {
    try {
      await pushToGerrit(sourceControl);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      outputChannel.appendLine(`Error: ${message}`);
      vscode.window.showErrorMessage(`Gerrit push failed: ${message}`);
    }
  });

  context.subscriptions.push(disposable, outputChannel);
}

export function deactivate() {
  // Nothing to clean up
}

async function pushToGerrit(sourceControl?: any) {
  let gitRoot: string | undefined;

  if (sourceControl?.rootUri?.fsPath) {
    gitRoot = sourceControl.rootUri.fsPath;
    outputChannel.appendLine(`Using repository from SCM context: ${gitRoot}`);
  } else {
    const cwd = getWorkspacePath();
    if (cwd) {
      gitRoot = await resolveGitRoot(cwd);
    }
  }

  if (!gitRoot) {
    vscode.window.showErrorMessage(getText('noGitRepo') as string);
    return;
  }

  const config = getConfig();
  const currentBranch = await getCurrentBranch(gitRoot);

  let remote: string | undefined;
  if (config.skipAllPrompts) {
    remote = config.remote;
  } else {
    const remotes = await listRemotes(gitRoot);
    remote = await chooseRemote(config.remote, remotes);
  }
  
  if (!remote) return;

  let branch: string | undefined;
  if (config.skipAllPrompts) {
    branch = config.defaultBranch || currentBranch;
  } else {
    const remoteBranches = await listRemoteBranches(remote, gitRoot);
    branch = await chooseBranch(currentBranch, config.defaultBranch, remoteBranches);
  }
  
  if (!branch) return;

  let reviewers: string[] = [];
  if (config.enableReviewers && !config.skipAllPrompts) {
    const reviewerInput = await promptReviewers(config.reviewerPresets);
    if (reviewerInput === undefined) return;
    reviewers = normalizeReviewers(reviewerInput);
  }

  const pushRef = buildPushRef(branch, reviewers);
  const remoteUrl = await getRemoteUrl(remote, gitRoot);

  showPushDetails(currentBranch, branch, remote, remoteUrl, pushRef, reviewers);

  if (config.confirmBeforePush && !config.skipAllPrompts) {
    const confirmed = await showPushConfirmation(
      branch, remote, remoteUrl, reviewers, config.confirmationStyle, config.compactRemoteUrl
    );
    if (!confirmed) return;
  }

  await executePush(config, remote, pushRef, branch, gitRoot);
}

function getWorkspacePath(): string | undefined {
  const activeEditor = vscode.window.activeTextEditor;
  return activeEditor?.document.uri.fsPath
    ? vscode.workspace.getWorkspaceFolder(activeEditor.document.uri)?.uri.fsPath
    : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function showPushDetails(
  currentBranch: string,
  targetBranch: string,
  remote: string,
  remoteUrl: string | undefined,
  pushRef: string,
  reviewers: string[]
): void {
  outputChannel.show(true);
  outputChannel.appendLine('');
  outputChannel.appendLine('═══════════════════════════════════════');
  outputChannel.appendLine(`Push Details:`);
  outputChannel.appendLine(`  Current Branch: ${currentBranch}`);
  outputChannel.appendLine(`  Target Branch:  ${targetBranch}`);
  outputChannel.appendLine(`  Remote Name:    ${remote}`);
  if (remoteUrl) outputChannel.appendLine(`  Remote URL:     ${remoteUrl}`);
  outputChannel.appendLine(`  Push Ref:       ${pushRef}`);
  if (reviewers.length > 0) outputChannel.appendLine(`  Reviewers:      ${reviewers.join(', ')}`);
  outputChannel.appendLine('═══════════════════════════════════════');
  outputChannel.appendLine('');
}

async function executePush(
  config: ReturnType<typeof getConfig>,
  remote: string,
  pushRef: string,
  branch: string,
  cwd: string
): Promise<void> {
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: `Pushing ${pushRef} to ${remote}`,
    cancellable: false
  }, async () => {
    const gitCommands: string[][] = [];

    if (config.autoAddChangeId) {
      await addChangeIdToCommitMessage(cwd);
    }

    if (config.quickPush) {
      await runGit(['add', '.'], cwd, true, text => outputChannel.append(text));
      outputChannel.appendLine('> git add .');
      
      const repo = getCurrentGitRepoInstance();
      if (!repo) {
        vscode.window.showErrorMessage('未找到 Git 仓库');
        return;
      }
      
      const msg = repo.inputBox.value;
      gitCommands.push(['commit', '-m', msg]);
      gitCommands.push(['pull', '--rebase']);
    }

    gitCommands.push(['push', remote, pushRef]);

    for (const cmd of gitCommands) {
      outputChannel.appendLine(`> ${cmd.join(' ')}`);
      const result = await runGit(cmd, cwd, true, text => outputChannel.append(text));
      if (result.stdout.trim()) outputChannel.appendLine(result.stdout.trim());
      if (result.stderr.trim()) outputChannel.appendLine(result.stderr.trim());
    }
  });

  clearCommitMessage();
  vscode.window.showInformationMessage(`Pushed HEAD to ${remote} refs/for/${branch}`);
}

async function addChangeIdToCommitMessage(cwd: string): Promise<void> {
  const repo = getCurrentGitRepoInstance();
  if (!repo) return;

  const commitMessage = repo.inputBox.value;
  if (commitMessage.includes('Change-Id:')) return;

  const changeId = await generateCommitSha(cwd, commitMessage);
  repo.inputBox.value = `${commitMessage}\n\nChange-Id: I${changeId}`;
}
