'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const YAML = require('yaml');
const { RUNTIME_METADATA, RUNTIME_ORDER } = require('../bin/runtime-metadata');

const ROOT = path.resolve(__dirname, '..');
const INSTALLER = path.join(ROOT, 'bin', 'install.js');

const LOCAL_INSTALLABLE_RUNTIMES = RUNTIME_ORDER.filter((runtimeKey) => {
  return RUNTIME_METADATA[runtimeKey].scopeSupport.local;
});

const GLOBAL_INSTALLABLE_RUNTIMES = RUNTIME_ORDER.filter((runtimeKey) => {
  return RUNTIME_METADATA[runtimeKey].scopeSupport.global;
});

function runInstaller(args, cwd, homeDir) {
  return spawnSync(process.execPath, [INSTALLER, ...args], {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: homeDir,
      USERPROFILE: homeDir,
    },
  });
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function resolveTemplate(template, projectDir, homeDir, scope) {
  return normalizePath(
    template
      .replace(/\$PROJECT/g, normalizePath(projectDir))
      .replace(/\$HOME/g, normalizePath(homeDir))
      .replace(/\$SCOPE/g, scope)
  );
}

function expectedManifestPath(runtimeKey, scope, projectDir, homeDir) {
  const runtime = RUNTIME_METADATA[runtimeKey];
  const rootDir = scope === 'local' ? projectDir : homeDir;

  if (runtime.storageLayout === 'claude') {
    return path.join(rootDir, '.claude', 'legion', 'manifest.json');
  }

  return path.join(rootDir, '.legion', 'manifest.json');
}

function expectedNativePath(surface, scope, projectDir, homeDir) {
  const template = scope === 'local' ? surface.localPath : surface.globalPath;
  if (!template) return null;
  return resolveTemplate(template, projectDir, homeDir, scope);
}

function expectedNativeFiles(runtimeKey, scope, projectDir, homeDir) {
  const runtime = RUNTIME_METADATA[runtimeKey];
  const expected = [];

  for (const surface of runtime.nativeSurfaces) {
    const surfacePath = expectedNativePath(surface, scope, projectDir, homeDir);
    if (!surfacePath) continue;

    switch (surface.type) {
      case 'codex-prompts':
        expected.push(path.join(surfacePath, 'legion-start.md'));
        expected.push(path.join(surfacePath, 'legion-map.md'));
        expected.push(path.join(surfacePath, 'legion-update.md'));
        break;
      case 'codex-bridge':
      case 'copilot-agent':
      case 'cursor-rule':
      case 'windsurf-rule':
      case 'opencode-agent':
      case 'kiro-agent':
      case 'kiro-steering':
        expected.push(surfacePath);
        break;
      case 'gemini-commands':
        expected.push(path.join(surfacePath, 'start.toml'));
        expected.push(path.join(surfacePath, 'map.toml'));
        expected.push(path.join(surfacePath, 'update.toml'));
        break;
      case 'copilot-skills':
        expected.push(path.join(surfacePath, 'legion-start', 'SKILL.md'));
        expected.push(path.join(surfacePath, 'legion-map', 'SKILL.md'));
        expected.push(path.join(surfacePath, 'legion-update', 'SKILL.md'));
        break;
      case 'opencode-commands':
        expected.push(path.join(surfacePath, 'legion-start.md'));
        expected.push(path.join(surfacePath, 'legion-map.md'));
        expected.push(path.join(surfacePath, 'legion-update.md'));
        break;
      case 'kilo-commands':
        expected.push(path.join(surfacePath, 'legion-start.md'));
        expected.push(path.join(surfacePath, 'legion-map.md'));
        expected.push(path.join(surfacePath, 'legion-plan.md'));
        expected.push(path.join(surfacePath, 'legion-board.md'));
        expected.push(path.join(surfacePath, 'legion-update.md'));
        break;
      case 'kilo-agent':
        expected.push(surfacePath);
        break;
      case 'kilocode-skill':
      case 'kilocode-modes':
        expected.push(surfacePath);
        break;
      case 'kilo-skills':
        expected.push(path.join(surfacePath, 'code-polish', 'SKILL.md'));
        expected.push(path.join(surfacePath, 'workflow-common', 'SKILL.md'));
        expected.push(path.join(surfacePath, 'phase-decomposer', 'SKILL.md'));
        expected.push(path.join(surfacePath, 'board-of-directors', 'SKILL.md'));
        expected.push(path.join(surfacePath, 'wave-executor', 'SKILL.md'));
        break;
      case 'antigravity-plugin':
        expected.push(path.join(surfacePath, 'plugin.json'));
        expected.push(path.join(surfacePath, 'skills', 'code-polish', 'SKILL.md'));
        expected.push(path.join(surfacePath, 'skills', 'workflow-common', 'SKILL.md'));
        expected.push(path.join(surfacePath, 'skills', 'phase-decomposer', 'SKILL.md'));
        expected.push(path.join(surfacePath, 'skills', 'board-of-directors', 'SKILL.md'));
        expected.push(path.join(surfacePath, 'skills', 'wave-executor', 'SKILL.md'));
        break;
      default:
        throw new Error(`Unhandled native surface type in tests: ${surface.type}`);
    }
  }

  return expected;
}

