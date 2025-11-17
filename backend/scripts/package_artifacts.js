const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
require('dotenv').config();

const workspace = path.resolve(__dirname, '..');
const artifactsDir = path.join(workspace, 'artifacts');
if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outName = `eventhub_artifacts_${timestamp}.zip`;
const outPath = path.join(artifactsDir, outName);

const filesToInclude = [
    'email_audit_result.json',
    'qa_test_results.json'
];

// include any email snapshot files
const snapshots = fs.readdirSync(workspace).filter(f => f.startsWith('emails_sent_snapshot_') && f.endsWith('.json'));
snapshots.forEach(s => filesToInclude.push(s));

const output = fs.createWriteStream(outPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', function () {
    console.log(archive.pointer() + ' total bytes');
    console.log('Artifacts written to', outPath);
    // write a short report
    const report = {
        createdAt: new Date().toISOString(),
        artifact: outName,
        included: filesToInclude.filter(f => fs.existsSync(path.join(workspace, f)))
    };
    fs.writeFileSync(path.join(artifactsDir, 'ARTIFACT_REPORT.md'), `# Artifacts Report\n\n- Created: ${report.createdAt}\n- Artifact: ${report.artifact}\n- Files included:\n${report.included.map(f => `  - ${f}`).join('\n')}\n`);
    console.log('Report written to', path.join(artifactsDir, 'ARTIFACT_REPORT.md'));
});

archive.on('error', function (err) {
    throw err;
});

archive.pipe(output);

filesToInclude.forEach((fname) => {
    const fpath = path.join(workspace, fname);
    if (fs.existsSync(fpath)) {
        archive.file(fpath, { name: path.basename(fpath) });
    }
});

archive.finalize();
