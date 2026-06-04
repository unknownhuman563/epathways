import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { toast } from 'sonner';
import SocialLayout from '@/pages/admin/social/SocialLayout';
import { social } from '@/services/social';
import SchedulerSection from '@/components/social/SchedulerSection';

export default function Scheduled() {
    const [posts, setPosts] = useState(null);

    useEffect(() => {
        social.listScheduled().then(
            (r) => setPosts(r?.posts || []),
            () => {
                setPosts([]);
                toast.error('Could not load scheduled posts');
            }
        );
    }, []);

    return (
        <SocialLayout>
            <Head title="Scheduled · Social" />
            <SchedulerSection
                posts={posts}
                onMutate={(updater) => setPosts((prev) => updater(prev || []))}
            />
        </SocialLayout>
    );
}
