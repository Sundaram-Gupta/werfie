import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CoordinatePicker from '@/components/admin/CoordinatePicker';
import { addCrisisStream, createCrisis, getCrisisDetail, updateCrisis } from '@/services/crisis.api';
import { getAnnouncementsFeed } from '@/services/crisis-admin.api';
import { useAttachAnnouncementsMutation, useToggleStreamLiveMutation } from '@/hooks/useAdminQueries';
import { toast } from 'sonner';
import { ActionModal } from '@/components/admin/ActionModal';

const baseForm = {
    title: '',
    description: '',
    region: 'Global',
    country: '',
    latitude: 20,
    longitude: 0,
    severity: 3,
    status: 'active'
};

export default function AdminCrisisForm() {
    const params = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState(baseForm);
    const [streams, setStreams] = useState([]);
    const [announcementOptions, setAnnouncementOptions] = useState([]);
    const [selectedAnnouncementIds, setSelectedAnnouncementIds] = useState([]);
    const [streamUrl, setStreamUrl] = useState('');
    const [streamPlatform, setStreamPlatform] = useState('YouTube');
    const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
    const [showStreamsModal, setShowStreamsModal] = useState(false);
    const [streamActionId, setStreamActionId] = useState(null);
    const [isAddingStream, setIsAddingStream] = useState(false);
    const [isSavingForm, setIsSavingForm] = useState(false);
    const isEdit = useMemo(() => !!params.id, [params.id]);
    const attachMutation = useAttachAnnouncementsMutation();
    const toggleStreamMutation = useToggleStreamLiveMutation();

    useEffect(() => {
        if (!isEdit) return;
        getCrisisDetail(params.id).then((d) => {
            setForm({
                title: d.title,
                description: d.description,
                region: d.region,
                country: d.country,
                latitude: d.latitude,
                longitude: d.longitude,
                severity: d.severity,
                status: d.status
            });
            setStreams(d.streams || []);
            setSelectedAnnouncementIds(d.linkedAnnouncementIds || []);
        });
    }, [isEdit, params.id]);

    useEffect(() => {
        if (!isEdit) return;
        getAnnouncementsFeed({ limit: 50 }).then((rows) => {
            const list = Array.isArray(rows?.data) ? rows.data : Array.isArray(rows) ? rows : [];
            setAnnouncementOptions(list);
        }).catch(() => setAnnouncementOptions([]));
    }, [isEdit]);

    const onSubmit = async (e) => {
        e.preventDefault();
        setIsSavingForm(true);
        try {
            if (isEdit) {
                await updateCrisis(params.id, form);
            } else {
                await createCrisis(form);
            }
            toast.success('Crisis saved');
            navigate('/admin/crisis');
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Failed to save crisis');
        } finally {
            setIsSavingForm(false);
        }
    };

    const onAddStream = async () => {
        if (!streamUrl.trim()) return;
        setIsAddingStream(true);
        try {
            await addCrisisStream({ crisisId: params.id, streamUrl, platform: streamPlatform });
            const d = await getCrisisDetail(params.id);
            setStreams(d.streams || []);
            setStreamUrl('');
            toast.success('Stream added');
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Failed to add stream');
        } finally {
            setIsAddingStream(false);
        }
    };

    const onSaveAnnouncements = async () => {
        try {
            await attachMutation.mutateAsync({ crisisId: params.id, announcementIds: selectedAnnouncementIds });
        } catch {
            // handled by mutation toast
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-bold">{isEdit ? 'Edit Crisis' : 'Create Crisis'}</h2>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" required className="w-full rounded border border-white/10 bg-black/40 px-3 py-2" />
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" required className="h-32 w-full rounded border border-white/10 bg-black/40 px-3 py-2" />
            <div className="grid gap-3 md:grid-cols-2">
                <input value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} placeholder="Region" className="rounded border border-white/10 bg-black/40 px-3 py-2" />
                <input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} placeholder="Country" className="rounded border border-white/10 bg-black/40 px-3 py-2" />
            </div>
            <CoordinatePicker value={form} onChange={(coords) => setForm((p) => ({ ...p, ...coords }))} />
            <div className="grid gap-3 md:grid-cols-4">
                <input type="number" min={1} max={5} value={form.severity} onChange={(e) => setForm((p) => ({ ...p, severity: Number(e.target.value) }))} className="rounded border border-white/10 bg-black/40 px-3 py-2" />
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="rounded border border-white/10 bg-black/40 px-3 py-2">
                    <option value="active">active</option>
                    <option value="monitoring">monitoring</option>
                    <option value="resolved">resolved</option>
                </select>
                <input type="number" step="0.0001" value={form.latitude} onChange={(e) => setForm((p) => ({ ...p, latitude: Number(e.target.value) }))} className="rounded border border-white/10 bg-black/40 px-3 py-2" />
                <input type="number" step="0.0001" value={form.longitude} onChange={(e) => setForm((p) => ({ ...p, longitude: Number(e.target.value) }))} className="rounded border border-white/10 bg-black/40 px-3 py-2" />
            </div>
            <button disabled={isSavingForm} className="rounded bg-red-600 px-4 py-2 font-semibold disabled:opacity-50">
                {isSavingForm ? 'Saving...' : 'Save Crisis'}
            </button>

            {isEdit && (
                <div className="space-y-4 border-t border-white/10 pt-4">
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setShowAnnouncementsModal(true)} className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold">
                            Manage Announcements
                        </button>
                        <button type="button" onClick={() => setShowStreamsModal(true)} className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold">
                            Manage Streams
                        </button>
                    </div>
                </div>
            )}

            <ActionModal
                open={isEdit && showAnnouncementsModal}
                title="Link Announcements"
                onClose={() => setShowAnnouncementsModal(false)}
                footer={(
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowAnnouncementsModal(false)} className="rounded border border-white/20 px-3 py-2 text-sm">Close</button>
                        <button
                            type="button"
                            disabled={attachMutation.isPending}
                            onClick={async () => { await onSaveAnnouncements(); setShowAnnouncementsModal(false); }}
                            className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold disabled:opacity-50"
                        >
                            {attachMutation.isPending ? 'Saving...' : 'Save Links'}
                        </button>
                    </div>
                )}
            >
                        <div className="max-h-72 space-y-2 overflow-y-auto rounded border border-white/10 p-2">
                            {announcementOptions.map((a) => (
                                <label key={a.id} className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={selectedAnnouncementIds.includes(a.id)}
                                        onChange={(e) =>
                                            setSelectedAnnouncementIds((prev) =>
                                                e.target.checked ? [...prev, a.id] : prev.filter((id) => id !== a.id)
                                            )
                                        }
                                    />
                                    <span>{a.title}</span>
                                </label>
                            ))}
                        </div>
            </ActionModal>

            <ActionModal
                open={isEdit && showStreamsModal}
                title="Manage Streams"
                onClose={() => setShowStreamsModal(false)}
                footer={(
                    <div className="flex justify-end">
                        <button type="button" onClick={() => setShowStreamsModal(false)} className="rounded border border-white/20 px-3 py-2 text-sm">Close</button>
                    </div>
                )}
            >
                        <div className="grid gap-2 md:grid-cols-3">
                            <input
                                value={streamUrl}
                                onChange={(e) => setStreamUrl(e.target.value)}
                                placeholder="Stream URL"
                                className="rounded border border-white/10 bg-black/40 px-3 py-2 md:col-span-2"
                            />
                            <select value={streamPlatform} onChange={(e) => setStreamPlatform(e.target.value)} className="rounded border border-white/10 bg-black/40 px-3 py-2">
                                <option>YouTube</option>
                                <option>RTMP</option>
                                <option>HLS</option>
                            </select>
                        </div>
                        <button
                            type="button"
                            disabled={isAddingStream}
                            onClick={onAddStream}
                            className="mt-2 rounded bg-emerald-600 px-3 py-2 text-sm font-semibold disabled:opacity-50"
                        >
                            {isAddingStream ? 'Adding...' : 'Add Stream'}
                        </button>
                        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                            {streams.map((s) => (
                                <div key={s.id} className="flex items-center justify-between rounded border border-white/10 px-3 py-2 text-sm">
                                    <span className="truncate">{s.platform} - {s.streamUrl}</span>
                                    <button
                                        type="button"
                                        disabled={streamActionId === s.id}
                                        onClick={async () => {
                                            setStreamActionId(s.id);
                                            try {
                                                await toggleStreamMutation.mutateAsync({ streamId: s.id, isLive: !s.isLive });
                                                const d = await getCrisisDetail(params.id);
                                                setStreams(d.streams || []);
                                            } finally {
                                                setStreamActionId(null);
                                            }
                                        }}
                                        className="rounded bg-white/10 px-2 py-1 text-xs disabled:opacity-50"
                                    >
                                        {streamActionId === s.id ? 'Saving...' : (s.isLive ? 'Set Offline' : 'Set Live')}
                                    </button>
                                </div>
                            ))}
                        </div>
            </ActionModal>
        </form>
    );
}
