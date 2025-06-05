"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

const TARGET_TEXT_COLOR = "#3D3D3D";
const IFC_GREEN = "#98EE6F";
const PHP_API_BASE_URL = "https://achados-perdidos.infinityfreeapp.com/php_api/endpoints";

function EditDataPageComponent() {
  const router = useRouter();
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [matricula, setMatricula] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsFetchingData(true);
      setMessage(null);
      try {
        const response = await fetch(`${PHP_API_BASE_URL}/user/get-user-data.php`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const result = await response.json();
        if (response.ok && result.success && result.data) {
          setNomeCompleto(result.data.name || "");
          setEmail(result.data.email || "");
          setMatricula(result.data.matricula || "");
        } else {
          setMessage({type: 'error', text: result.message || "Falha ao carregar dados do usuário."});
        }
      } catch (error: unknown) {
        console.error("Erro ao buscar dados do usuário:", error);
        let msg = "Erro de conexão ao buscar dados.";
        if (error instanceof Error) {
          msg = error.message;
        }
        setMessage({type: 'error', text: msg});
      } finally {
        setIsFetchingData(false);
      }
    };
    fetchUserData();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Validação da Matrícula
    if (!matricula.trim()) {
      setMessage({type: 'error', text: 'O campo Matrícula é obrigatório.'});
      setIsLoading(false);
      return;
    }

    const formData = {
      nome: nomeCompleto,
      email: email,
      matricula: matricula,
    };

    try {
      const response = await fetch(`${PHP_API_BASE_URL}/profile/update-data.php`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        router.push("/dashboard");
        
        if (typeof window !== "undefined") {
          localStorage.setItem("userName", result.updatedData?.nome || nomeCompleto);
          localStorage.setItem("userMatricula", result.updatedData?.matricula || matricula);
          window.dispatchEvent(new CustomEvent('userDataChanged'));
        }
        
        

      } else {
        setMessage({type: 'error', text: result.message || "Falha ao atualizar os dados."});
      }
    } catch (error: unknown) {
      console.error("Erro ao atualizar dados:", error);
      let msg = "Erro de conexão.";
      if (error instanceof Error) {
        msg = error.message;
      }
      setMessage({type: 'error', text: msg});
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingData) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-lg font-semibold" style={{ color: TARGET_TEXT_COLOR }}>Carregando seus dados...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-8 md:py-12 px-4">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline" style={{ color: TARGET_TEXT_COLOR }}>
        <ArrowLeft size={16} />
        Voltar ao Dashboard
      </Link>
      <Card className="shadow-xl border-0 rounded-lg bg-white dark:bg-zinc-800">
        <CardHeader className="p-6">
          <CardTitle className="text-2xl font-bold" style={{ color: TARGET_TEXT_COLOR }}>
            Alterar Dados Pessoais
          </CardTitle>
          <CardDescription style={{ color: TARGET_TEXT_COLOR }}>
            Atualize suas informações pessoais abaixo.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nomeCompleto" style={{ color: TARGET_TEXT_COLOR }}>Nome Completo</Label>
              <Input 
                id="nomeCompleto" 
                value={nomeCompleto} 
                onChange={(e) => setNomeCompleto(e.target.value)} 
                placeholder="Seu nome completo"
                className="bg-white dark:bg-zinc-700/80 border-gray-300 dark:border-zinc-600 focus:border-green-500 focus:ring-green-500 text-[#3D3D3D]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: TARGET_TEXT_COLOR }}>E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="seu@email.com"
                className="bg-white dark:bg-zinc-700/80 border-gray-300 dark:border-zinc-600 focus:border-green-500 focus:ring-green-500 text-[#3D3D3D]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="matricula" style={{ color: TARGET_TEXT_COLOR }}>Matrícula</Label>
              <Input
                id="matricula"
                type="text"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="Sua matrícula ou identificador"
                className="bg-white dark:bg-zinc-700/80 border-gray-300 dark:border-zinc-600 focus:border-green-500 focus:ring-green-500 text-[#3D3D3D]"
              />
            </div>
          </CardContent>
          <CardFooter className="p-6 border-t dark:border-zinc-700 flex flex-col items-start gap-4 md:flex-row md:justify-between md:items-center">
            <Button 
              type="submit" 
              style={{ backgroundColor: IFC_GREEN, color: TARGET_TEXT_COLOR }}
              className="w-full md:w-auto font-semibold hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              {isLoading ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-r-2 border-current mr-2"></div>Atualizando...</>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
            {message && (
              <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {message.text}
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function EditDataPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><p className="text-lg" style={{ color: "#3D3D3D" }}>Carregando...</p></div>}>
      <EditDataPageComponent />
    </Suspense>
  );
} 