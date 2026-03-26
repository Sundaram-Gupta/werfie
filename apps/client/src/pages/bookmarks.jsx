import { Feed } from "@/components/feed/feed"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Search, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/context/AuthContext"

export default function Bookmarks() {
    const { t } = useTranslation()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef(null)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 400)
        return () => clearTimeout(timer)
    }, [searchQuery])

    return (
        <div className="min-h-screen flex flex-col bg-black">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336]">
                {/* Title row */}
                <div className="flex items-center gap-4 px-4 pt-3 pb-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors text-white shrink-0"
                        title="Back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-[20px] font-extrabold text-[#e7e9ea] leading-tight truncate">
                            Bookmarks
                        </h1>
                        <p className="text-[13px] text-[#71767b] leading-tight">
                            @{user?.profile?.handle || user?.handle || 'user'}
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-4 pb-3">
                    <div
                        className={`
                            flex items-center gap-3 h-[44px] rounded-full px-4 transition-all duration-200 cursor-text
                            ${isFocused
                                ? 'bg-black border border-[#1d9bf0] shadow-[0_0_0_1px_rgba(29,155,240,0.3)]'
                                : 'bg-[#202327] border border-transparent hover:border-[#363a3f]'
                            }
                        `}
                        onClick={() => inputRef.current?.focus()}
                    >
                        <Search
                            className={`w-[18px] h-[18px] shrink-0 transition-colors duration-200 ${isFocused ? 'text-[#1d9bf0]' : 'text-[#71767b]'}`}
                            strokeWidth={2.5}
                        />
                        <input
                            ref={inputRef}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder="Search Bookmarks"
                            className="flex-1 bg-transparent border-none outline-none text-[#e7e9ea] placeholder:text-[#71767b] text-[15px] caret-[#1d9bf0]"
                        />
                        {searchQuery && (
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { setSearchQuery(""); inputRef.current?.focus() }}
                                className="w-6 h-6 rounded-full bg-[#1d9bf0] flex items-center justify-center text-white hover:bg-[#1a8cd8] active:scale-95 transition-all shrink-0"
                                title="Clear search"
                            >
                                <X className="w-3.5 h-3.5" strokeWidth={3} />
                            </button>
                        )}
                    </div>

                    {/* Search hint */}
                    {debouncedSearch && (
                        <p className="text-[13px] text-[#71767b] mt-2 px-1 animate-in fade-in duration-200">
                            Searching for <span className="text-[#e7e9ea] font-medium">"{debouncedSearch}"</span>
                        </p>
                    )}
                </div>
            </div>

            <Feed tab="bookmarks" search={debouncedSearch} />
        </div>
    )
}
