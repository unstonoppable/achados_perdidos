"use client"

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, User, Mail, Hash, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Cores IFC
const IFC_GREEN = "#98EE6F";
const IFC_GRAY = "#676767";
const TEXT_DARK = "#3D3D3D";

const formSchema = z.object({
  nome: z.string().min(3, { message: "O nome completo é obrigatório." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  matricula: z.string().min(1, { message: "A matrícula é obrigatória." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

// Componente principal da página de registro
export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      matricula: '',
      password: '',
      confirmPassword: '',
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { data } = await api.post('/auth/register', {
        nome: values.nome,
        email: values.email,
        matricula: values.matricula,
        senha: values.password,
        confirmar_senha: values.confirmPassword
      });

      if (data.success) {
        toast.success('Cadastro realizado com sucesso!', {
          description: 'Você será redirecionado para a página de login.',
        });
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        toast.error('Falha no cadastro', {
          description: data.message || 'Não foi possível criar sua conta.',
        });
      }
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'response' in error
        ? (error.response as { data?: { message?: string } })?.data?.message || "Erro de conexão com o servidor."
        : "Erro de conexão com o servidor.";
      toast.error('Erro no servidor', { description: message });
    }
  };

  return (
    <main className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* Imagem lateral - visível apenas em desktop */}
      <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:min-h-screen bg-muted p-4">
        <Image
          src="/register.png"
          alt="Imagem de cadastro"
          width={625}
          height={446}
          className="object-contain mb-6 max-w-full h-auto"
          sizes="(max-width: 1024px) 0vw, 50vw"
          priority
        />
        <h2 
          className="text-center font-bold text-4xl leading-none tracking-tight"
          style={{
            fontFamily: '"IBM Plex Sans", "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 700,
            fontSize: '40px',
            lineHeight: '100%',
            letterSpacing: '0%',
            textAlign: 'center',
            color: TEXT_DARK
          }}
        >
          Caso não possua uma conta<br />Cadastre-se
        </h2>
      </div>
      
      {/* Formulário */}
      <div className="flex items-center justify-center p-4 bg-gradient-to-br  via-white dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
        <div className="w-full max-w-md">
          {/* Logo/Header - visível apenas em mobile */}
          <div className="text-center mb-8 lg:hidden">
            <Image
              src="/logo.png"
              alt="Logo Achados e Perdidos IFC"
              width={180}
              height={180}
              className="mx-auto mb-6 rounded-2xl"
              priority
            />
          </div>

          {/* Card do Formulário */}
          <Card className="w-full rounded-2xl bg-white/90 dark:bg-zinc-800/90">
            <CardContent className="p-6 sm:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField 
                    control={form.control} 
                    name="nome" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold" style={{ color: TEXT_DARK }}>Nome Completo</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input 
                              placeholder="Seu Nome Completo" 
                              {...field} 
                              className="pl-10 h-11 rounded-xl border-gray-200 dark:border-zinc-600 focus:border-green-500 dark:focus:border-green-400 transition-colors"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                  
                  <FormField 
                    control={form.control} 
                    name="email" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold" style={{ color: TEXT_DARK }}>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input 
                              type="email" 
                              placeholder="seu@email.com" 
                              {...field} 
                              className="pl-10 h-11 rounded-xl border-gray-200 dark:border-zinc-600 focus:border-green-500 dark:focus:border-green-400 transition-colors"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                  
                  <FormField 
                    control={form.control} 
                    name="matricula" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold" style={{ color: TEXT_DARK }}>Matrícula</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input 
                              placeholder="Sua Matrícula" 
                              {...field} 
                              className="pl-10 h-11 rounded-xl border-gray-200 dark:border-zinc-600 focus:border-green-500 dark:focus:border-green-400 transition-colors"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                  
                  <FormField 
                    control={form.control} 
                    name="password" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold" style={{ color: TEXT_DARK }}>Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input 
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••" 
                              {...field} 
                              className="pl-10 pr-12 h-11 rounded-xl border-gray-200 dark:border-zinc-600 focus:border-green-500 dark:focus:border-green-400 transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              {showPassword ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                  
                  <FormField 
                    control={form.control} 
                    name="confirmPassword" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold" style={{ color: TEXT_DARK }}>Confirmar Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input 
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="••••••••" 
                              {...field} 
                              className="pl-10 pr-12 h-11 rounded-xl border-gray-200 dark:border-zinc-600 focus:border-green-500 dark:focus:border-green-400 transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              {showConfirmPassword ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} 
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11 rounded-xl font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300 hover:brightness-95" 
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: IFC_GREEN,
                      color: IFC_GRAY,
                      border: 'none',
                      boxShadow: '0 4px 12px 0 rgba(152, 238, 111, 0.3)',
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" style={{ color: IFC_GRAY }} />
                        Criando conta...
                      </>
                    ) : (
                      <>
                        Criar Conta
                        <ArrowRight className="ml-2 h-4 w-4" style={{ color: IFC_GRAY }} />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
              
              {/* Link para login */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-zinc-700 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Já tem uma conta?{" "}
                  <Link 
                    href="/login" 
                    className="font-semibold hover:underline transition-colors"
                    style={{ color: IFC_GREEN }}
                  >
                    Faça login
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer - visível apenas em mobile */}
          <div className="text-center mt-6 lg:hidden">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © 2024 Sistema de Achados e Perdidos - IFC
            </p>
          </div>
        </div>
      </div>
    </main>
  );
} 