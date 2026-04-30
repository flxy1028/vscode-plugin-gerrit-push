import * as vscode from 'vscode';

export type Language = 'en' | 'zh';

export interface I18nTexts {
  outputChannelName: string;
  noGitRepo: string;
  noGitRemote: string;
  selectBranchTitle: string;
  selectBranchPlaceholder: string;
  selectRemotePlaceholder: string;
  confirmTitle: string;
  confirmPlaceholder: string;
  pushButton: string;
  pushButtonMsg: string;
  pushButtonDesc: string;
  cancelButton: string;
  cancelButtonMsg: string;
  cancelButtonDesc: string;
  pushConfirmMessage: (branch: string, remote: string, repo?: string, reviewers?: string) => string;
  currentBranch: string;
  defaultBranch: string;
  remoteBranch: string;
  pushDetailsTitle: string;
  currentBranchLabel: string;
  targetBranchLabel: string;
  remoteNameLabel: string;
  remoteUrlLabel: string;
  pushRefLabel: string;
  reviewersLabel: string;
  pushingTitle: (ref: string, remote: string) => string;
  pushSuccessMessage: (remote: string, branch: string) => string;
  reviewerInputTitle: string;
  reviewerInputPlaceholder: string;
  reviewerSelectTitle: string;
  reviewerSelectPlaceholder: string;
  reviewerPresetDescription: string;
  reviewerNoneLabel: string;
  reviewerNoneDescription: string;
}

const i18n: Record<Language, I18nTexts> = {
  en: {
    outputChannelName: 'Gerrit Push',
    noGitRepo: 'No git repository found. Please switch to a directory with .git and try again.',
    noGitRemote: 'No git remotes found for Gerrit push.',
    selectBranchTitle: 'Select or enter target branch (refs/for/<branch>)',
    selectBranchPlaceholder: 'Enter branch/ref or select from recommendations below',
    selectRemotePlaceholder: 'Select remote to push to Gerrit',
    confirmTitle: 'Confirm Gerrit Push',
    confirmPlaceholder: 'Select to confirm or cancel',
    pushButton: '$(check) Push',
    pushButtonMsg: 'Push',
    pushButtonDesc: 'Confirm and push',
    cancelButton: '$(x) Cancel',
    cancelButtonMsg: 'Cancel',
    cancelButtonDesc: 'Discard changes',
    pushConfirmMessage: (branch: string, remote: string, repo?: string, reviewers?: string) => {
      const lines = [
        `Push to:`,
        `  Branch: ${branch}`,
        `  Remote: ${remote}`
      ];
      if (repo) lines.push(`  Repo: ${repo}`);
      if (reviewers) lines.push(`  Reviewers: ${reviewers}`);
      return lines.join('\n');
    },
    currentBranch: 'Use current branch',
    defaultBranch: 'Use configured default branch',
    remoteBranch: 'Remote branch',
    pushDetailsTitle: 'Push Details',
    currentBranchLabel: 'Current Branch',
    targetBranchLabel: 'Target Branch',
    remoteNameLabel: 'Remote Name',
    remoteUrlLabel: 'Remote URL',
    pushRefLabel: 'Push Ref',
    reviewersLabel: 'Reviewers',
    pushingTitle: (ref: string, remote: string) => `Pushing ${ref} to ${remote}`,
    pushSuccessMessage: (remote: string, branch: string) => `Pushed HEAD to ${remote} refs/for/${branch}`,
    reviewerInputTitle: 'Add reviewers',
    reviewerInputPlaceholder: 'Enter reviewers (comma or space separated, optional)',
    reviewerSelectTitle: 'Select reviewers',
    reviewerSelectPlaceholder: 'Pick presets or type to add reviewers',
    reviewerPresetDescription: 'Preset reviewer',
    reviewerNoneLabel: 'No reviewers',
    reviewerNoneDescription: 'Push without reviewers'
  },
  zh: {
    outputChannelName: 'Gerrit Push',
    noGitRepo: '未找到可用的 Git 仓库，请切换到包含 .git 的目录后重试。',
    noGitRemote: '未找到 Git Remote，无法执行 Gerrit push。',
    selectBranchTitle: '选择或输入目标分支 (refs/for/<branch>)',
    selectBranchPlaceholder: '输入分支/引用，或选择下方推荐项',
    selectRemotePlaceholder: '选择要推送到的 Remote',
    confirmTitle: '确认 Gerrit Push',
    confirmPlaceholder: '选择确认或取消',
    pushButton: '$(check) Push',
    pushButtonMsg: 'Push',
    pushButtonDesc: '确认并推送',
    cancelButton: '$(x) Cancel',
    cancelButtonMsg: '取消',
    cancelButtonDesc: '取消此次推送',
    pushConfirmMessage: (branch: string, remote: string, repo?: string, reviewers?: string) => {
      const lines = [
        `推送到:`,
        `  分支: ${branch}`,
        `  Remote: ${remote}`
      ];
      if (repo) lines.push(`  Repo: ${repo}`);
      if (reviewers) lines.push(`  Reviewer: ${reviewers}`);
      return lines.join('\n');
    },
    currentBranch: '使用当前分支',
    defaultBranch: '使用配置的默认分支',
    remoteBranch: 'Remote 分支',
    pushDetailsTitle: 'Push 详情',
    currentBranchLabel: '当前分支',
    targetBranchLabel: '目标分支',
    remoteNameLabel: 'Remote 名称',
    remoteUrlLabel: 'Remote URL',
    pushRefLabel: 'Push Ref',
    reviewersLabel: 'Reviewer',
    pushingTitle: (ref: string, remote: string) => `推送 ${ref} 到 ${remote}`,
    pushSuccessMessage: (remote: string, branch: string) => `已推送 HEAD 到 ${remote} refs/for/${branch}`,
    reviewerInputTitle: '添加 Reviewer',
    reviewerInputPlaceholder: '输入 reviewer（逗号或空格分隔，可留空）',
    reviewerSelectTitle: '选择 Reviewer',
    reviewerSelectPlaceholder: '选择预设或直接输入 reviewer',
    reviewerPresetDescription: '预设 reviewer',
    reviewerNoneLabel: '不添加 reviewer',
    reviewerNoneDescription: '不指定 reviewer 推送'
  }
};
export function getLanguage(): 'en' | 'zh' {
  const language = vscode.env.language;
  return language.startsWith('zh') ? 'zh' : 'en';
}

export function getText(key: string): any {
  const lang = getLanguage();
  return (i18n[lang as keyof typeof i18n] as any)[key];
}
