/**
 * Parse poll content from post format: "📊 Poll: question\n1. opt1\n2. opt2"
 * or "Poll: question\n1. opt1\n2. opt2" (fallback if emoji lost in encoding)
 */
export function parsePollContent(content) {
    const str = content != null ? String(content) : ""
    if (!str.trim()) return null
    const normalized = str.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
    // Must contain "Poll" (case-insensitive) and numbered options (1. or 2.)
    if (!/poll/i.test(normalized) || !/\d+[.)]\s*.+/.test(normalized)) return null
    // Main pattern: optional emoji + "Poll" + optional ":" + question + newline + options
    const match = normalized.match(/(?:📊\s*)?[Pp]oll\s*:?\s*([^\n]+)(?:\r?\n)([\s\S]+)/i)
    if (!match || !match[2]?.trim()) return null
    const question = match[1].trim()
    const optsText = (match[2] || "").trim().replace(/\r/g, "")
    const options = optsText
        .split(/\n/)
        .map((line) => {
            const m = line.trim().match(/^\d+[.)]\s*(.+)$/)
            return m ? m[1].trim() : line.trim()
        })
        .filter(Boolean)
    if (options.length < 2) return null
    const intro = normalized.split(/(?:📊\s*)?[Pp]oll\s*:/i)[0].trim()
    return { question, options, intro: intro || null }
}
