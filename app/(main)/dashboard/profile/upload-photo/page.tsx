"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useCallback, Suspense } from 'react';
import { ArrowLeft, UploadCloud, XCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image'; // Para preview da imagem
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';

const TARGET_TEXT_COLOR = "#3D3D3D";
const IFC_GREEN = "#98EE6F";
const PHP_API_BASE_URL = "http://achados-perdidos.infinityfreeapp.com/php_api/endpoints";

function UploadPhotoPageComponent() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] },
    multiple: false,
  });

  const handleRemovePreview = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      // Adicionar feedback (ex: toast)
      console.warn("Nenhum arquivo selecionado.");
      setMessage({type: 'error', text: "Nenhum arquivo selecionado. Por favor, escolha uma imagem."}) 
      return;
    }
    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('profileImage', selectedFile);

    console.log("Enviando imagem para o backend:", selectedFile.name);

    try {
      // Substitua pelo seu endpoint real
      const response = await fetch(`${PHP_API_BASE_URL}/profile/upload-photo.php`, { 
        method: 'POST',
        // Headers de 'Content-Type' são definidos automaticamente pelo browser ao usar FormData
        // Inclua headers de autenticação se necessário
        credentials: 'include',
        body: formData,
      });

      if (response.ok) { // Use isso com uma API real
        const result = await response.json(); // Se o backend retornar JSON
        if (result.success && result.filePath) { // Para API Real
          setMessage({type: 'success', text: result.message || "Foto de perfil atualizada com sucesso!"});
          if (typeof window !== "undefined") {
            localStorage.setItem("userPhotoUrl", result.filePath);
            window.dispatchEvent(new CustomEvent('userDataChanged'));
          }
          handleRemovePreview();
          router.push('/dashboard');
        } else {
          setMessage({type: 'error', text: result.message || "Falha ao processar a resposta do servidor."});
        }

        // Bloco de simulação (MANTENHA OU SUBSTITUA PELO DE CIMA PARA API REAL)
        // const simulatedFilePath = 'uploads/profile_pictures/user_' + Date.now() + '.jpg'; // Simula um novo path único
        // setMessage({type: 'success', text: "Foto de perfil atualizada com sucesso! (Simulado)"});
        // if (typeof window !== "undefined") {
        //   localStorage.setItem("userPhotoUrl", simulatedFilePath);
        //    // Opcional: Forçar atualização do layout se necessário, ou deixar que o useAuth pegue na próxima vez.
        //    // Poderia disparar um evento para o layout escutar, ou usar um estado global.
        //    // Exemplo simples para forçar useAuth a recarregar da localStorage na próxima navegação:
        //    // router.refresh(); // Se estiver usando Next.js App Router e quiser apenas revalidar dados do servidor
        // }
        // handleRemovePreview(); // Limpar preview após upload
        // FIM DO BLOCO DE SIMULAÇÃO

      } else {
        // Tentar ler o corpo do erro se não for OK, mas for JSON
        let errorMessage = "Falha ao enviar a foto. O servidor respondeu com status " + response.status;
        try {
            const errorResult = await response.json();
            errorMessage = errorResult.message || errorMessage;
        } catch {
            // Não era JSON ou erro ao parsear, mantém a mensagem de status
        }
        setMessage({type: 'error', text: errorMessage});
        // setMessage({type: 'error', text: "Falha ao enviar a foto. Tente novamente. (Simulado)"});
      }
    } catch (error) {
      console.error("Erro ao enviar foto:", error);
      setMessage({type: 'error', text: "Erro de conexão ao tentar enviar a foto."}) 
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8 md:py-12 px-4">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline" style={{ color: TARGET_TEXT_COLOR }}>
        <ArrowLeft size={16} />
        Voltar ao Dashboard
      </Link>
      <div className="shadow-xl border-0 rounded-lg bg-white dark:bg-zinc-800">
        <div className="p-6">
          <h2 className="text-2xl font-bold" style={{ color: TARGET_TEXT_COLOR }}>
            Alterar Foto de Perfil
          </h2>
          <p style={{ color: TARGET_TEXT_COLOR }}>
            Escolha uma nova foto para seu perfil.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                          ${isDragActive ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-zinc-600 hover:border-gray-400 dark:hover:border-zinc-500'}
                        `}
            >
              <input {...getInputProps()} />
              <UploadCloud size={48} className="mx-auto mb-3" style={{ color: isDragActive ? IFC_GREEN : TARGET_TEXT_COLOR }} />
              {isDragActive ? (
                <p style={{ color: IFC_GREEN }}>Solte a imagem aqui!</p>
              ) : (
                <p style={{ color: TARGET_TEXT_COLOR }}>Arraste e solte uma imagem aqui, ou clique para selecionar.</p>
              )}
              <p className="text-xs mt-2" style={{ color: TARGET_TEXT_COLOR, opacity: 0.7}}>
                (JPG, PNG, GIF - Máx 5MB)
              </p>
            </div>

            {previewUrl && selectedFile && (
              <div className="mt-6 text-center space-y-3">
                <label style={{ color: TARGET_TEXT_COLOR }}>Pré-visualização:</label>
                <div className="relative inline-block border rounded-lg overflow-hidden shadow-md w-48 h-48 mx-auto">
                  <Image src={previewUrl} alt={`Preview de ${selectedFile.name}`} layout="fill" objectFit="cover" />
                  <button
                    type="button" 
                    className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 rounded-full h-7 w-7 z-10 inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    onClick={handleRemovePreview}
                  >
                    <XCircle size={20} className="text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="p-6 border-t dark:border-zinc-700 flex flex-col items-start gap-4 md:flex-row md:justify-between md:items-center">
            <button
              type="submit" 
              style={{ backgroundColor: IFC_GREEN, color: TARGET_TEXT_COLOR }}
              className="font-semibold hover:opacity-90 transition-opacity min-w-[120px] inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-r-2 border-current mr-2"></div>Carregando...</>
              ) : (
                'Salvar Foto'
              )}
            </button>
            {message && (
              <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {message.text}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UploadPhotoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><p className="text-lg" style={{ color: "#3D3D3D" }}>Carregando página...</p></div>}>
      <UploadPhotoPageComponent />
    </Suspense>
  );
} 