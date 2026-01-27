/**
 * Werfie AI Chat Interface Component
 * 
 * A full-featured AI chat interface similar to X.com's Grok, providing an interactive
 * conversation experience with an AI assistant.
 * 
 * Features:
 * - Real-time chat interface with message bubbles
 * - Typing indicator for AI responses
 * - Gradient branding (purple-blue-cyan)
 * - Full-width layout without right sidebar
 * - Demo AI responses (ready for API integration)
 * 
 * @component
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Sparkles, Zap, Brain } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Sample conversation prompts for quick start
 * Each prompt has:
 * @property {number} id - Unique identifier
 * @property {string} title - The prompt text to display
 * @property {string} preview - Short description of what the prompt is about
 */
const SAMPLE_CONVERSATIONS = [
    { id: 1, title: "What's trending in tech?", preview: "AI and machine learning continue to dominate..." },
    { id: 2, title: "Explain quantum computing", preview: "Quantum computing uses quantum bits or qubits..." },
    { id: 3, title: "Best coding practices", preview: "Clean code, proper documentation, and testing..." },
]

export default function WerfieAI() {
    /**
     * Messages state - stores the conversation history
     * Each message object contains:
     * @property {number} id - Unique message identifier
     * @property {string} role - Either "user" or "assistant"
     * @property {string} content - The message text
     * @property {string} timestamp - Formatted time (HH:MM)
     */
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: "assistant",
            content: "Hey! I'm Werfie AI, your intelligent assistant. I can help you with anything from answering questions to creative writing. What would you like to know?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ])

    /** Current input message being typed by the user */
    const [inputMessage, setInputMessage] = useState("")

    /** Indicates if AI is currently "typing" a response */
    const [isTyping, setIsTyping] = useState(false)

    /**
     * Handles sending a message to the AI
     * 
     * Process:
     * 1. Validates input is not empty
     * 2. Adds user message to conversation
     * 3. Clears input field
     * 4. Shows typing indicator
     * 5. Simulates AI response after 1.5s delay
     * 
     * TODO: Replace setTimeout with actual API call to AI service
     * Expected API response format: { content: string, timestamp?: string }
     */
    const handleSendMessage = () => {
        // Validate input
        if (!inputMessage.trim()) return

        // Create user message object
        const userMessage = {
            id: messages.length + 1,
            role: "user",
            content: inputMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        // Add user message to conversation
        setMessages([...messages, userMessage])
        setInputMessage("")
        setIsTyping(true)

        // Simulate AI response (replace with actual API call)
        setTimeout(() => {
            const aiResponse = {
                id: messages.length + 2,
                role: "assistant",
                content: `I understand you're asking about "${inputMessage}". This is a demo response. In a production environment, this would connect to an actual AI service to provide intelligent responses.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
            setMessages(prev => [...prev, aiResponse])
            setIsTyping(false)
        }, 1500)
    }

    return (
        <div className="flex h-screen max-h-screen">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-black">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-md px-6 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                Werfie AI
                                <span className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-0.5 rounded-full">BETA</span>
                            </h1>
                            <p className="text-sm text-muted-foreground">Your intelligent assistant</p>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                "flex gap-4",
                                message.role === "user" ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            {message.role === "assistant" && (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                    <Brain className="w-5 h-5 text-white" />
                                </div>
                            )}
                            {message.role === "user" && (
                                <Avatar className="w-10 h-10 flex-shrink-0">
                                    <AvatarImage src="https://github.com/shadcn.png" />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                            )}
                            <div className={cn(
                                "flex flex-col max-w-[70%]",
                                message.role === "user" ? "items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "px-4 py-3 rounded-2xl text-[15px] leading-relaxed",
                                    message.role === "user"
                                        ? "bg-blue-500 text-white rounded-br-sm"
                                        : "bg-[#2f3336] text-white rounded-bl-sm"
                                )}>
                                    {message.content}
                                </div>
                                <span className="text-xs text-muted-foreground mt-1 px-1">
                                    {message.timestamp}
                                </span>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                <Brain className="w-5 h-5 text-white animate-pulse" />
                            </div>
                            <div className="bg-[#2f3336] px-4 py-3 rounded-2xl rounded-bl-sm">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-border bg-black">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-[#202327] rounded-2xl flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500">
                            <Input
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Ask Werfie AI anything..."
                                className="flex-1 border-none bg-transparent focus-visible:ring-0 text-white placeholder:text-muted-foreground px-2 h-12 text-[15px]"
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "rounded-full h-10 w-10 transition-colors",
                                    inputMessage.trim()
                                        ? "text-blue-500 hover:bg-blue-500/10"
                                        : "text-muted-foreground opacity-50"
                                )}
                                onClick={handleSendMessage}
                                disabled={!inputMessage.trim()}
                            >
                                <Send className="w-5 h-5" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                            Werfie AI can make mistakes. Check important info.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
