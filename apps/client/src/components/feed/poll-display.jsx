import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

const POLL_DURATION_HOURS = 24

/**
 * Parse poll content from post format: "📊 Poll: question\n1. opt1\n2. opt2"
 * or "Poll: question\n1. opt1\n2. opt2" (fallback if emoji lost in encoding)
 */
export function parsePollContent(content) {
    const str = content != null ? String(content) : ""
    if (!str.trim()) return null
    const normalized = str.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    if (!/poll:/i.test(normalized)) return null
    // Support both "📊 Poll:" and "Poll:" (emoji may be lost in transit/encoding)
    const match = normalized.match(/(?:📊\s*)?[Pp]oll:\s*(.+?)(?:\r?\n|$)([\s\S]*)/i)
    if (!match) return null
    const question = match[1].trim()
    const optsText = match[2].trim().replace(/\r/g, "")
    const options = optsText
        .split(/\n/)
        .map((line) => {
            const m = line.trim().match(/^\d+[.)]\s*(.+)$/)
            return m ? m[1].trim() : line.trim()
        })
        .filter(Boolean)
    if (options.length < 2) return null
    const intro = normalized.split(/(?:📊\s*)?[Pp]oll:/i)[0].trim()
    return { question, options, intro: intro || null }
}

/**
 * Get time left string (e.g. "23 hours left", "2 days left")
 */
function getTimeLeft(createdAt) {
    const end = new Date(createdAt)
    end.setHours(end.getHours() + POLL_DURATION_HOURS)
    const now = new Date()
    const diff = end - now
    if (diff <= 0) return null
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days} days`
    return `${hours} hours`
}

export function PollDisplay({ content, createdAt }) {
    const { t } = useTranslation()
    const poll = parsePollContent(content)
    if (!poll) return null

    const timeLeft = getTimeLeft(createdAt)
    // No voting backend yet - show 0% for all options
    const totalVotes = 0
    const optionPercentages = poll.options.map(() => 0)

    return (
        <div className="mt-0.5 space-y-2">
            {poll.intro && (
                <div className="text-[15px] leading-5 whitespace-pre-wrap break-words text-foreground">
                    {poll.intro}
                </div>
            )}
            <div className="text-[15px] font-medium text-foreground">
                {poll.question}
            </div>
            <div className="space-y-2 mt-2">
                {poll.options.map((opt, i) => (
                    <div
                        key={i}
                        className="relative rounded-full border border-border overflow-hidden bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                        <div
                            className="absolute inset-y-0 left-0 bg-primary/20 rounded-l-full min-w-0 transition-all"
                            style={{ width: `${optionPercentages[i]}%` }}
                        />
                        <div className="relative flex items-center justify-between px-4 py-2.5 text-[15px]">
                            <span className="text-foreground truncate pr-2">
                                {opt}
                            </span>
                            <span className="text-muted-foreground text-[13px] shrink-0">
                                {optionPercentages[i]}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="text-[13px] text-muted-foreground">
                {totalVotes} {t("feed.poll_votes") || "votes"}
                {timeLeft && (
                    <>
                        {" · "}
                        {timeLeft} {t("feed.poll_left") || "left"}
                    </>
                )}
            </div>
        </div>
    )
}
