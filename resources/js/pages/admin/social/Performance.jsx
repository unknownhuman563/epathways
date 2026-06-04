import { Head } from '@inertiajs/react';
import { BarChart3 } from 'lucide-react';
import SocialLayout from '@/pages/admin/social/SocialLayout';

export default function PerformancePage() {
  return (
    <SocialLayout>
      <Head title="Performance · Social" />
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-10 sm:p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-6">
          <BarChart3 size={24} className="text-gray-700" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Performance dashboard</h2>
        <p className="text-sm text-gray-700 max-w-xs mx-auto leading-relaxed">Coming soon: ad performance joined with your lead data.</p>
      </div>
    </SocialLayout>
  );
}
