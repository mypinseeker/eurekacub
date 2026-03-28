/**
 * Content Validation Script for EurekaCub
 *
 * Validates all JSON content files against schemas, checks for forbidden words,
 * and enforces education rules.
 *
 * Usage: npx tsx scripts/validate-content.ts
 */

import Ajv from "ajv";
import addFormats from "ajv-formats";
import * as fs from "node:fs";
import * as path from "node:path";

// ── Constants ────────────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content");
const SCHEMA_DIR = path.join(CONTENT_DIR, "schema");

const FORBIDDEN_WORDS = [
  "太笨",
  "太蠢",
  "stupid",
  "dumb",
  "错了",
  "wrong",
  "快点",
  "hurry",
  "排名",
  "rank",
  "http://",
  "www.",
];

// Advanced concepts that L1 Explorer puzzles should not reference
const ADVANCED_CONCEPTS = [
  "derivative",
  "integral",
  "calculus",
  "matrix",
  "determinant",
  "eigenvalue",
  "polynomial",
  "quadratic",
  "logarithm",
  "trigonometry",
  "微积分",
  "导数",
  "积分",
  "矩阵",
  "行列式",
  "特征值",
  "多项式",
  "二次方程",
  "对数",
  "三角函数",
];

// ── Types ────────────────────────────────────────────────────────────────────

interface ValidationError {
  file: string;
  issue: string;
  suggestion: string;
}

// ── Schema Loading ───────────────────────────────────────────────────────────

function loadSchema(name: string): object {
  const filePath = path.join(SCHEMA_DIR, name);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

// ── File Discovery ───────────────────────────────────────────────────────────

function findJsonFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip schema directory
      if (entry.name === "schema") continue;
      results.push(...findJsonFiles(fullPath));
    } else if (entry.name.endsWith(".json")) {
      results.push(fullPath);
    }
  }
  return results;
}

// ── Determine Schema for a File ─────────────────────────────────────────────

function getSchemaName(filePath: string): string | null {
  const rel = path.relative(CONTENT_DIR, filePath);
  if (rel.startsWith("puzzles")) return "puzzle.schema.json";
  if (rel.startsWith("adventures")) return "adventure.schema.json";
  if (rel.startsWith("feedback")) return "feedback.schema.json";
  return null;
}

// ── Deep Text Extraction ─────────────────────────────────────────────────────

function extractAllStrings(obj: unknown): string[] {
  const strings: string[] = [];
  if (typeof obj === "string") {
    strings.push(obj);
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      strings.push(...extractAllStrings(item));
    }
  } else if (obj !== null && typeof obj === "object") {
    for (const value of Object.values(obj as Record<string, unknown>)) {
      strings.push(...extractAllStrings(value));
    }
  }
  return strings;
}

// ── Validators ───────────────────────────────────────────────────────────────

function checkForbiddenWords(
  filePath: string,
  data: unknown
): ValidationError[] {
  const errors: ValidationError[] = [];
  const allText = extractAllStrings(data);
  const combined = allText.join(" ").toLowerCase();

  for (const word of FORBIDDEN_WORDS) {
    if (combined.includes(word.toLowerCase())) {
      errors.push({
        file: filePath,
        issue: `Forbidden word/phrase found: "${word}"`,
        suggestion: `Remove or replace "${word}" with encouraging, child-friendly language`,
      });
    }
  }
  return errors;
}

function checkEducationRules(
  filePath: string,
  data: unknown
): ValidationError[] {
  const errors: ValidationError[] = [];
  const obj = data as Record<string, unknown>;

  // Check hints >= 2 for puzzle files
  if (Array.isArray(obj.hints)) {
    if (obj.hints.length < 2) {
      errors.push({
        file: filePath,
        issue: `Puzzle has only ${obj.hints.length} hint(s), minimum is 2`,
        suggestion:
          "Add more hints to guide the child progressively toward the solution",
      });
    }
  }

  // Check for timer/ranking concepts in all text
  const allText = extractAllStrings(data).join(" ").toLowerCase();
  const timerKeywords = [
    "timer",
    "countdown",
    "time limit",
    "计时",
    "倒计时",
    "限时",
  ];
  for (const kw of timerKeywords) {
    if (allText.includes(kw)) {
      errors.push({
        file: filePath,
        issue: `Timer/pressure concept found: "${kw}"`,
        suggestion:
          "Remove time-pressure elements. EurekaCub emphasizes exploration, not speed",
      });
    }
  }

  const rankingKeywords = [
    "leaderboard",
    "排行榜",
    "score ranking",
    "分数排名",
    "compete",
    "竞争",
  ];
  for (const kw of rankingKeywords) {
    if (allText.includes(kw)) {
      errors.push({
        file: filePath,
        issue: `Ranking/competition concept found: "${kw}"`,
        suggestion:
          "Remove competitive elements. Focus on personal growth and discovery",
      });
    }
  }

  return errors;
}

