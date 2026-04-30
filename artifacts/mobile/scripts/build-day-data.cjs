#!/usr/bin/env node
/* eslint-disable */
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");

const XLSX_PATH = path.join(__dirname, "..", "assets", "AUM_MASTER.xlsx");
const OUT_PATH = path.join(__dirname, "..", "src", "data", "dayData.json");

const ROW = {
  HEADER: 0,
  PILLAR: 1,
  TOPIC: 2,
  BRIEFING_S1: 3,
  BRIEFING_S2: 4,
  BRIEFING_S3: 5,
  STRESS: 6,
  MASTERCLASS: 7,
  TITAN_NAME: 8,
  TITAN_BIO: 9,
  PLAYBOOK: 10,
  DIAGNOSTIC: 11,
  MOMENTUM: 12,
  BOURSE: 13,
  STERLING: 14,
};

function s(v) {
  return String(v == null ? "" : v).replace(/\r/g, "").trim();
}

function youtubeId(url) {
  if (!url) return "";
  const m =
    url.match(/[?&]v=([\w-]{11})/) ||
    url.match(/youtu\.be\/([\w-]{11})/) ||
    url.match(/embed\/([\w-]{11})/);
  return m ? m[1] : "";
}

function stripMarkers(text) {
  // Match [CORRECT], [CORRECT — anything], [WRONG — anything],
  // [PARTIALLY CORRECT — anything], etc.
  return text.replace(/\s*\[(?:CORRECT|WRONG|PARTIALLY)[^\]]*\]/gi, "").trim();
}

