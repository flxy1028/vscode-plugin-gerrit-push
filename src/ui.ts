import * as vscode from 'vscode';
import { getText } from './i18n';
import { extractRepoName, formatReviewers } from './git';

export type BranchPick = vscode.QuickPickItem & { value: string };
export type RemotePick = vscode.QuickPickItem & { value: string };

export async function chooseBranch(
  currentBranch: string,
  defaultBranch: string,
  remoteBranches: string[]
): Promise<string | undefined> {
  const picks: BranchPick[] = [{
    label: `$(git-branch) ${currentBranch}`,
    description: 'Use current branch',
    value: currentBranch
  }];

  if (defaultBranch && defaultBranch !== currentBranch) {
    picks.push({
      label: `$(rocket) ${defaultBranch}`,
      description: 'Use configured default branch',
      value: defaultBranch
    });
  }

  for (const branch of remoteBranches) {
    if (branch !== currentBranch && branch !== defaultBranch) {
      picks.push({
        label: `$(cloud) ${branch}`,
        description: `Remote branch: ${branch}`,
        value: branch
      });
    }
  }

  const qp = vscode.window.createQuickPick<BranchPick>();
  qp.title = getText('selectBranchTitle') as string;
  qp.placeholder = getText('selectBranchPlaceholder') as string;
  qp.items = picks;
  qp.value = defaultBranch || currentBranch;

  return new Promise<string | undefined>((resolve) => {
    qp.onDidAccept(() => {
      const selected = qp.selectedItems[0];
      const inputValue = qp.value.trim();
      if (selected) {
        resolve(selected.value);
      } else if (inputValue.length > 0) {
        resolve(inputValue);
      } else {
        resolve(undefined);
      }
      qp.hide();
    });
    qp.onDidHide(() => resolve(undefined));
    qp.show();
  });
}

export async function chooseRemote(
  remoteFromConfig: string,
  remoteList: string[]
): Promise<string | undefined> {
  if (remoteList.includes(remoteFromConfig)) {
    return remoteFromConfig;
  }

  if (remoteList.length === 0) {
    vscode.window.showErrorMessage(getText('noGitRemote') as string);
    return undefined;
  }

  if (remoteList.length === 1) {
    return remoteList[0];
  }

  const picks: RemotePick[] = remoteList.map(remote => ({
    label: remote,
    description: remote === remoteFromConfig ? 'Configured remote' : '',
    value: remote
  }));

  const selection = await vscode.window.showQuickPick(picks, {
    placeHolder: getText('selectRemotePlaceholder') as string
  });

  return selection?.value;
}

export async function showPushConfirmation(
  branch: string,
  remote: string,
  remoteUrl: string | undefined,
  reviewers: string[],
  style: 'quickpick' | 'message',
  compactUrl: boolean
): Promise<boolean> {
  return style === 'message'
    ? showMessageConfirmation(branch, remote, remoteUrl, reviewers, compactUrl)
    : showQuickPickConfirmation(branch, remote, remoteUrl, reviewers, compactUrl);
}

async function showQuickPickConfirmation(
  branch: string,
  remote: string,
  remoteUrl: string | undefined,
  reviewers: string[],
  compactUrl: boolean
): Promise<boolean> {
  type ConfirmPick = vscode.QuickPickItem & { value: boolean };

  const details: string[] = [
    `Branch: ${branch}`,
    `Remote: ${remote}`
  ];
  if (remoteUrl) {
    const displayUrl = compactUrl ? extractRepoName(remoteUrl) : remoteUrl;
    details.push(`URL: ${displayUrl}`);
  }
  if (reviewers.length > 0) {
    details.push(`Reviewers: ${formatReviewers(reviewers)}`);
  }

  const picks: ConfirmPick[] = [{
    label: '$(check) Push',
    description: 'Confirm and push',
    detail: details.join(' • '),
    value: true
  }, {
    label: '$(x) Cancel',
    description: 'Discard changes',
    detail: '',
    value: false
  }];

  const qp = vscode.window.createQuickPick<ConfirmPick>();
  qp.title = getText('confirmTitle') as string;
  qp.items = picks;
  qp.placeholder = getText('confirmPlaceholder') as string;

  return new Promise<boolean>((resolve) => {
    qp.onDidAccept(() => {
      const selected = qp.selectedItems[0];
      resolve(selected?.value ?? false);
      qp.hide();
    });
    qp.onDidHide(() => resolve(false));
    qp.show();
  });
}

async function showMessageConfirmation(
  branch: string,
  remote: string,
  remoteUrl: string | undefined,
  reviewers: string[],
  compactUrl: boolean
): Promise<boolean> {
  const displayUrl = remoteUrl ? (compactUrl ? extractRepoName(remoteUrl) : remoteUrl) : '';
  const reviewerText = reviewers.length > 0 ? formatReviewers(reviewers) : undefined;
  const confirmMessage = (getText('pushConfirmMessage') as (branch: string, remote: string, repo?: string, reviewers?: string) => string)(
    branch, remote, displayUrl || undefined, reviewerText
  );

  const confirm = await vscode.window.showWarningMessage(
    confirmMessage,
    { modal: true },
    getText('pushButtonMsg') as string
  );
  return confirm === getText('pushButtonMsg');
}

export async function promptReviewers(presets: string[]): Promise<string | undefined> {
  if (presets.length === 0) {
    return vscode.window.showInputBox({
      title: getText('reviewerInputTitle') as string,
      prompt: getText('reviewerInputPlaceholder') as string,
      placeHolder: getText('reviewerInputPlaceholder') as string
    });
  }

  type ReviewerPick = vscode.QuickPickItem & { value: string };
  const picks: ReviewerPick[] = [{
    label: getText('reviewerNoneLabel') as string,
    description: getText('reviewerNoneDescription') as string,
    value: '__none__'
  }, ...presets.map(reviewer => ({
    label: reviewer,
    description: getText('reviewerPresetDescription') as string,
    value: reviewer
  }))];

  const qp = vscode.window.createQuickPick<ReviewerPick>();
  qp.title = getText('reviewerSelectTitle') as string;
  qp.placeholder = getText('reviewerSelectPlaceholder') as string;
  qp.items = picks;
  qp.canSelectMany = true;

  return new Promise<string | undefined>((resolve) => {
    qp.onDidAccept(() => {
      const selected = qp.selectedItems.map(item => item.value);
      const inputValue = qp.value.trim();
      const inputReviewers = inputValue.length > 0 ? inputValue.split(/[,\s]+/).map(i => i.trim()).filter(i => i.length > 0) : [];
      
      if (selected.includes('__none__')) {
        resolve('');
        qp.hide();
        return;
      }
      
      const combined = Array.from(new Set([...selected, ...inputReviewers]));
      resolve(combined.join(','));
      qp.hide();
    });
    qp.onDidHide(() => resolve(undefined));
    qp.show();
  });
}
