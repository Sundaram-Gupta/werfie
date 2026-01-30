
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

export function StatCard({ title, value, icon: Icon, trend, trendValue, className, color = "blue" }) {
    const isUp = trend === 'up';

    return (
        <Card className={cn("bg-card border-border shadow-none overflow-hidden hover:border-foreground/10 transition-colors", className)}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
                    </div>

                    <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center border border-border",
                         // Dynamic icon colors
                         color === "blue" && "bg-blue-500/10 text-blue-500",
                         color === "purple" && "bg-purple-500/10 text-purple-500",
                         color === "green" && "bg-green-500/10 text-green-500",
                         color === "orange" && "bg-orange-500/10 text-orange-500",
                         color === "red" && "bg-red-500/10 text-red-500",
                         !color && "bg-primary/10 text-primary"
                    )}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <div className={cn(
                        "flex items-center text-xs font-bold px-2 py-0.5 rounded-full",
                        isUp
                            ? "bg-green-500/20 text-green-500"
                            : "bg-red-500/20 text-red-500"
                    )}>
                        {isUp ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                        {trendValue}
                    </div>
                    <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
            </CardContent>
        </Card>
    );
}