function checkAgeAppropriateness(
  filePath: string,
  data: unknown
): ValidationError[] {
  const errors: ValidationError[] = [];
  const obj = data as Record<string, unknown>;

  // Only check L1 puzzles
  if (obj.level !== "L1") return errors;

  const allText = extractAllStrings(data).join(" ").toLowerCase();

  for (const concept of ADVANCED_CONCEPTS) {
    if (allText.includes(concept.toLowerCase())) {
      errors.push({
        file: filePath,
        issue: `L1 (Explorer, age 5-7) puzzle references advanced concept: "${concept}"`,
        suggestion: `Remove or simplify. L1 puzzles should use concrete, tangible concepts (shapes, counting, sharing)`,
      });
    }
  }

  return errors;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  console.log("🔍 EurekaCub Content Validator\n");

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  // Load schemas
  const schemas: Record<string, ReturnType<typeof ajv.compile>> = {};
  const schemaFiles = ["puzzle.schema.json", "adventure.schema.json", "feedback.schema.json"];

  for (const sf of schemaFiles) {
    const schemaPath = path.join(SCHEMA_DIR, sf);
    if (fs.existsSync(schemaPath)) {
      const schemaData = loadSchema(sf);
      schemas[sf] = ajv.compile(schemaData);
      console.log(`  Schema loaded: ${sf}`);
    } else {
      console.log(`  Schema missing: ${sf} (skipped)`);
    }
  }

  console.log("");

  // Find all content JSON files
  const jsonFiles = findJsonFiles(CONTENT_DIR);
  if (jsonFiles.length === 0) {
    console.log("No content JSON files found.");
    process.exit(0);
  }

  console.log(`Found ${jsonFiles.length} content file(s) to validate.\n`);

  const allErrors: ValidationError[] = [];
  let filesChecked = 0;
  let filesPassed = 0;

  for (const filePath of jsonFiles) {
    filesChecked++;
    const rel = path.relative(ROOT, filePath);
    const fileErrors: ValidationError[] = [];

    // Parse JSON
    let data: unknown;
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      data = JSON.parse(raw);
    } catch (e) {
      fileErrors.push({
        file: rel,
        issue: `Invalid JSON: ${(e as Error).message}`,
        suggestion: "Fix the JSON syntax error",
      });
      allErrors.push(...fileErrors);
      continue;
    }

    // Schema validation
    const schemaName = getSchemaName(filePath);
    if (schemaName && schemas[schemaName]) {
      const validate = schemas[schemaName];
      const valid = validate(data);
      if (!valid && validate.errors) {
        for (const err of validate.errors) {
          fileErrors.push({
            file: rel,
            issue: `Schema: ${err.instancePath || "/"} ${err.message}`,
            suggestion: `Fix the ${err.keyword} error at ${err.instancePath || "root"}`,
          });
        }
      }
    }

    // Forbidden words
    fileErrors.push(...checkForbiddenWords(rel, data));

    // Education rules
    fileErrors.push(...checkEducationRules(rel, data));

    // Age-appropriateness
    fileErrors.push(...checkAgeAppropriateness(rel, data));

    if (fileErrors.length === 0) {
      console.log(`  ✅ ${rel}`);
      filesPassed++;
    } else {
      console.log(`  ❌ ${rel}`);
      for (const err of fileErrors) {
        console.log(`     ├─ Issue: ${err.issue}`);
        console.log(`     └─ Fix:   ${err.suggestion}`);
      }
      allErrors.push(...fileErrors);
    }
  }

  // Summary
  console.log("\n" + "─".repeat(60));
  console.log(
    `Results: ${filesPassed}/${filesChecked} files passed, ${allErrors.length} issue(s) found`
  );

  if (allErrors.length > 0) {
    console.log("\nValidation FAILED. Fix the issues above and re-run.");
    process.exit(1);
  } else {
    console.log("\nAll content validated successfully!");
    process.exit(0);
  }
}

main();
