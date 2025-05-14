
"use client";

import React, { useState, useEffect } from 'react';
import type { SubmitHandler } from 'react-hook-form'; // Keep type import for SubmitHandler
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Languages, Volume2, VolumeX, Loader2, Settings2, FileText, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { contextualTranslate, type ContextualTranslateOutput } from '@/ai/flows/contextual-translation';
import { supportedLanguages, toneOptions } from '@/lib/languages';
import { HighlightedText } from './HighlightedText';

const formSchema = z.object({
    textToTranslate: z.string().min(1, { message: "Please enter text to translate." }).max(5000, { message: "Text cannot exceed 5000 characters." }),
    targetLanguage: z.string().min(1, { message: "Please select a target language." }),
    tone: z.enum(['formal', 'slang', 'colloquial']),
});

type FormValues = z.infer<typeof formSchema>;

export default function LinguaLensPageClient() {
    const [translationResult, setTranslationResult] = useState<ContextualTranslateOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            textToTranslate: "",
            targetLanguage: "en",
            tone: "formal",
        },
    });

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setIsLoading(true);
        setError(null);
        setTranslationResult(null);
        if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel(); // Stop any ongoing speech before new translation
            setIsSpeaking(false);
        }
        try {
            const result = await contextualTranslate({
                text: data.textToTranslate,
                targetLanguage: data.targetLanguage,
                tone: data.tone,
            });
            setTranslationResult(result);
        } catch (err) {
            console.error("Translation error:", err);
            setError("Failed to translate. Please try again.");
            toast({
                title: "Error",
                description: "Translation failed. Please check your input or try again later.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSpeak = () => {
        if (!translationResult?.translation || typeof window === 'undefined' || !window.speechSynthesis) {
            toast({ title: "TTS Error", description: "Text-to-speech is not available or no text to speak.", variant: "destructive" });
            return;
        }

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        // Cancel any residual speech before starting a new one
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(translationResult.translation);
        const targetLangValue = form.getValues("targetLanguage");
        const selectedLangInfo = supportedLanguages.find(lang => lang.value === targetLangValue);

        if (selectedLangInfo) {
            utterance.lang = selectedLangInfo.value;
        } else {
            console.warn(`TTS: Language info not found for code ${targetLangValue}. Using browser default language for speech.`);
        }

        utterance.onstart = () => {
            setIsSpeaking(true);
        };
        utterance.onend = () => {
            setIsSpeaking(false);
        };
        utterance.onerror = (event) => {
            console.error("Speech synthesis error:", event.error, "Utterance:", utterance);
            setIsSpeaking(false);

            let detailedError = "Could not speak the text. The selected language might not be supported by your browser's speech engine, or another issue occurred.";
            if (event.error) {
                switch (event.error) {
                    case 'language-unavailable':
                        detailedError = `The selected language (${selectedLangInfo?.label || targetLangValue}) is not available for speech on your browser.`;
                        break;
                    case 'voice-unavailable':
                        detailedError = `No voice available for the selected language (${selectedLangInfo?.label || targetLangValue}) on your browser.`;
                        break;
                    case 'audio-busy':
                        detailedError = "The audio output is currently busy. Please try again.";
                        break;
                    case 'synthesis-failed':
                        detailedError = "Speech synthesis failed. Please try again.";
                        break;
                    case 'synthesis-unavailable':
                        detailedError = "Speech synthesis is currently unavailable. Please try again later.";
                        break;
                    case 'text-too-long':
                        detailedError = "The text is too long to be spoken by the speech synthesis engine.";
                        break;
                    case 'invalid-argument':
                        detailedError = "An invalid argument was provided to the speech synthesis engine.";
                        break;
                    default:
                        detailedError = `Speech synthesis error (${event.error}). The language may not be supported or another issue occurred.`;
                }
            }
            toast({
                title: "TTS Error",
                description: detailedError,
                variant: "destructive"
            });
        };

        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        // Cleanup function to cancel speech synthesis when the component unmounts
        return () => {
            if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false); // Reset speaking state on unmount
            }
        };
    }, []);


    return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-4xl">
            <header className="mb-10 text-center">
                <h1 className="text-5xl font-bold tracking-tight flex items-center justify-center">
                    <Sparkles className="w-12 h-12 mr-3 text-primary" />
                    LinguaLens
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    AI-powered contextual translation with idiom insights.
                </p>
            </header>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center"><FileText className="mr-2 h-6 w-6 text-primary" /> Input Text</CardTitle>
                            <CardDescription>Enter the text you want to translate and select your options.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="textToTranslate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Text to Translate</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter text here..."
                                                className="min-h-[150px] text-base resize-y focus:ring-primary focus:border-primary"
                                                {...field}
                                                aria-label="Text to translate"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="targetLanguage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Target Language</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger aria-label="Target language">
                                                        <Languages className="mr-2 h-4 w-4" />
                                                        <SelectValue placeholder="Select language" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {supportedLanguages.map((lang) => (
                                                        <SelectItem key={lang.value} value={lang.value}>
                                                            {lang.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="tone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tone of Voice</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger aria-label="Tone of voice">
                                                        <Settings2 className="mr-2 h-4 w-4" />
                                                        <SelectValue placeholder="Select tone" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {toneOptions.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6 rounded-lg shadow-md transition-transform hover:scale-105"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Translating...
                                    </>
                                ) : (
                                    "Translate with AI"
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </form>
            </Form>

            {error && (
                <Alert variant="destructive" className="mt-8 shadow-md">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {translationResult && (
                <Card className="mt-10 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center"><Sparkles className="mr-2 h-6 w-6 text-primary" /> AI Translation Result</CardTitle>
                        <Button
                            onClick={handleSpeak}
                            variant="outline"
                            size="icon"
                            aria-label={isSpeaking ? "Stop speaking" : "Speak translation"}
                            className="ml-auto rounded-full hover:bg-primary/10"
                            disabled={!translationResult?.translation} // No need to disable if isLoading for TTS
                        >
                            {isSpeaking ? <VolumeX className="h-5 w-5 text-destructive" /> : <Volume2 className="h-5 w-5 text-primary" />}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <HighlightedText
                            text={translationResult.translation}
                            idiomsToHighlight={translationResult.idioms}
                            alternativeTranslations={translationResult.alternativeTranslations}
                        />
                    </CardContent>
                </Card>
            )}

            <footer className="mt-16 text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} LinguaLens. All rights reserved.</p>
                <p>Powered by Genkit and Next.js.</p>
            </footer>
        </div>
    );
}
