import fs from "fs";
import path from "path";

type StandardToClusterMap = Record<string, string>;

let standardToClusterCache: StandardToClusterMap | null | undefined;
let clusterToStandardsCache: Map<string, string[]> | null | undefined;

function getCandidateMapPaths() {
  return [
    path.resolve(process.cwd(), "../kg-service/data/standard_to_cluster.json"),
    path.resolve(process.cwd(), "kg-service/data/standard_to_cluster.json"),
    path.resolve(process.cwd(), "../../kg-service/data/standard_to_cluster.json"),
  ];
}

function loadStandardToClusterMap(): StandardToClusterMap | null {
  if (standardToClusterCache !== undefined) {
    return standardToClusterCache;
  }

  for (const candidate of getCandidateMapPaths()) {
    if (!fs.existsSync(candidate)) continue;

    standardToClusterCache = JSON.parse(
      fs.readFileSync(candidate, "utf8"),
    ) as StandardToClusterMap;
    return standardToClusterCache;
  }

  standardToClusterCache = null;
  return standardToClusterCache;
}

export function getClusterKeysForStandards(standardCodes: string[]) {
  const mapping = loadStandardToClusterMap();
  const byCluster = new Map<string, string[]>();

  if (!mapping) return byCluster;

  for (const code of standardCodes) {
    const clusterKey = mapping[code];
    if (!clusterKey) continue;

    const existing = byCluster.get(clusterKey) ?? [];
    if (!existing.includes(code)) existing.push(code);
    byCluster.set(clusterKey, existing);
  }

  return byCluster;
}

export function getStandardCodesForCluster(clusterKey: string) {
  if (clusterToStandardsCache === undefined) {
    const mapping = loadStandardToClusterMap();
    const byCluster = new Map<string, string[]>();

    if (mapping) {
      for (const [standardCode, key] of Object.entries(mapping)) {
        const existing = byCluster.get(key) ?? [];
        existing.push(standardCode);
        byCluster.set(key, existing);
      }
    }

    clusterToStandardsCache = byCluster;
  }

  return clusterToStandardsCache?.get(clusterKey) ?? [];
}