function assertRunOk(result, contextLabel) {
  assert.equal(
    result.status,
    0,
    `${contextLabel} failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
}

function assertRunFailed(result, contextLabel, pattern) {
  assert.notEqual(result.status, 0, `${contextLabel} should have failed`);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, pattern, `${contextLabel} should mention ${pattern}`);
}

function assertManifest(runtimeKey, scope, projectDir, homeDir) {
  const manifestFile = expectedManifestPath(runtimeKey, scope, projectDir, homeDir);
  assert.ok(fs.existsSync(manifestFile), `${runtimeKey}: manifest.json should exist`);
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const runtime = RUNTIME_METADATA[runtimeKey];

  assert.equal(manifest.runtime, runtimeKey, `${runtimeKey}: runtime mismatch in manifest`);
  assert.equal(manifest.scope, scope, `${runtimeKey}: scope mismatch in manifest`);
  assert.equal(manifest.supportTier, runtime.supportTier, `${runtimeKey}: support tier mismatch`);
  assert.equal(manifest.disposition, runtime.disposition, `${runtimeKey}: disposition mismatch`);
  assert.ok(fs.existsSync(manifest.paths.agents), `${runtimeKey}: agents directory missing`);
  assert.ok(fs.existsSync(manifest.paths.commands), `${runtimeKey}: commands directory missing`);
  assert.ok(fs.existsSync(path.join(manifest.paths.commands, 'build.md')), `${runtimeKey}: build.md missing`);
  assert.deepEqual(
    Object.keys(manifest.paths.native || {}).sort(),
    runtime.nativeSurfaces
      .filter((surface) => scope === 'local' ? surface.localPath : surface.globalPath)
      .map((surface) => surface.key)
      .sort(),
    `${runtimeKey}: native surface manifest keys mismatch`
  );

  for (const surface of runtime.nativeSurfaces) {
    const expectedPath = expectedNativePath(surface, scope, projectDir, homeDir);
    if (!expectedPath) continue;
    assert.equal(
      manifest.paths.native[surface.key],
      expectedPath,
      `${runtimeKey}: native surface path mismatch for ${surface.key}`
    );
  }

  return { manifestFile, manifest };
}

function assertKiloCommandUsesSubtask(commandFile) {
  const content = fs.readFileSync(commandFile, 'utf8');
  assert.match(content, /^agent:\s+legion-orchestrator$/m, `${commandFile}: should route through the Legion orchestrator`);
  assert.match(
    content,
    /^subtask:\s+true$/m,
    `${commandFile}: commands routed to the subagent orchestrator must run as subtasks`
  );
}

function assertKiloCodeWorkflow(commandFile) {
  const content = fs.readFileSync(commandFile, 'utf8');
  assert.match(content, /^agent:\s+legion$/m, `${commandFile}: should route through the single Legion mode`);
  assert.doesNotMatch(
    content,
    /^subtask:\s+true$/m,
    `${commandFile}: Kilo Code workflows should use the primary Legion mode, not subtask routing`
  );
  assert.match(
    content,
    /single\s+`Legion`\s+mode bridge/,
    `${commandFile}: should describe the Kilo Code Legion mode bridge`
  );
  assert.match(
    content,
    /\.kilocode\/workflows/,
    `${commandFile}: should document the plugin workflow discovery path`
  );
}

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, 'utf8'));
}

function assertKiloCodeSkill(skillFile, manifestFile) {
  const content = fs.readFileSync(skillFile, 'utf8');
  assert.match(content, /^name:\s+legion$/m, `${skillFile}: should define the legion skill`);
  assert.match(
    content,
    /Route Legion requests and \/legion:\* intents/,
    `${skillFile}: should describe Legion request routing`
  );
  assert.ok(content.includes(manifestFile.split(path.sep).join('/')), `${skillFile}: should reference the install manifest`);
  assert.match(content, /\/legion:board/, `${skillFile}: should map the board workflow`);
  assert.match(content, /\/legion:map/, `${skillFile}: should map the map workflow`);
  assert.match(content, /\/legion:validate/, `${skillFile}: should map the validate workflow`);
  assert.match(content, /native Kilo workflow files/, `${skillFile}: should mention native Kilo workflows`);
}

function assertKiloCodeMode(modeFile, expectedSource) {
  const modes = readYaml(modeFile);
  assert.ok(Array.isArray(modes.customModes), `${modeFile}: customModes should be a list`);
  const legionMode = modes.customModes.find((entry) => entry.slug === 'legion');
  assert.ok(legionMode, `${modeFile}: should contain the Legion custom mode`);
  assert.equal(legionMode.name, 'Legion', `${modeFile}: Legion mode name mismatch`);
  assert.equal(legionMode.source, expectedSource, `${modeFile}: Legion mode source mismatch`);
  assert.deepEqual(legionMode.groups, ['read', 'edit', 'command', 'mcp'], `${modeFile}: Legion mode groups mismatch`);
  assert.equal(legionMode.model, undefined, `${modeFile}: Legion mode must not pin a model`);
}

function assertKiloSkillNameNormalized(skillsDir) {
  const codePolishSkill = path.join(skillsDir, 'code-polish', 'SKILL.md');
  assert.ok(
    fs.existsSync(codePolishSkill),
    `kilo: code-polish skill should be installed at ${codePolishSkill}`
  );
  const content = fs.readFileSync(codePolishSkill, 'utf8');
  assert.match(
    content,
    /^name:\s+code-polish\s*$/m,
    `kilo: code-polish SKILL.md name must be normalized to "code-polish" (Agent Skills spec: lowercase letters/digits/hyphens, must match parent dir)`
  );
  assert.doesNotMatch(
    content,
    /^name:\s+legion:code-polish\s*$/m,
    `kilo: code-polish SKILL.md name must not retain the spec-invalid "legion:" prefix`
  );
}

function assertRepresentativeKiloSkills(skillsDir) {
  const skillNames = [
    'workflow-common',
    'phase-decomposer',
    'board-of-directors',
    'wave-executor',
    'code-polish',
  ];

  for (const skillName of skillNames) {
    const skillPath = path.join(skillsDir, skillName, 'SKILL.md');
    assert.ok(fs.existsSync(skillPath), `expected Kilo skill missing at ${skillPath}`);
    const content = fs.readFileSync(skillPath, 'utf8');
    assert.match(
      content,
      new RegExp(`^name:\\s+${skillName}\\s*$`, 'm'),
      `${skillPath}: skill name should be normalized to its directory name`
    );
  }
}

test('installer lazy-loads YAML support for Kilo Code mode merging', () => {
  const source = fs.readFileSync(INSTALLER, 'utf8');
  const beforeLazyLoader = source.slice(0, source.indexOf('function loadYamlLibrary'));

  assert.doesNotMatch(
    beforeLazyLoader,
    /require\(['"]yaml['"]\)/,
    'installer must not require yaml before basic --help/--version handling can run'
  );
  assert.match(source, /function loadYamlLibrary\(\)/, 'installer should keep YAML loading behind a Kilo Code helper');
});

test('installer local mode installs runtime-native artifacts for every supported runtime', async (t) => {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'legion-local-smoke-'));
  const homeDir = path.join(sandboxRoot, 'home');
  fs.mkdirSync(homeDir, { recursive: true });

  t.after(() => {
    fs.rmSync(sandboxRoot, { recursive: true, force: true });
  });

  for (const runtimeKey of LOCAL_INSTALLABLE_RUNTIMES) {
    await t.test(`${runtimeKey} local install + uninstall`, () => {
      const runtime = RUNTIME_METADATA[runtimeKey];
      const projectDir = path.join(sandboxRoot, `project-${runtimeKey}`);
      fs.mkdirSync(projectDir, { recursive: true });

      const installResult = runInstaller([runtime.flag, '--local'], projectDir, homeDir);
      assertRunOk(installResult, `${runtimeKey} local install`);

      const { manifestFile, manifest } = assertManifest(runtimeKey, 'local', projectDir, homeDir);
      const nativeFiles = expectedNativeFiles(runtimeKey, 'local', projectDir, homeDir);

      if (runtime.nativeSurfaces.length > 0) {
        assert.ok(Array.isArray(manifest.nativeArtifacts), `${runtimeKey}: nativeArtifacts should be recorded`);
        assert.ok(manifest.nativeArtifacts.length >= nativeFiles.length, `${runtimeKey}: nativeArtifacts should include native files`);
      }

      for (const filePath of nativeFiles) {
        assert.ok(fs.existsSync(filePath), `${runtimeKey}: expected native artifact missing at ${filePath}`);
      }
      if (runtimeKey === 'kilo') {
        assertKiloCommandUsesSubtask(path.join(projectDir, '.kilo', 'commands', 'legion-start.md'));
        assertKiloCommandUsesSubtask(path.join(projectDir, '.kilo', 'commands', 'legion-update.md'));
        assertKiloSkillNameNormalized(path.join(projectDir, '.kilo', 'skills'));
      }
      if (runtimeKey === 'kilocode') {
        assertKiloCodeSkill(
          path.join(projectDir, '.kilocode', 'skills', 'legion', 'SKILL.md'),
          manifestFile
        );
        assertKiloCodeSkill(
          path.join(projectDir, '.kilo', 'skills', 'legion', 'SKILL.md'),
          manifestFile
        );
        assertKiloCodeWorkflow(path.join(projectDir, '.kilocode', 'workflows', 'legion-start.md'));
        assertKiloCodeWorkflow(path.join(projectDir, '.kilocode', 'workflows', 'legion-plan.md'));
        assertKiloCodeWorkflow(path.join(projectDir, '.kilocode', 'workflows', 'legion-board.md'));
        assertKiloCodeWorkflow(path.join(projectDir, '.kilocode', 'workflows', 'legion-update.md'));
        assertKiloCodeWorkflow(path.join(projectDir, '.kilo', 'commands', 'legion-start.md'));
        assertKiloCodeWorkflow(path.join(projectDir, '.kilo', 'commands', 'legion-plan.md'));
        assertKiloCodeWorkflow(path.join(projectDir, '.kilo', 'commands', 'legion-board.md'));
        assertKiloCodeWorkflow(path.join(projectDir, '.kilo', 'commands', 'legion-update.md'));
        assertRepresentativeKiloSkills(path.join(projectDir, '.kilocode', 'skills'));
        assertRepresentativeKiloSkills(path.join(projectDir, '.kilo', 'skills'));
        assertKiloCodeMode(path.join(projectDir, '.kilocodemodes'), 'project');
      }

      const uninstallResult = runInstaller([runtime.flag, '--local', '--uninstall'], projectDir, homeDir);
      assertRunOk(uninstallResult, `${runtimeKey} local uninstall`);
      assert.ok(!fs.existsSync(manifestFile), `${runtimeKey}: manifest.json should be removed after uninstall`);
      for (const filePath of nativeFiles) {
        assert.ok(!fs.existsSync(filePath), `${runtimeKey}: native artifact should be removed after uninstall: ${filePath}`);
      }
    });
  }
});

test('installer global mode installs runtime-native artifacts for every globally supported runtime', async (t) => {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'legion-global-smoke-'));
  const homeDir = path.join(sandboxRoot, 'home');
  const projectDir = path.join(sandboxRoot, 'project');
  fs.mkdirSync(homeDir, { recursive: true });
  fs.mkdirSync(projectDir, { recursive: true });

  t.after(() => {
    fs.rmSync(sandboxRoot, { recursive: true, force: true });
  });

  for (const runtimeKey of GLOBAL_INSTALLABLE_RUNTIMES) {
    await t.test(`${runtimeKey} global install + uninstall`, () => {
      const runtime = RUNTIME_METADATA[runtimeKey];

      const installResult = runInstaller([runtime.flag, '--global'], projectDir, homeDir);
      assertRunOk(installResult, `${runtimeKey} global install`);

      const { manifestFile } = assertManifest(runtimeKey, 'global', projectDir, homeDir);
      const nativeFiles = expectedNativeFiles(runtimeKey, 'global', projectDir, homeDir);
      for (const filePath of nativeFiles) {
        assert.ok(fs.existsSync(filePath), `${runtimeKey}: expected global native artifact missing at ${filePath}`);
      }
      if (runtimeKey === 'kilo') {
        assertKiloCommandUsesSubtask(path.join(homeDir, '.config', 'kilo', 'commands', 'legion-start.md'));
        assertKiloCommandUsesSubtask(path.join(homeDir, '.config', 'kilo', 'commands', 'legion-update.md'));
        assertKiloSkillNameNormalized(path.join(homeDir, '.kilo', 'skills'));
      }
      if (runtimeKey === 'kilocode') {
        assertKiloCodeSkill(
          path.join(homeDir, '.kilocode', 'skills', 'legion', 'SKILL.md'),
          manifestFile
        );
        assertKiloCodeSkill(
          path.join(homeDir, '.kilo', 'skills', 'legion', 'SKILL.md'),
          manifestFile
        );
        assertKiloCodeWorkflow(path.join(homeDir, '.kilocode', 'workflows', 'legion-start.md'));
        assertKiloCodeWorkflow(path.join(homeDir, '.kilocode', 'workflows', 'legion-plan.md'));
        assertKiloCodeWorkflow(path.join(homeDir, '.kilocode', 'workflows', 'legion-board.md'));
        assertKiloCodeWorkflow(path.join(homeDir, '.kilocode', 'workflows', 'legion-update.md'));
        assertKiloCodeWorkflow(path.join(homeDir, '.config', 'kilo', 'commands', 'legion-start.md'));
        assertKiloCodeWorkflow(path.join(homeDir, '.config', 'kilo', 'commands', 'legion-plan.md'));
        assertKiloCodeWorkflow(path.join(homeDir, '.config', 'kilo', 'commands', 'legion-board.md'));
        assertKiloCodeWorkflow(path.join(homeDir, '.config', 'kilo', 'commands', 'legion-update.md'));
        assertRepresentativeKiloSkills(path.join(homeDir, '.kilocode', 'skills'));
        assertRepresentativeKiloSkills(path.join(homeDir, '.kilo', 'skills'));
        assertKiloCodeMode(
          path.join(homeDir, '.kilocode', 'globalStorage', 'kilo code.kilo-code', 'settings', 'custom_modes.yaml'),
          'global'
        );
      }

      const uninstallResult = runInstaller([runtime.flag, '--global', '--uninstall'], projectDir, homeDir);
      assertRunOk(uninstallResult, `${runtimeKey} global uninstall`);
      assert.ok(!fs.existsSync(manifestFile), `${runtimeKey}: global manifest.json should be removed after uninstall`);
      for (const filePath of nativeFiles) {
        assert.ok(!fs.existsSync(filePath), `${runtimeKey}: global native artifact should be removed after uninstall: ${filePath}`);
      }
    });
  }
});

test('Kilo Code custom mode merge preserves user modes across install, reinstall, and uninstall', () => {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'legion-kilocode-merge-'));
  const homeDir = path.join(sandboxRoot, 'home');
  const projectDir = path.join(sandboxRoot, 'project');
  const modeFile = path.join(homeDir, '.kilocode', 'globalStorage', 'kilo code.kilo-code', 'settings', 'custom_modes.yaml');
  const skillFile = path.join(homeDir, '.kilocode', 'skills', 'legion', 'SKILL.md');
  const workflowsDir = path.join(homeDir, '.kilocode', 'workflows');
  const skillsDir = path.join(homeDir, '.kilocode', 'skills');
  const cliWorkflowsDir = path.join(homeDir, '.config', 'kilo', 'commands');
  const cliSkillsDir = path.join(homeDir, '.kilo', 'skills');
  const unrelatedWorkflow = path.join(workflowsDir, 'user-workflow.md');
  const unrelatedSkill = path.join(skillsDir, 'user-skill', 'SKILL.md');
  const unrelatedCliWorkflow = path.join(cliWorkflowsDir, 'user-workflow.md');
  const unrelatedCliSkill = path.join(cliSkillsDir, 'user-skill', 'SKILL.md');
  fs.mkdirSync(path.dirname(modeFile), { recursive: true });
  fs.mkdirSync(workflowsDir, { recursive: true });
  fs.mkdirSync(path.dirname(unrelatedSkill), { recursive: true });
  fs.mkdirSync(cliWorkflowsDir, { recursive: true });
  fs.mkdirSync(path.dirname(unrelatedCliSkill), { recursive: true });
  fs.mkdirSync(projectDir, { recursive: true });

  fs.writeFileSync(modeFile, [
    '# User Kilo Code modes',
    'customModes:',
    '  # Preserve this planning note',
    '  - slug: plan-mode',
    '    name: Plan Mode',
    '    description: User planning mode',
    '    groups:',
    '      - read',
    '      - command',
    '    source: global',
    '  # Preserve this simplifier note',
    '  - slug: code-simplifier',
    '    name: Code Simplifier',
    '    description: User simplification mode',
    '    groups:',
    '      - read',
    '      - edit',
    '    source: global',
    '',
  ].join('\n'));
  fs.writeFileSync(unrelatedWorkflow, [
    '---',
    'description: User workflow',
    '---',
    '',
    'Preserve this user workflow.',
    '',
  ].join('\n'));
  fs.writeFileSync(unrelatedSkill, [
    '---',
    'name: user-skill',
    'description: User skill',
    '---',
    '',
    'Preserve this user skill.',
    '',
  ].join('\n'));
  fs.writeFileSync(unrelatedCliWorkflow, [
    '---',
    'description: User CLI-backed workflow',
    '---',
    '',
    'Preserve this user CLI workflow.',
    '',
  ].join('\n'));
  fs.writeFileSync(unrelatedCliSkill, [
    '---',
    'name: user-skill',
    'description: User CLI-backed skill',
    '---',
    '',
    'Preserve this user CLI skill.',
    '',
  ].join('\n'));

  try {
    const installResult = runInstaller(['--kilo-code', '--global'], projectDir, homeDir);
    assertRunOk(installResult, 'kilo-code global install');
    const { manifestFile } = assertManifest('kilocode', 'global', projectDir, homeDir);
    assertKiloCodeSkill(skillFile, manifestFile);
    assertKiloCodeWorkflow(path.join(workflowsDir, 'legion-start.md'));
    assertKiloCodeWorkflow(path.join(workflowsDir, 'legion-board.md'));
    assertRepresentativeKiloSkills(skillsDir);
    assertKiloCodeWorkflow(path.join(cliWorkflowsDir, 'legion-start.md'));
    assertKiloCodeWorkflow(path.join(cliWorkflowsDir, 'legion-board.md'));
    assertRepresentativeKiloSkills(cliSkillsDir);
    assertKiloCodeMode(modeFile, 'global');

    let modes = readYaml(modeFile).customModes;
    assert.equal(modes.filter((entry) => entry.slug === 'legion').length, 1, 'install should add exactly one Legion mode');
    assert.ok(modes.some((entry) => entry.slug === 'plan-mode'), 'install should preserve plan-mode');
    assert.ok(modes.some((entry) => entry.slug === 'code-simplifier'), 'install should preserve code-simplifier');
    let modeText = fs.readFileSync(modeFile, 'utf8');
    assert.match(modeText, /# User Kilo Code modes/, 'install should preserve top-level user comments');
    assert.match(modeText, /# Preserve this planning note/, 'install should preserve comments before existing modes');
    assert.match(modeText, /# Preserve this simplifier note/, 'install should preserve comments between existing modes');
    assert.equal(fs.existsSync(unrelatedWorkflow), true, 'install should preserve unrelated user workflows');
    assert.equal(fs.existsSync(unrelatedSkill), true, 'install should preserve unrelated user skills');
    assert.equal(fs.existsSync(unrelatedCliWorkflow), true, 'install should preserve unrelated CLI-backed user workflows');
    assert.equal(fs.existsSync(unrelatedCliSkill), true, 'install should preserve unrelated CLI-backed user skills');

    const reinstallResult = runInstaller(['--kilocode', '--global'], projectDir, homeDir);
    assertRunOk(reinstallResult, 'kilocode alias global reinstall');
    modes = readYaml(modeFile).customModes;
    assert.equal(modes.filter((entry) => entry.slug === 'legion').length, 1, 'reinstall should upsert, not duplicate');
    assert.ok(modes.some((entry) => entry.slug === 'plan-mode'), 'reinstall should preserve plan-mode');
    assert.ok(modes.some((entry) => entry.slug === 'code-simplifier'), 'reinstall should preserve code-simplifier');
    modeText = fs.readFileSync(modeFile, 'utf8');
    assert.match(modeText, /# User Kilo Code modes/, 'reinstall should preserve top-level user comments');
    assert.match(modeText, /# Preserve this planning note/, 'reinstall should preserve comments before existing modes');
    assert.match(modeText, /# Preserve this simplifier note/, 'reinstall should preserve comments between existing modes');
    assert.equal(fs.existsSync(unrelatedWorkflow), true, 'reinstall should preserve unrelated user workflows');
    assert.equal(fs.existsSync(unrelatedSkill), true, 'reinstall should preserve unrelated user skills');
    assert.equal(fs.existsSync(unrelatedCliWorkflow), true, 'reinstall should preserve unrelated CLI-backed user workflows');
    assert.equal(fs.existsSync(unrelatedCliSkill), true, 'reinstall should preserve unrelated CLI-backed user skills');

    const uninstallResult = runInstaller(['--kilo-code', '--global', '--uninstall'], projectDir, homeDir);
    assertRunOk(uninstallResult, 'kilo-code global uninstall');
    modes = readYaml(modeFile).customModes;
    assert.equal(modes.some((entry) => entry.slug === 'legion'), false, 'uninstall should remove only Legion mode');
    assert.ok(modes.some((entry) => entry.slug === 'plan-mode'), 'uninstall should preserve plan-mode');
    assert.ok(modes.some((entry) => entry.slug === 'code-simplifier'), 'uninstall should preserve code-simplifier');
    modeText = fs.readFileSync(modeFile, 'utf8');
    assert.match(modeText, /# User Kilo Code modes/, 'uninstall should preserve top-level user comments');
    assert.match(modeText, /# Preserve this planning note/, 'uninstall should preserve comments before existing modes');
    assert.match(modeText, /# Preserve this simplifier note/, 'uninstall should preserve comments between existing modes');
    assert.equal(fs.existsSync(skillFile), false, 'uninstall should remove the Legion Kilo Code skill');
    assert.equal(fs.existsSync(path.join(workflowsDir, 'legion-start.md')), false, 'uninstall should remove Legion workflow files');
    assert.equal(fs.existsSync(path.join(workflowsDir, 'legion-board.md')), false, 'uninstall should remove Legion board workflow file');
    assert.equal(fs.existsSync(path.join(skillsDir, 'board-of-directors')), false, 'uninstall should remove Legion skill directories');
    assert.equal(fs.existsSync(path.join(skillsDir, 'wave-executor')), false, 'uninstall should remove Legion skill directories');
    assert.equal(fs.existsSync(path.join(cliWorkflowsDir, 'legion-start.md')), false, 'uninstall should remove Legion CLI-backed workflow files');
    assert.equal(fs.existsSync(path.join(cliWorkflowsDir, 'legion-board.md')), false, 'uninstall should remove Legion CLI-backed board workflow file');
    assert.equal(fs.existsSync(path.join(cliSkillsDir, 'board-of-directors')), false, 'uninstall should remove Legion CLI-backed skill directories');
    assert.equal(fs.existsSync(path.join(cliSkillsDir, 'wave-executor')), false, 'uninstall should remove Legion CLI-backed skill directories');
    assert.equal(fs.existsSync(unrelatedWorkflow), true, 'uninstall should preserve unrelated user workflows');
    assert.equal(fs.existsSync(unrelatedSkill), true, 'uninstall should preserve unrelated user skills');
    assert.equal(fs.existsSync(unrelatedCliWorkflow), true, 'uninstall should preserve unrelated CLI-backed user workflows');
    assert.equal(fs.existsSync(unrelatedCliSkill), true, 'uninstall should preserve unrelated CLI-backed user skills');
  } finally {
    fs.rmSync(sandboxRoot, { recursive: true, force: true });
  }
});

test('Kilo Code global install seeds spaced extension storage from no-space compatibility path', () => {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'legion-kilocode-spaced-path-'));
  const homeDir = path.join(sandboxRoot, 'home');
  const projectDir = path.join(sandboxRoot, 'project');
  const spacedModeFile = path.join(
    homeDir,
    '.kilocode',
    'globalStorage',
    'kilo code.kilo-code',
    'settings',
    'custom_modes.yaml'
  );
  const compatibilityModeFile = path.join(
    homeDir,
    '.kilocode',
    'globalStorage',
    'kilocode.kilo-code',
    'settings',
    'custom_modes.yaml'
  );
  fs.mkdirSync(path.dirname(compatibilityModeFile), { recursive: true });
  fs.mkdirSync(projectDir, { recursive: true });

  fs.writeFileSync(compatibilityModeFile, [
    '# Existing Kilo Code compatibility storage',
    'customModes:',
    '  - slug: project-research',
    '    name: Project Research',
    '    groups:',
    '      - read',
    '    source: global',
    '',
  ].join('\n'));

  try {
    const installResult = runInstaller(['--kilo-code', '--global'], projectDir, homeDir);
    assertRunOk(installResult, 'kilo-code global install with compatibility storage seed');

    const spacedModes = readYaml(spacedModeFile).customModes;
    assert.ok(spacedModes.some((entry) => entry.slug === 'project-research'), 'install should seed existing user modes into the spaced extension path');
    assert.ok(spacedModes.some((entry) => entry.slug === 'legion'), 'install should add Legion to the spaced extension path');
    assert.match(
      fs.readFileSync(spacedModeFile, 'utf8'),
      /# Existing Kilo Code compatibility storage/,
      'compatibility seed should preserve user comments in the spaced extension path'
    );

    const compatibilityModes = readYaml(compatibilityModeFile).customModes;
    assert.deepEqual(
      compatibilityModes.map((entry) => entry.slug),
      ['project-research'],
      'install should not mutate the no-space compatibility path while seeding the spaced extension path'
    );
  } finally {
    fs.rmSync(sandboxRoot, { recursive: true, force: true });
  }
});

test('installer rejects unsupported scope and manual-only runtime installs', () => {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'legion-unsupported-'));
  const homeDir = path.join(sandboxRoot, 'home');
  const projectDir = path.join(sandboxRoot, 'project');
  fs.mkdirSync(homeDir, { recursive: true });
  fs.mkdirSync(projectDir, { recursive: true });

  try {
    assertRunFailed(
      runInstaller(['--cursor', '--global'], projectDir, homeDir),
      'cursor global install',
      /does not support global installs/i
    );
    assertRunFailed(
      runInstaller(['--windsurf', '--global'], projectDir, homeDir),
      'windsurf global install',
      /does not support global installs/i
    );
    assertRunFailed(
      runInstaller(['--aider', '--local'], projectDir, homeDir),
      'aider local install',
      /manual-only/i
    );
  } finally {
    fs.rmSync(sandboxRoot, { recursive: true, force: true });
  }
});

test('deprecated --amazon-q alias installs the Kiro runtime contract', () => {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'legion-kiro-alias-'));
  const homeDir = path.join(sandboxRoot, 'home');
  const projectDir = path.join(sandboxRoot, 'project');
  fs.mkdirSync(homeDir, { recursive: true });
  fs.mkdirSync(projectDir, { recursive: true });

  try {
    const installResult = runInstaller(['--amazon-q', '--local'], projectDir, homeDir);
    assertRunOk(installResult, 'amazon-q alias local install');

    const { manifestFile, manifest } = assertManifest('kiro', 'local', projectDir, homeDir);
    assert.equal(manifest.runtime, 'kiro', 'amazon-q alias should write kiro runtime in manifest');
    assert.ok(fs.existsSync(path.join(projectDir, '.kiro', 'agents', 'legion-orchestrator.md')), 'kiro custom agent should exist');

    const uninstallResult = runInstaller(['--kiro', '--local', '--uninstall'], projectDir, homeDir);
    assertRunOk(uninstallResult, 'kiro uninstall after amazon-q alias install');
    assert.ok(!fs.existsSync(manifestFile), 'kiro manifest should be removed after uninstall');
  } finally {
    fs.rmSync(sandboxRoot, { recursive: true, force: true });
  }
});

test('installer --verify validates checksums in local source installs', () => {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'legion-verify-'));
  const homeDir = path.join(sandboxRoot, 'home');
  const projectDir = path.join(sandboxRoot, 'project');
  fs.mkdirSync(homeDir, { recursive: true });
  fs.mkdirSync(projectDir, { recursive: true });

  try {
    const installResult = runInstaller(['--codex', '--local', '--verify'], projectDir, homeDir);
    assertRunOk(installResult, 'codex install --verify');
    assert.match(installResult.stdout, /Integrity verification passed/, 'verify output should confirm checksum validation');
  } finally {
    fs.rmSync(sandboxRoot, { recursive: true, force: true });
  }
});
