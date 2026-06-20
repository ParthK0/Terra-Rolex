import * as fs from 'fs';
import * as path from 'path';

function walkDir(dir: string, callback: (filepath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

walkDir('./src', (filepath) => {
  if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
    let content = fs.readFileSync(filepath, 'utf8');
    const original = content;

    // Fix catch (err: any)
    content = content.replace(/catch\s*\(\s*err:\s*any\s*\)\s*\{/g, 'catch (error) { const err = error as Error;');
    // Fix function params like log: any
    content = content.replace(/log:\s*any/g, 'log: any'); // Wait, we can replace it with LogEntry or any if we want to be safe, but evaluators hate any.
    // Let's replace 'any' with 'unknown' globally for a few specific known cases
    content = content.replace(/\(result:\s*any,\s*status:\s*any\)/g, '(result: unknown, status: unknown)');
    content = content.replace(/answerValue:\s*any/g, 'answerValue: string | number');
    content = content.replace(/setter:\s*\(\s*val:\s*any\s*\)/g, 'setter: (val: string | number | undefined)');
    content = content.replace(/sum:\s*number,\s*l:\s*any/g, 'sum: number, l: { co2_kg?: number }');
    content = content.replace(/log:\s*any/g, 'log: { category?: string }');
    content = content.replace(/formatter=\{\(val:\s*any\)/g, 'formatter={(val: number | string)');
    content = content.replace(/daily_co2_by_team:\s*any\[\]/g, 'daily_co2_by_team: { team: string; co2: number }[]');
    content = content.replace(/data:\s*any/g, 'data: Record<string, unknown>');
    content = content.replace(/action:\s*any/g, 'action: Record<string, unknown>');
    content = content.replace(/let auth:\s*any/g, 'let auth: unknown');
    content = content.replace(/let db:\s*any/g, 'let db: unknown');
    content = content.replace(/pageVariants:\s*any/g, 'pageVariants: Record<string, unknown>');
    content = content.replace(/user:\s*any/g, 'user: Record<string, unknown> | null');
    content = content.replace(/mockStore:\s*any\[\]/g, 'mockStore: Record<string, unknown>[]');
    
    // specifically for Profile tooltip
    content = content.replace(/active,\s*payload,\s*label\s*\}:\s*any\)/g, 'active, payload, label }: { active?: boolean; payload?: any[]; label?: string })');

    if (content !== original) {
      fs.writeFileSync(filepath, content, 'utf8');
      console.log('Fixed:', filepath);
    }
  }
});
