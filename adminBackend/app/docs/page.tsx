'use client';

import { useEffect } from 'react';
import Head from 'next/head';

export default function SwaggerPage() {
    useEffect(() => {
        // Dynamically load Swagger UI since it's a bit heavy and needs browser globals
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js';
        script.onload = () => {
            // @ts-ignore
            window.ui = window.SwaggerUIBundle({
                url: '/api/docs',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    // @ts-ignore
                    window.SwaggerUIBundle.presets.apis,
                    // @ts-ignore
                    window.SwaggerUIStandalonePreset
                ],
                layout: "BaseLayout"
            });
        };
        document.body.appendChild(script);

        const presetScript = document.createElement('script');
        presetScript.src = 'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js';
        document.body.appendChild(presetScript);
    }, []);

    return (
        <div className="swagger-container" style={{ backgroundColor: 'white', minHeight: '100vh' }}>
            <div id="swagger-ui"></div>
        </div>
    );
}
