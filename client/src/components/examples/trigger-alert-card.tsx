import { TriggerAlertCard } from "../trigger-alert-card";

export default function TriggerAlertCardExample() {
  return (
    <div className="space-y-4 p-4 max-w-2xl">
      <TriggerAlertCard
        type="lawsuit"
        title="Competitor sued"
        description="AirBnb sued for $450K (same violations as 3 of your prospects)"
        primaryAction="Launch Emergency Cadence"
        emoji="🚨"
      />
      <TriggerAlertCard
        type="redesign"
        title="TechCorp.com"
        description="Violations increased from 42 → 67 after redesign"
        primaryAction="Send Audit"
        emoji="🔄"
      />
      <TriggerAlertCard
        type="funding"
        title="StartupX ($15M Series A)"
        description="Budget now available for accessibility compliance"
        primaryAction="Upgrade to High Priority"
        emoji="💰"
      />
    </div>
  );
}
