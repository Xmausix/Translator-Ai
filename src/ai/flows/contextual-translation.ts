'use server';

/**
 * @fileOverview A contextual translation AI agent.
 *
 * - contextualTranslate - A function that handles the contextual translation process.
 * - ContextualTranslateInput - The input type for the contextualTranslate function.
 * - ContextualTranslateOutput - The return type for the contextualTranslate function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContextualTranslateInputSchema = z.object({
    text: z.string().describe('The text to translate.'),
    targetLanguage: z.string().describe('The target language for the translation.'),
    tone: z
        .enum(['formal', 'slang', 'colloquial'])
        .describe('The desired tone of the translation.'),
});
export type ContextualTranslateInput = z.infer<typeof ContextualTranslateInputSchema>;

const ContextualTranslateOutputSchema = z.object({
    translation: z.string().describe('The translated text.'),
    idioms: z.array(z.string()).describe('Idioms used in the translation.'),
    alternativeTranslations: z
        .array(z.string())
        .describe('Alternative translations for idioms.'),
});
export type ContextualTranslateOutput = z.infer<typeof ContextualTranslateOutputSchema>;

export async function contextualTranslate(input: ContextualTranslateInput): Promise<ContextualTranslateOutput> {
    return contextualTranslateFlow(input);
}

const prompt = ai.definePrompt({
    name: 'contextualTranslatePrompt',
    input: {schema: ContextualTranslateInputSchema},
    output: {schema: ContextualTranslateOutputSchema},
    prompt: `You are an expert translator that translates with the context, tone, and style of the input.

You will receive the text to translate, the target language, and the desired tone.

You will translate the text to the target language, and use the desired tone. You should respond using the ContextualTranslateOutput schema, with any idioms used and alternative translations.

Text: {{{text}}}
Target Language: {{{targetLanguage}}}
Tone: {{{tone}}}`,
});

const contextualTranslateFlow = ai.defineFlow(
    {
        name: 'contextualTranslateFlow',
        inputSchema: ContextualTranslateInputSchema,
        outputSchema: ContextualTranslateOutputSchema,
    },
    async input => {
        const {output} = await prompt(input);
        return output!;
    }
);
