"use client";

export const dynamic = 'force-dynamic'; // Força a renderização dinâmica

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

const TARGET_TEXT_COLOR = "#3D3D3D";
const IFC_GREEN = "#98EE6F";
const PHP_API_BASE_URL = "https://achados-perdidos.infinityfreeapp.com/php_api/endpoints";

// Componente interno para o formulário e lógica
function ChangePasswordFormComponent() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmNewPassword) {
      setMessage({type: 'error', text: "As senhas nova e de confirmação não coincidem."}) 
      return;
    }
    if (!currentPassword || !newPassword) {
      setMessage({type: 'error', text: "Todos os campos de senha são obrigatórios."}) 
      return;
    }

    setIsLoading(true);
    // console.log("Enviando alteração de senha para o backend:", { currentPassword, newPassword });

    try {
      const response = await fetch(`${PHP_API_BASE_URL}/profile/change-password.php`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({type: 'success', text: result.message || "Senha alterada com sucesso!"});
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        router.push('/dashboard');
      } else {
        setMessage({type: 'error', text: result.message || "Falha ao alterar a senha. Status: " + response.status});
      }
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
      setMessage({type: 'error', text: "Erro de conexão ao tentar alterar a senha."}) 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8 md:py-12 px-4">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm mb-6 hover:underline" style={{ color: TARGET_TEXT_COLOR }}>
        <ArrowLeft size={16} />
        Voltar ao Dashboard
      </Link>
      <Card className="shadow-xl border-0 rounded-lg bg-white dark:bg-zinc-800">
        <CardHeader className="p-6">
          <CardTitle className="text-2xl font-bold" style={{ color: TARGET_TEXT_COLOR }}>
            Alterar Senha
          </CardTitle>
          <CardDescription style={{ color: TARGET_TEXT_COLOR }}>
            Escolha uma senha forte e não a revele para ninguém.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" style={{ color: TARGET_TEXT_COLOR }}>Senha Atual</Label>
              <div className="relative">
                <Input 
                  id="currentPassword" 
                  type={showCurrentPassword ? "text" : "password"} 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  placeholder="Sua senha atual"
                  className="bg-white dark:bg-zinc-700/80 border-gray-300 dark:border-zinc-600 focus:border-green-500 focus:ring-green-500 text-[#3D3D3D] pr-10"
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                  {showCurrentPassword ? <EyeOff size={18} style={{ color: TARGET_TEXT_COLOR }} /> : <Eye size={18} style={{ color: TARGET_TEXT_COLOR }} />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" style={{ color: TARGET_TEXT_COLOR }}>Nova Senha</Label>
              <div className="relative">
                <Input 
                  id="newPassword" 
                  type={showNewPassword ? "text" : "password"} 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Sua nova senha"
                  className="bg-white dark:bg-zinc-700/80 border-gray-300 dark:border-zinc-600 focus:border-green-500 focus:ring-green-500 text-[#3D3D3D] pr-10"
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <EyeOff size={18} style={{ color: TARGET_TEXT_COLOR }} /> : <Eye size={18} style={{ color: TARGET_TEXT_COLOR }} />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword" style={{ color: TARGET_TEXT_COLOR }}>Confirmar Nova Senha</Label>
              <div className="relative">
                <Input 
                  id="confirmNewPassword" 
                  type={showConfirmNewPassword ? "text" : "password"} 
                  value={confirmNewPassword} 
                  onChange={(e) => setConfirmNewPassword(e.target.value)} 
                  placeholder="Confirme sua nova senha"
                  className="bg-white dark:bg-zinc-700/80 border-gray-300 dark:border-zinc-600 focus:border-green-500 focus:ring-green-500 text-[#3D3D3D] pr-10"
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                  {showConfirmNewPassword ? <EyeOff size={18} style={{ color: TARGET_TEXT_COLOR }} /> : <Eye size={18} style={{ color: TARGET_TEXT_COLOR }} />}
                </Button>
              </div>
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
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-r-2 border-current mr-2"></div>Alterando...</>
              ) : (
                'Alterar Senha'
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

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ChangePasswordFormComponent />
    </Suspense>
  );
} 