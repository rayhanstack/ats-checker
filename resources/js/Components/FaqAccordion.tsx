import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FaqItem } from '@/types';

interface FaqAccordionProps {
    faqs: FaqItem[];
}

export default function FaqAccordion({ faqs }: FaqAccordionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggle = (index: number) => {
        setOpenIndex((prev) => (prev === index ? null : index));
    };

    return (
        <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq, index) => {
                const isOpen = openIndex === index;
                const contentId = `faq-content-${faq.id}`;
                const buttonId = `faq-button-${faq.id}`;

                return (
                    <div
                        key={faq.id}
                        className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                            isOpen
                                ? 'border-indigo-500/30 bg-white/80 shadow-glass dark:border-indigo-400/30 dark:bg-slate-900/80'
                                : 'border-slate-200/60 bg-white/50 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/40 dark:hover:border-white/20'
                        } backdrop-blur-xl`}
                    >
                        <button
                            type="button"
                            id={buttonId}
                            aria-expanded={isOpen}
                            aria-controls={contentId}
                            onClick={() => toggle(index)}
                            className="flex w-full items-center justify-between p-5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl"
                        >
                            <span className="text-base font-semibold text-slate-900 dark:text-white pr-4">
                                {faq.question}
                            </span>
                            <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-transform duration-200 dark:bg-slate-800 dark:text-slate-400 ${
                                    isOpen ? 'rotate-180 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400' : ''
                                }`}
                            >
                                <ChevronDown className="h-4 w-4" />
                            </span>
                        </button>

                        {isOpen && (
                            <div
                                id={contentId}
                                role="region"
                                aria-labelledby={buttonId}
                                className="border-t border-slate-200/50 px-5 pt-3 pb-5 text-sm leading-relaxed text-slate-600 dark:border-white/10 dark:text-slate-300 animate-in fade-in duration-200"
                            >
                                <p>{faq.answer}</p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
