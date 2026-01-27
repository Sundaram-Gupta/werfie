import { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function GettingStartedCard() {
    const [tasks, setTasks] = useState([
        { id: 1, title: 'Invite users', desc: 'Add team members to your workspace', complated: false, action: 'Go to' },
        { id: 2, title: 'Create a team', desc: 'Organize users into teams', complated: true, action: 'Go to' },
        { id: 3, title: 'Configure email templates', desc: 'Set up notification emails', complated: false, action: 'Go to' },
        { id: 4, title: 'Review notifications', desc: 'Configure notification preferences', complated: false, action: 'Go to' },
        { id: 5, title: 'Explore apps', desc: 'Discover available applications', complated: true, action: 'Go to' },
    ]);

    const completedCount = tasks.filter(t => t.complated).length;
    const progress = (completedCount / tasks.length) * 100;

    const toggleTask = (id) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, complated: !t.complated } : t));
    };

    return (
        <Card className="bg-[#151516] border-white/5 shadow-none">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg font-bold text-white">Getting Started</CardTitle>
                    <span className="text-sm text-muted-foreground">{completedCount} of {tasks.length} completed</span>
                </div>
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-1">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        className={cn(
                            "group flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-white/5 cursor-pointer",
                            task.complated && "opacity-70"
                        )}
                        onClick={() => toggleTask(task.id)}
                    >
                        {/* Checkbox */}
                        <div className={cn(
                            "h-6 w-6 rounded-md border-2 flex items-center justify-center transition-colors duration-200",
                            task.complated
                                ? "bg-green-500 border-green-500 text-black"
                                : "border-gray-600 group-hover:border-gray-500 bg-transparent"
                        )}>
                            {task.complated && <Check className="h-4 w-4 stroke-[3]" />}
                        </div>

                        {/* Text */}
                        <div className="flex-1">
                            <h4 className={cn(
                                "text-sm font-medium transition-colors",
                                task.complated ? "text-gray-400 line-through" : "text-gray-200"
                            )}>{task.title}</h4>
                            <p className="text-xs text-muted-foreground">{task.desc}</p>
                        </div>

                        {/* Action Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            {task.action}
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
