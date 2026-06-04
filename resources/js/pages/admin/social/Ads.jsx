import { Head } from '@inertiajs/react';
import { Megaphone } from 'lucide-react';
import SocialLayout from '@/pages/admin/social/SocialLayout';

export default function AdsPage() {
  return (
    <SocialLayout>
      <Head title="Ads · Social" />
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-10 sm:p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-6">
          <Megaphone size={24} className="text-gray-700" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Ads manager</h2>
        <p className="text-sm text-gray-700 max-w-xs mx-auto leading-relaxed">Coming soon: campaign manager, audiences, and lead forms.</p>
      </div>
    </SocialLayout>
  );
}
