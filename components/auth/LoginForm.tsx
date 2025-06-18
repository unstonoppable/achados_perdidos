"use client"

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

// Cores IFC
const IFC_GREEN = "#98EE6F";
const IFC_GRAY = "#676767";
const TEXT_DARK = "#3D3D3D";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { data } = await api.post('/auth/login', values);

      if (data.success) {
        toast.success('Login realizado com sucesso!');
        router.push('/dashboard');
        router.refresh(); // Força a atualização dos dados do layout
      } else {
        toast.error('Falha no login', {
          description: data.message || 'Email ou senha incorretos.',
        });
      }
    } catch (error: unknown) {
      let message = 'Erro de conexão com o servidor.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error('Erro no servidor', { description: message });
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Card do Formulário */}
      <Card className="w-full border-0 rounded-2xl shadow-lg bg-white/90 dark:bg-zinc-800/90">
        <CardContent className="p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          placeholder="seu@email.com" 
                          {...field} 
                          className="pl-10 h-12 rounded-xl border-gray-200 dark:border-zinc-600 focus:border-green-500 dark:focus:border-green-400 transition-colors"
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
                          className="pl-10 pr-12 h-12 rounded-xl border-gray-200 dark:border-zinc-600 focus:border-green-500 dark:focus:border-green-400 transition-colors"
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
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300 hover:brightness-95" 
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
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="ml-2 h-4 w-4" style={{ color: IFC_GRAY }} />
                  </>
                )}
              </Button>
            </form>
          </Form>
          
          {/* Link para cadastro */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-zinc-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Não tem uma conta?{" "}
              <Link 
                href="/register" 
                className="font-semibold hover:underline transition-colors"
                style={{ color: IFC_GREEN }}
              >
                Cadastre-se
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 