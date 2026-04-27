const { spawn, spawnSync } = require('child_process');

/**
 * 执行：
 * (
 *  echo "tree $(git write-tree)"
 *  echo "author $(git var GIT_AUTHOR_IDENT)"
 *  echo "committer $(git var GIT_COMMITTER_IDENT)"
 *  echo
 *  echo "feat: 测试提交"
 * ) | git hash-object -t commit --stdin
 */
export async function generateCommitSha(repoPath: string, commitMessage: string) {
  return new Promise((resolve, reject) => {

    // 🔥 核心命令：git hash-object -t commit --stdin
    const git = spawn('git', [
      'hash-object',
      '-t',
      'commit',
      '--stdin'
    ], {
      cwd: repoPath,  // 必须是 git 仓库根目录
    });

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

    // ==============================================
    // ✅ 这里就是你命令里的 ( ... ) 拼接的内容
    // ==============================================
    const tree = spawnSync('git', ['write-tree'], { cwd: repoPath }).stdout.toString().trim();
    const author = spawnSync('git', ['var', 'GIT_AUTHOR_IDENT'], { cwd: repoPath }).stdout.toString().trim();
    const committer = spawnSync('git', ['var', 'GIT_COMMITTER_IDENT'], { cwd: repoPath }).stdout.toString().trim();

    const input = 
`tree ${tree}
 author ${author}
 committer ${committer}

${commitMessage}`;

    // 写入标准输入（管道）
    git.stdin.write(input, 'utf8');
    git.stdin.end(); // 结束输入 = Ctrl+D
  });
}