import React from 'react';
import CountUp from 'react-countup';

export default function StatisticsBar() {
    const stats = [
        { number: '98', label: 'Client Partners' },
        { number: '238', label: 'Application Processed' },
        { number: '228', label: 'Application Approved' },
        { number: '100%', label: 'Visa Approval Rate' }
    ];

    return (
        <div className="w-full bg-[#282728] py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, index) => {
                        const isPercentage = stat.number.includes('%');
                        const value = parseInt(stat.number);

                        return (
                            <div key={index} className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                                    <CountUp
                                        end={value}
                                        duration={3}
                                        suffix={isPercentage ? "%" : ""}
                                        enableScrollSpy
                                        scrollSpyOnce
                                    />
                                </div>
                                <div className="text-xs md:text-sm text-gray-300">
                                    {stat.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
