'use server';

/**
 * @fileOverview Explains idioms found in a text.
 *
 * - explainIdiom - A function that takes text and an idiom and provides an explanation.
 * - ExplainIdiomInput - The input type for the explainIdiom function.
 * - ExplainIdiomOutput - The return type for the explainIdiom function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainIdiomInputSchema = z.object({
    text: z.string().describe('The complete text in which the idiom is found.'),
    idiom: z.string().describe('The specific idiom to explain.'),
});
export type ExplainIdiomInput = z.infer<typeof ExplainIdiomInputSchema>;

const ExplainIdiomOutputSchema = z.object({
    explanation: z.string().describe('An explanation of the idiom.'),
    alternativeTranslations: z
        .array(z.string())
        .describe('Alternative translations of the idiom.'),
});
export type ExplainIdiomOutput = z.infer<typeof ExplainIdiomOutputSchema>;

export async function explainIdiom(input: ExplainIdiomInput): Promise<ExplainIdiomOutput> {
    return explainIdiomFlow(input);
}

const prompt = ai.definePrompt({
    name: 'explainIdiomPrompt',
    input: {schema: ExplainIdiomInputSchema},
    output: {schema: ExplainIdiomOutputSchema},
    prompt: `You are an expert in linguistics and cultural nuances. A user has provided a piece of text and identified an idiom within that text. Your task is to provide a detailed explanation of the idiom, including its meaning and cultural context. Additionally, offer several alternative translations of the idiom that maintain its original intent but may be more suitable for different audiences or contexts.

Text: {{{text}}}
Idiom: {{{idiom}}}

Explanation:
Alternative Translations:`, // The prompt is incomplete, it needs to be populated by the ai
});

const explainIdiomFlow = ai.defineFlow(
    {
        name: 'explainIdiomFlow',
        inputSchema: ExplainIdiomInputSchema,
        outputSchema: ExplainIdiomOutputSchema,
    },
    async input => {
        const {output} = await prompt(input);
        return output!;
    }
);
