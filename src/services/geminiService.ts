/**
 * Serviço Cliente para chamada ao Backend da Vercel
 * Agora a chave da API (GEMINI_API_KEY) fica 100% segura no servidor.
 */

export async function getClinicalResponse(
  prompt: string, 
  type: 'search' | 'analysis' | 'reasoning' | 'emergency',
  pdfBase64?: string
) {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        type,
        // Envia base64 apenas se existir. Obs: Na cota grátis, arquivos gigantes podem esgotar limit tokens rápido.
        pdfBase64
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro na API Backend:", data.error);
      throw new Error(data.error || 'Erro desconhecido ao processar requisição clínica.');
    }

    return data.text;
  } catch (error: any) {
    console.error("Erro no catch do fetch (GeminiService):", error);
    throw new Error(error.message || 'Falha ao comunicar com o servidor da IA.');
  }
}
