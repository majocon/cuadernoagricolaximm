import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Button } from './ui/Button.tsx';
import { TextArea } from './ui/Input.tsx';
import { SparklesIcon, XMarkIcon, HomeIcon } from './icons/IconComponents.tsx';

// La clave de la API se obtiene de las variables de entorno.
const GEMINI_API_KEY = process.env.API_KEY;

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve('');
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

interface AI_AssistantManagerProps {
  onGoToDashboard: () => void;
}

export const AI_AssistantManager: React.FC<AI_AssistantManagerProps> = ({ onGoToDashboard }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setResult(null); 
      setError(null);
    }
  };

  const handleRemoveImage = useCallback(() => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }, []);

  const handleAnalyse = useCallback(async () => {
    if (!prompt) {
      setError('Por favor, escriba una pregunta.');
      return;
    }
    
    if (!GEMINI_API_KEY) {
      setError("La clave de API de Google Gemini no está configurada en el entorno de la aplicación.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const model = 'gemini-2.5-flash';
      const config = {
          systemInstruction: "Eres un asistente experto en agronomía. Responde a las preguntas del usuario de forma clara y concisa. Si se proporciona una imagen, úsala como contexto para tu respuesta, identificando posibles enfermedades, plagas o deficiencias y ofreciendo recomendaciones.",
      };
      
      let response: GenerateContentResponse;

      if (image) {
        const imagePart = await fileToGenerativePart(image);
        const textPart = { text: prompt };
        response = await ai.models.generateContent({
          model,
          contents: { parts: [imagePart, textPart] },
          config,
        });
      } else {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });
      }
      
      setResult(response.text);

    } catch (err: any) {
      console.error(err);
      let errorMessage = 'Hubo un error al contactar con el asistente de IA. Por favor, inténtelo de nuevo más tarde.';
      if (err.message) {
        errorMessage += `\nDetalle: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [image, prompt]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
            <button onClick={onGoToDashboard} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Volver al Inicio">
                <HomeIcon className="h-6 w-6 text-gray-700" />
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Asistente IA para Cultivos</h1>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Input */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Analizar y Consultar</h2>
            <div>
              <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-1">1. Subir Imagen (Opcional)</label>
              <input 
                id="image-upload"
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>

            {imagePreview && (
              <div className="mt-4 relative">
                <img src={imagePreview} alt="Vista previa del cultivo" className="w-full h-auto max-h-64 object-contain rounded-lg border"/>
                <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    aria-label="Quitar imagen"
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            
            <TextArea 
              label="2. Escribe tu pregunta"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: ¿Cuál es la mejor forma de controlar la araña roja? O sube una foto y pregunta: ¿Qué le pasa a esta hoja?"
              rows={4}
              required
            />
            
            <Button 
              onClick={handleAnalyse} 
              disabled={!prompt || isLoading}
              leftIcon={<SparklesIcon className="h-5 w-5"/>}
            >
              {isLoading ? 'Analizando...' : 'Preguntar a la IA'}
            </Button>
          </div>

          {/* Right Column: Result */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Resultados del Análisis</h2>
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
              </div>
            )}
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                <p className="font-bold">Error</p>
                <pre className="whitespace-pre-wrap font-sans text-sm">{error}</pre>
              </div>
            )}
            {result && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3 prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap font-sans text-gray-800">{result}</div>
              </div>
            )}
            {!isLoading && !result && !error && (
                <div className="text-center p-8 bg-gray-50 rounded-lg h-full flex flex-col justify-center items-center">
                    <SparklesIcon className="h-12 w-12 text-gray-300 mb-4"/>
                    <p className="text-gray-500">La respuesta de la IA aparecerá aquí.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};