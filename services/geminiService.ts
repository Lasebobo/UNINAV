export interface GeminiResponse {
  text: string;
  groundingMetadata?: any; 
  isError?: boolean;
}

interface GeminiRequestOptions {
  modelType: 'fast' | 'balanced' | 'thinking' | 'maps' | 'search';
  systemInstruction?: string;
  location?: { lat: number; lng: number }; 
}

export const generateGeminiResponse = async (
  prompt: string | any[],
  options: GeminiRequestOptions
): Promise<GeminiResponse> => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, options }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { text: errorData.text || "I encountered an error connecting to the campus network.", isError: true };
    }

    return await response.json();
  } catch (error) {
    console.error(`Gemini ${options.modelType} Error:`, error);
    return { text: "I encountered an error connecting to the campus network.", isError: true };
  }
};

export const generateSpeech = async (text: string): Promise<ArrayBuffer | null> => {
  console.log("TTS not implemented for Native yet");
  return null;
};

export const decodePCMToAudioBuffer = (
  pcmData: ArrayBuffer, 
  audioCtx: any, 
  sampleRate: number = 24000
): any => {
   return null; 
}

export const transcribeAudio = async (audioBase64: string): Promise<string> => {
  return "Audio transcription pending native module integration.";
};