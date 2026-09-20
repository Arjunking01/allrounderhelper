import { Activity } from 'lucide-react';
import { SoftCard } from '@/components/ui/Card';
import { getActiveProvider } from '../logic/providerRegistry';
import { conversationStats } from '../logic/useConversations';
import type { AISettings, Conversation } from '../logic/aiTypes';

export function AiStatusPanel({ settings, conversation }: { settings: AISettings; conversation: Conversation | null }) {
  const provider = getActiveProvider(settings);
  const configured = provider.isConfigured(settings);
  const stats = conversation ? conversationStats(conversation) : null;

  const rows: { label: string; value: string }[] = [
    { label: 'Provider', value: provider.name },
    { label: 'Connection', value: configured ? 'Configured' : 'Not connected' },
    { label: 'Model', value: settings.model || '—' },
    { label: 'Streaming support', value: provider.capabilities.streaming ? 'Yes' : 'No' },
    { label: 'Vision support', value: provider.capabilities.vision ? 'Yes' : 'No' },
    { label: 'Context window', value: provider.capabilities.maxContextTokens ? `${provider.capabilities.maxContextTokens.toLocaleString()} tokens` : '—' },
    { label: 'Temperature', value: settings.temperature.toFixed(1) },
    { label: 'Conversation size', value: stats ? `${stats.messageCount} messages` : '0 messages' },
    { label: 'Estimated tokens used', value: stats ? `~${stats.estimatedTokens.toLocaleString()}` : '~0' },
  ];

  return (
    <SoftCard>
      <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3"><Activity size={13} /> AI status</h3>
      <dl className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-xs">
            <dt className="text-navy-500 dark:text-ink-500">{r.label}</dt>
            <dd className="font-medium text-navy-700 dark:text-ink-300">{r.value}</dd>
          </div>
        ))}
      </dl>
    </SoftCard>
  );
}
