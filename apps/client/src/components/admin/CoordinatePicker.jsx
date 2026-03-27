import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
mapboxgl.accessToken = TOKEN;

export default function CoordinatePicker({ value, onChange }) {
    const mapRef = useRef(null);
    const containerRef = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current || !TOKEN) return;
        if (mapRef.current) return;
        const lng = Number(value?.longitude ?? 0);
        const lat = Number(value?.latitude ?? 20);
        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [lng, lat],
            zoom: 2
        });
        mapRef.current = map;
        markerRef.current = new mapboxgl.Marker({ color: '#ef4444' }).setLngLat([lng, lat]).addTo(map);
        map.on('click', (e) => {
            const next = { latitude: e.lngLat.lat, longitude: e.lngLat.lng };
            markerRef.current?.setLngLat([next.longitude, next.latitude]);
            onChange(next);
        });
        return () => {
            markerRef.current?.remove();
            map.remove();
            mapRef.current = null;
        };
    }, [onChange, value?.latitude, value?.longitude]);

    useEffect(() => {
        if (!mapRef.current || !markerRef.current) return;
        const lng = Number(value?.longitude ?? 0);
        const lat = Number(value?.latitude ?? 20);
        markerRef.current.setLngLat([lng, lat]);
    }, [value?.latitude, value?.longitude]);

    if (!TOKEN) {
        return (
            <div className="rounded border border-amber-500/50 bg-amber-900/20 px-3 py-2 text-xs text-amber-200">
                Mapbox token missing. Set `VITE_MAPBOX_TOKEN` to enable coordinate picker.
            </div>
        );
    }

    return <div ref={containerRef} className="h-64 w-full overflow-hidden rounded-lg border border-white/10" />;
}
