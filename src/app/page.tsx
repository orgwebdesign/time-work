"use client";

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ArrowUp, BarChart3, Calendar, CheckCircle, Clock, Coffee, Hourglass, Target } from 'lucide-react';

export default function WorkHoursTracker() {
  const summaryData = [
    { icon: Clock, label: 'Worked Today', value: '7h 37m' },
    { icon: Coffee, label: 'Pause of Today', value: '57m' },
    { icon: Target, label: 'Required Today', value: '8h 30m' },
    { icon: Hourglass, label: 'Balance for Today', value: '-53m', valueColor: 'text-red-400' },
    { icon: Calendar, label: 'Est. Leave Time', value: '6:39 PM', valueColor: 'text-primary' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-center">Work Hours</h1>
        </header>

        <Alert className="bg-gray-800 border-gray-700 mb-8">
            <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertTitle className="text-green-400">Log Saved</AlertTitle>
          <AlertDescription>
            Your check-out has been successfully recorded.
          </AlertDescription>
        </Alert>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 space-y-4">
            {summaryData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">{item.label}</span>
                </div>
                <span className={cn('font-semibold', item.valueColor)}>{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 mt-8">
          <CardHeader>
            <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-gray-400" />
                <CardTitle>Cumulative Summaries</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-baseline">
                <div className="flex items-center gap-2 text-gray-300">
                    <ArrowUp className="w-4 h-4 text-green-400"/>
                    <span>From Past Days (This Month)</span>
                </div>
                <span className="font-bold text-green-400">+4h 32m</span>
              </div>
            </div>
            
            <Separator className="bg-gray-700" />

            <div>
                <div className="flex justify-between items-baseline mb-1">
                    <span className="text-gray-300">Total for Month (To Date)</span>
                    <span className="text-2xl font-bold text-green-400">+3h 39m</span>
                </div>
                <p className="text-xs text-gray-500">
                    (Includes today's balance, past days' balance for this month, and any manual adjustments for this month)
                </p>
            </div>

            <Separator className="bg-gray-700" />

            <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                    <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span>This Week</span>
                    </div>
                    <span className="font-semibold text-red-400">15h 25m needed</span>
                </div>
                <div className="flex justify-between items-baseline">
                    <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span>This Month</span>
                    </div>
                    <span className="font-semibold text-red-400">37h 51m needed</span>
                </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-center">
            <Button asChild variant="outline" className="bg-gray-700 border-gray-600 hover:bg-gray-600">
                <a href="/app">Go to Task Dashboard</a>
            </Button>
        </div>
      </div>
    </div>
  );
}
