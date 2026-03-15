import "server-only";

const OWNER = process.env.GITHUB_REPO_OWNER!;
const REPO = process.env.GITHUB_REPO_NAME!;
const PAT = process.env.GITHUB_PAT!;

export interface ReportStats {
  placed: number;
  optPlacement: number;
  placementPercent: string;
  totalCompanies: number;
  medianCtc: string;
}

export interface ReportEntry {
  id: string;
  timestamp: string;
  filename: string;
  flags: string[];
  spreadsheetId: string | null;
  stats: ReportStats;
}

export function getPdfDownloadUrl(filename: string): string {
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/reports/${filename}`;
}

export async function fetchReportsIndex(): Promise<ReportEntry[]> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/index.json?ref=reports`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${PAT}`,
      Accept: "application/vnd.github.raw+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Failed to fetch reports index: ${res.status}`);

  return res.json() as Promise<ReportEntry[]>;
}
