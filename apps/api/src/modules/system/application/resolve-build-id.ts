// Roadmap 01 open decision: the build id the API reports must identify the
// running build, not the moment the first migration ran. So the environment's
// BUILD_ID wins, and the seeded server_meta.build_id column is the fallback for
// a bare local run where BUILD_ID was left at its default.
export function resolveBuildId(
  envBuildId: string | undefined,
  seededBuildId: string,
): string {
  return envBuildId && envBuildId !== 'dev' ? envBuildId : seededBuildId;
}
