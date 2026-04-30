import { spawn, spawnSync } from 'child_process';

export interface GitRunResult {
  stdout: string;
  stderr: string;
}

export async function runGit(args: string[], cwd: string, streamOutput = false, outputCallback?: (text: string) => void): Promise<GitRunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      stdout += text;
      if (streamOutput && outputCallback) {
        outputCallback(text);
      }
    });

    child.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      stderr += text;
      if (streamOutput && outputCallback) {
        outputCallback(text);
      }
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(stderr.trim() || `git exited with code ${code}`));
      }
    });
  });
}

export async function resolveGitRoot(cwd: string): Promise<string | undefined> {
  try {
    const result = await runGit(['rev-parse', '--show-toplevel'], cwd);
    const root = result.stdout.trim();
    return root || undefined;
  } catch {
    return undefined;
  }
}

export async function getCurrentBranch(cwd: string): Promise<string> {
  const result = await runGit(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
  const branch = result.stdout.trim();
  if (!branch) {
    throw new Error('Unable to determine current branch.');
  }
  return branch;
}

export async function listRemotes(cwd: string): Promise<string[]> {
  try {
    const result = await runGit(['remote'], cwd);
    return result.stdout
      .split(/\r?\n/)
      .map(r => r.trim())
      .filter(r => r.length > 0);
  } catch {
    return [];
  }
}

export async function listRemoteBranches(remote: string, cwd: string): Promise<string[]> {
  try {
    const result = await runGit(['branch', '-r'], cwd);
    const lines = result.stdout
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const prefix = `${remote}/`;
    return lines
      .filter(line => line.startsWith(prefix))
      .map(line => line.substring(prefix.length))
      .filter(branch => !branch.startsWith('HEAD'));
  } catch {
    return [];
  }
}

export async function getRemoteUrl(remote: string, cwd: string): Promise<string | undefined> {
  try {
    const result = await runGit(['remote', 'get-url', remote], cwd);
    return result.stdout.trim() || undefined;
  } catch {
    return undefined;
  }
}

export async function generateCommitSha(repoPath: string, commitMessage: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const git = spawn('git', ['hash-object', '-t', 'commit', '--stdin'], { cwd: repoPath });
    let stdout = '';
    let stderr = '';

    git.stdout.on('data', (data: Buffer | string) => {
      stdout += data.toString();
    });

    git.stderr.on('data', (data: Buffer | string) => {
      stderr += data.toString();
    });

    git.on('close', (code: number) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error('生成失败：' + stderr));
      }
    });

    const tree = spawnSync('git', ['write-tree'], { cwd: repoPath }).stdout.toString().trim();
    const author = spawnSync('git', ['var', 'GIT_AUTHOR_IDENT'], { cwd: repoPath }).stdout.toString().trim();
    const committer = spawnSync('git', ['var', 'GIT_COMMITTER_IDENT'], { cwd: repoPath }).stdout.toString().trim();

    const input = `tree ${tree}\nauthor ${author}\ncommitter ${committer}\n\n${commitMessage}`;

    git.stdin.write(input, 'utf8');
    git.stdin.end();
  });
}

export function buildPushRef(branch: string, reviewers: string[]): string {
  if (reviewers.length === 0) {
    return `HEAD:refs/for/${branch}`;
  }
  const reviewerParams = reviewers.map(reviewer => `r=${reviewer}`).join(',');
  return `HEAD:refs/for/${branch}%${reviewerParams}`;
}

export function normalizeReviewers(input: string): string[] {
  return input
    .split(/[,\s]+/)
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => item.replace(/^r=/i, ''));
}

export function formatReviewers(reviewers: string[]): string {
  return reviewers.join(', ');
}

export function extractRepoName(url: string): string {
  url = url.replace(/\.git\/?$/, '');
  const match = url.match(/[/:]+([^/:]+)$/);
  return match ? match[1] : url;
}