function parseQuestionBlock(raw) {
  const text = s(raw);
  if (!text) {
    return {
      question: "",
      scenario: "",
      options: { A: "", B: "", C: "", D: "" },
      correct: null,
      sterlingCorrect: "",
      sterlingWrong: "",
    };
  }

  const lines = text.split(/\n/);
  const headerLines = [];
  const scenarioLines = [];
  const questionLines = [];
  const options = { A: "", B: "", C: "", D: "" };
  let correct = null;
  let sterlingCorrect = "";
  let sterlingWrong = "";

  let mode = "header";
  let currentOption = null;
  let foundQuestionMarker = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // SCENARIO marker: capture the situational briefing that precedes
    // the QUESTION (used by Diagnostic blocks). Recognises three forms:
    //   "SCENARIO: <text>"
    //   "SCENARIO — <TITLE>: <text>"   (e.g. "SCENARIO — GRAND SYNTHESIS:")
    //   "DIAGNOSTIC SCENARIO — DAY N"  (heading; body on following lines)
    const scMatch = trimmed.match(/^(?:DIAGNOSTIC\s+)?SCENARIO(?:\s*[—:\-]\s*(.*))?$/i);
    if (scMatch) {
      mode = "scenario";
      let after = (scMatch[1] || "").trim();
      // Strip an inner ALL-CAPS title segment like "GRAND SYNTHESIS CASE STUDY:"
      const titleStrip = after.match(/^[A-Z][A-Z\s\-—]{2,}:\s*(.*)$/);
      if (titleStrip) after = titleStrip[1].trim();
      // Only push if it's substantive prose (contains lowercase) — avoids
      // pushing labels like "DAY 28" or "THE FINAL EXAMINATION".
      if (after && /[a-z]/.test(after)) scenarioLines.push(after);
      continue;
    }

    const optMatch = trimmed.match(/^([A-D])\)\s*(.*)$/);
    if (optMatch) {
      currentOption = optMatch[1];
      let optText = optMatch[2];
      // Only flag inline [CORRECT...] as the correct answer once.
      // Skip [PARTIALLY CORRECT ...] and only take the first match per question.
      if (
        correct == null &&
        /\[CORRECT(?:\b|\s|—|-)/i.test(optText) &&
        !/\[PARTIALLY/i.test(optText)
      ) {
        correct = currentOption;
      }
      options[currentOption] = stripMarkers(optText);
      mode = "option";
      continue;
    }

    const correctMatch = trimmed.match(/^CORRECT:\s*([A-D])\b/i);
    if (correctMatch) {
      correct = correctMatch[1].toUpperCase();
      mode = "meta";
      continue;
    }

    if (/^STERLING[\s_]CORRECT:/i.test(trimmed)) {
      mode = "sterling-correct";
      sterlingCorrect = trimmed.replace(/^STERLING[\s_]CORRECT:\s*/i, "");
      continue;
    }
    if (/^STERLING[\s_]WRONG:/i.test(trimmed)) {
      mode = "sterling-wrong";
      sterlingWrong = trimmed.replace(/^STERLING[\s_]WRONG:\s*/i, "");
      continue;
    }
    if (/^STERLING[\s_]SILLY/i.test(trimmed)) {
      mode = "sterling-silly";
      continue;
    }
    if (/^DIAGNOSIS:/i.test(trimmed)) {
      mode = "sterling-correct";
      sterlingCorrect = trimmed.replace(/^DIAGNOSIS:\s*/i, "");
      continue;
    }
    if (/^PLAYBOOK ACTIVAT(?:ED|ION):/i.test(trimmed)) {
      mode = "sterling-correct";
      sterlingCorrect = trimmed.replace(/^PLAYBOOK ACTIVAT(?:ED|ION):\s*/i, "");
      continue;
    }

    if (
      (mode === "header" || mode === "scenario") &&
      /^(QUESTION|Question|The question)[:\s]/.test(trimmed)
    ) {
      foundQuestionMarker = true;
      mode = "question";
      const after = trimmed.replace(
        /^(QUESTION|Question|The question)[:\s]+/,
        "",
      );
      if (after) questionLines.push(after);
      continue;
    }

    if (mode === "header") {
      if (trimmed) headerLines.push(line);
    } else if (mode === "scenario") {
      scenarioLines.push(line);
    } else if (mode === "question") {
      questionLines.push(line);
    } else if (mode === "option" && currentOption) {
      if (trimmed) {
        const cleaned = stripMarkers(line);
        if (cleaned) options[currentOption] += " " + cleaned;
      }
    } else if (mode === "sterling-correct") {
      sterlingCorrect += "\n" + line;
    } else if (mode === "sterling-wrong") {
      sterlingWrong += "\n" + line;
    }
  }

  let question = questionLines.join("\n").trim();
  if (!foundQuestionMarker) {
    // No QUESTION: marker — use the body that came before options.
    // Drop a single leading title line (e.g. "STRESS TEST — DAY 1: ...").
    const merged = headerLines.join("\n").trim();
    const parts = merged.split(/\n\n+/);
    if (parts.length > 1) {
      question = parts.slice(1).join("\n\n").trim();
    } else {
      question = merged;
    }
  }

  const hasQuiz = !!correct && !!options.A && !!options.B;
  const scenario = scenarioLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return {
    question: question.trim(),
    scenario,
    options,
    correct,
    sterlingCorrect: sterlingCorrect.trim(),
    sterlingWrong: sterlingWrong.trim(),
    hasQuiz,
    rawText: text,
  };
}

function parseTitanBio(raw) {
  const text = s(raw);
  if (!text) return { title: "", bio: "", lesson: "" };
  // Format: "Name (years) | Title | Bio | KEY LESSON: ..."
  const parts = text.split(/\s*\|\s*/);
  let title = "";
  let bio = "";
  let lesson = "";
  if (parts.length >= 2) {
    // First part often "Name (years)"; second part is the title
    title = parts[1] || "";
    const rest = parts.slice(2);
    for (const p of rest) {
      if (/^KEY LESSON:/i.test(p)) {
        lesson = p.replace(/^KEY LESSON:\s*/i, "").trim();
      } else {
        bio += (bio ? " " : "") + p.trim();
      }
    }
  } else {
    bio = text;
  }
  return { title: title.trim(), bio: bio.trim(), lesson: lesson.trim() };
}

function parseBourseParams(raw) {
  const text = s(raw);
  if (!text) return null;
  const obj = JSON.parse(text);
  // Normalize to a stable shape
  const assetsObj = obj.asset_rules || obj.assets_rules || obj.assets || {};
  const assets = Array.isArray(assetsObj)
    ? assetsObj.map((a) => ({
        name: a.name,
        drift: Number(a.drift) || 0,
        volatility: Number(a.volatility) || 0,
        label: a.label || "",
      }))
    : Object.entries(assetsObj).map(([name, v]) => ({
        name,
        drift: Number(v.drift) || 0,
        volatility: Number(v.volatility) || 0,
        label: v.label || "",
      }));
  const optimal = obj.optimal_allocation || obj.optimalAllocation || {};
  return {
    env: obj.env || "Environment",
    label: obj.label || obj.env || "Market Environment",
    description: obj.description || "",
    assets,
    optimalAllocation: optimal,
    winThreshold:
      typeof obj.winThreshold === "number" ? obj.winThreshold : 0,
    winCondition: obj.win_condition || obj.winCondition || "P&L > 0",
    sterlingWin: obj.sterling_win || obj.sterlingWin || "",
    sterlingLoss: obj.sterling_loss || obj.sterlingLoss || "",
  };
}

