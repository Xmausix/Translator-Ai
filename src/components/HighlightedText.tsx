"use client";

import React from 'react'; // Added import
import type { JSX } from 'react'; // Changed to type import for JSX
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HighlightedTextProps {
    text: string;
    idiomsToHighlight: string[];
    alternativeTranslations: string[];
}

export function HighlightedText({ text, idiomsToHighlight, alternativeTranslations }: HighlightedTextProps) {
    if (!text) return null;

    const parts: (string | JSX.Element)[] = []; // Changed React.JSX.Element to JSX.Element
    let lastIndex = 0;

    if (idiomsToHighlight.length > 0) {
        // Create a regex that matches any of the idioms, case-insensitive
        // Escape regex special characters in idioms
        const escapedIdioms = idiomsToHighlight.map(idiom => idiom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const regex = new RegExp(`(${escapedIdioms.join('|')})`, 'gi');

        let match;
        while ((match = regex.exec(text)) !== null) {
            // Add text part before the match
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }
            // Add the highlighted idiom
            parts.push(
                <TooltipProvider key={`idiom-${match.index}-${match[0]}`}>
                    <Tooltip>
                        <TooltipTrigger asChild>
              <span className="border-b-2 border-primary font-medium cursor-pointer transition-colors hover:bg-primary/10 px-0.5 py-0.5 rounded-sm">
                {match[0]}
              </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Identified Idiom</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
            lastIndex = regex.lastIndex;
        }
    }

    // Add the remaining part of the text
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return (
        <div className="space-y-4">
            <p className="whitespace-pre-wrap text-lg leading-relaxed">
                {parts.length > 0 ? parts.map((part, index) => <React.Fragment key={index}>{part}</React.Fragment>) : text}
            </p>
            {alternativeTranslations.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                    <h4 className="font-semibold text-md mb-2 text-foreground/80">Possible Alternative Phrases for Idioms:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {alternativeTranslations.map((alt, index) => (
                            <li key={index}>{alt}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
