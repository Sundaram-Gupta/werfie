import { Feed } from "@/components/feed/feed"
import { useTranslation } from "react-i18next"

export default function Bookmarks() {
    const { t } = useTranslation()
    return (
        <div className="min-h-screen">
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3">
                <h1 className="text-xl font-bold text-foreground">
                    Bookmark
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    {t('bookmarks.subtitle') || 'Posts you saved'}
                </p>
            </div>
            <Feed tab="bookmarks" />
        </div>
    )
}
