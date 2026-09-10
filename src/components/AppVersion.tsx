import packageJson from "../../package.json";

export function AppVersion() {
  return (
    <div className="text-xs text-muted-foreground">
      WMS v{packageJson.version}
    </div>
  );
}