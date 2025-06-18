"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, UploadCloud, XCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image'; // Para preview da imagem
import { useDropzone, FileRejection } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

const TARGET_TEXT_COLOR = "#3D3D3D";

// Componente para o formulário de upload, para poder ser envolvido por Suspense
function UploadPhotoForm() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        setError(null);
        if (fileRejections.length > 0) {
            const firstError = fileRejections[0].errors[0];
            if (firstError.code === 'file-too-large') {
                setError("O arquivo é muito grande. O tamanho máximo é 2MB.");
            } else if (firstError.code === 'file-invalid-type') {
                setError("Tipo de arquivo inválido. Apenas JPG, JPEG, e PNG são permitidos.");
            } else {
                setError(firstError.message);
            }
            return;
        }

        if (acceptedFiles[0]) {
            const selectedFile = acceptedFiles[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/jpeg': [], 'image/png': [] },
        maxSize: 2 * 1024 * 1024, // 2MB
        multiple: false,
    });

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!file) {
            setError("Por favor, selecione um arquivo primeiro.");
            return;
        }
        setIsLoading(true);
        const formData = new FormData();
        formData.append('profileImage', file);

        try {
            const { data: responseData } = await api.post('/users/me/photo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (responseData.success) {
                toast.success(responseData.message || "Foto de perfil atualizada!");
                // Opcional: redirecionar ou atualizar o estado do layout
                router.push('/dashboard'); 
            } else {
                toast.error('Falha no upload', { description: responseData.message });
            }
        } catch (error: unknown) {
            let message = "Erro desconhecido";
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                message = error.response.data.message;
            } else if (error instanceof Error) {
                message = error.message;
            }
            toast.error('Erro no servidor', { description: message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRemovePreview = () => {
        setFile(null);
        if (preview) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
    };

    return (
        <div className="w-full max-w-2xl mx-auto font-sans">
             <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline" style={{ color: TARGET_TEXT_COLOR }}>
                <ArrowLeft size={16} />
                Voltar ao Dashboard
            </Link>
            <Card className="shadow-xl border-0 rounded-lg bg-white dark:bg-zinc-800">
                <CardHeader className="p-6">
                    <CardTitle className="text-2xl font-bold" style={{ color: TARGET_TEXT_COLOR }}>
                        Alterar Foto de Perfil
                    </CardTitle>
                    <CardDescription className="text-md" style={{ color: TARGET_TEXT_COLOR }}>
                        Escolha uma nova imagem para o seu perfil. A imagem deve ser JPG ou PNG e ter no máximo 2MB.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div 
                            {...getRootProps()} 
                            className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ease-in-out
                                ${isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400 bg-gray-50/50'}
                                dark:border-zinc-600 dark:hover:border-green-500 dark:bg-zinc-700/50 dark:hover:bg-zinc-700`}
                        >
                            <Input {...getInputProps()} />
                            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                <UploadCloud size={48} className="mb-4 opacity-70" />
                                {isDragActive ? (
                                    <p className="font-semibold text-lg" style={{ color: TARGET_TEXT_COLOR }}>Solte a imagem aqui...</p>
                                ) : (
                                    <div>
                                        <p className="font-semibold text-lg" style={{ color: TARGET_TEXT_COLOR }}>
                                            Arraste e solte uma imagem aqui
                                        </p>
                                        <p className="text-sm mt-1">ou <span className="text-green-600 font-medium">clique para selecionar</span></p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {preview && (
                             <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-zinc-700/50 relative">
                                <p className="font-semibold text-sm mb-2" style={{ color: TARGET_TEXT_COLOR }}>Preview da Imagem:</p>
                                <div className="relative w-32 h-32 rounded-full overflow-hidden mx-auto shadow-md">
                                    <Image src={preview} alt="Pré-visualização" layout="fill" objectFit="cover" />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleRemovePreview}
                                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-gray-800/50 hover:bg-gray-800/70 text-white"
                                    aria-label="Remover imagem"
                                >
                                    <XCircle size={20} />
                                </Button>
                            </div>
                        )}

                        {error && <p className="text-red-600 dark:text-red-500 text-sm font-medium">{error}</p>}
                        
                        <div className="flex justify-end gap-4 pt-4">
                             <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                className="border-gray-300 dark:border-zinc-600"
                                style={{ color: TARGET_TEXT_COLOR }}
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={!file || isLoading} 
                                style={{ backgroundColor: '#98EE6F', color: TARGET_TEXT_COLOR }}
                                className="font-bold"
                            >
                                {isLoading ? 'Enviando...' : 'Salvar Nova Foto'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

// O componente de página real que envolve o formulário com Suspense
export default function UploadPhotoPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <UploadPhotoForm />
        </Suspense>
    );
} 