function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    throw new Error("Excel file not found at " + XLSX_PATH);
  }
  const wb = XLSX.readFile(XLSX_PATH);
  // The data sheet is named 'Sheet2' in the source workbook.
  const sheetName = wb.SheetNames.includes("Sheet2")
    ? "Sheet2"
    : wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const days = [];
  const issues = [];
  // Iterate columns starting from 1; include any column with a non-empty Topic.
  const maxCol = Math.max(...raw.map((r) => (r ? r.length : 0)));
  for (let col = 1; col < maxCol; col++) {
    const topic = s(raw[ROW.TOPIC] && raw[ROW.TOPIC][col]);
    if (!topic) continue;

    const get = (r) => s(raw[r] && raw[r][col]);
    const dayNumber = days.length + 1;

    let bourseParams;
    try {
      bourseParams = parseBourseParams(get(ROW.BOURSE));
    } catch (err) {
      issues.push("Day " + dayNumber + " bourseParams: " + err.message);
      bourseParams = null;
    }

    const stress = parseQuestionBlock(get(ROW.STRESS));
    const diagnostic = parseQuestionBlock(get(ROW.DIAGNOSTIC));
    const momentum = parseQuestionBlock(get(ROW.MOMENTUM));

    if (!stress.hasQuiz)
      issues.push("Day " + dayNumber + " Stress: no quiz parsed");
    if (!diagnostic.hasQuiz)
      issues.push("Day " + dayNumber + " Diagnostic: no quiz parsed");
    if (!bourseParams)
      issues.push("Day " + dayNumber + " Bourse: missing JSON");
    // Note: Momentum may be narrative-only on later days — that's OK.

    const titan = parseTitanBio(get(ROW.TITAN_BIO));
    const masterclassUrl = get(ROW.MASTERCLASS);

    days.push({
      dayNumber,
      pillar: get(ROW.PILLAR),
      topic,
      briefing: [
        get(ROW.BRIEFING_S1),
        get(ROW.BRIEFING_S2),
        get(ROW.BRIEFING_S3),
      ],
      masterclassUrl,
      masterclassYouTubeId: youtubeId(masterclassUrl),
      titanName: get(ROW.TITAN_NAME),
      titanTitle: titan.title,
      titanBio: titan.bio,
      titanLesson: titan.lesson,
      titanPlaybook: get(ROW.PLAYBOOK),
      stress,
      diagnostic,
      momentum,
      sterlingMemo: get(ROW.STERLING),
      bourseParams,
    });
  }

  if (!fs.existsSync(path.dirname(OUT_PATH))) {
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  }

  // Brand rename: "Residency" → "Mandate" (case-preserved). The Excel
  // source still uses the legacy "Residency" wording in many places
  // (Sterling correspondence, slide bodies, Bourse copy), so we apply
  // the substitution at write-time to keep the regenerated JSON aligned
  // with the rest of the app.
  let json = JSON.stringify(days, null, 2);
  json = json.replace(/RESIDENCY/g, "MANDATE").replace(/Residency/g, "Mandate");
  fs.writeFileSync(OUT_PATH, json);

  console.log("Parsed " + days.length + " days from " + sheetName);
  console.log("Wrote " + OUT_PATH);
  if (issues.length) {
    console.log("\nWARNINGS:");
    issues.forEach((i) => console.log("  - " + i));
  } else {
    console.log("All days parsed cleanly.");
  }

  // Summary checks
  const env = {};
  for (const d of days) {
    if (d.bourseParams) env[d.bourseParams.env] = (env[d.bourseParams.env] || 0) + 1;
  }
  console.log("\nBourse environments:");
  Object.entries(env).forEach(([k, v]) => console.log("  " + k + ": " + v));
}

main();
