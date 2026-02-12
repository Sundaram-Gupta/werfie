import { useState, useEffect } from 'react';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/axios';

export function GettingStartedCard() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await api.get('/admin/dashboard/getting-started-status');
                if (res.data.success) {
                    setTasks(res.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch tasks", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    const completedCount = tasks.filter(t => t.completed).length;
    const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

    const toggleTask = (id) => {
        // In a real app, this would call an API to update task status
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    return (
        <Card className="bg-card border-border shadow-none">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg font-bold text-foreground">Getting Started</CardTitle>
                    <span className="text-sm text-muted-foreground">{completedCount} of {tasks.length} completed</span>
                </div>
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-1 min-h-[300px] flex flex-col">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-50">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-xs font-medium">Updating status...</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div
                            key={task.id}
                            className={cn(
                                "group flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-muted cursor-pointer",
                                task.completed && "opacity-70"
                            )}
                            onClick={() => toggleTask(task.id)}
                        >
                            {/* Checkbox */}
                            <div className={cn(
                                "h-6 w-6 rounded-md border-2 flex items-center justify-center transition-colors duration-200",
                                task.completed
                                    ? "bg-green-500 border-green-500 text-black"
                                    : "border-muted-foreground group-hover:border-foreground bg-transparent"
                            )}>
                                {task.completed && <Check className="h-4 w-4 stroke-[3]" />}
                            </div>

                            {/* Text */}
                            <div className="flex-1">
                                <h4 className={cn(
                                    "text-sm font-medium transition-colors",
                                    task.completed ? "text-muted-foreground line-through" : "text-foreground"
                                )}>{task.title}</h4>
                                <p className="text-xs text-muted-foreground">{task.desc}</p>
                            </div>

                            {/* Action Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                {task.action}
                            </Button>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
