"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Loader2, User, Mail, Hash, Save } from 'lucide-react';
import Link from 'next/link';

// Cores IFC
const IFC_GREEN = "#98EE6F";
const IFC_GRAY = "#676767";
const TARGET_TEXT_COLOR = "#3D3D3D";

const formSchema = z.object({
  nome: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  matricula: z.string().optional(),
});

const EditDataPage = () => {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      matricula: '',
    },
  });

  const { setValue, formState: { isSubmitting } } = form;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (data.success && data.user) {
          setValue('nome', data.user.name);
          setValue('email', data.user.email);
          setValue('matricula', data.user.matricula || '');
        }
      } catch {
        toast.error('Erro ao buscar dados', { description: 'Não foi possível carregar suas informações.' });
      }
    };
    fetchUserData();
  }, [setValue]);

  const onSubmit = async (formData: z.infer<typeof formSchema>) => {
    try {
      const { data } = await api.put('/users/me', formData);

      if (data.success) {
        toast.success('Dados atualizados com sucesso!');
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event('userDataChanged'));
        }
        router.push('/dashboard');
      } else {
        toast.error('Falha ao atualizar', { description: data.message });
      }
    } catch (error: unknown) {
      let message = 'Erro ao conectar ao servidor.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error('Erro no servidor', { description: message });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft size={20} style={{ color: IFC_GRAY }} />
          </Link>
          
        </div>
      </div>

      <Card className="w-full max-w-md mx-auto border-0 shadow-lg bg-white dark:bg-zinc-800">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: IFC_GREEN }}>
              <User size={32} style={{ color: TARGET_TEXT_COLOR }} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold" style={{ color: TARGET_TEXT_COLOR }}>Informações Pessoais</CardTitle>
          
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold" style={{ color: TARGET_TEXT_COLOR }}>
                      Nome Completo
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="Digite seu nome completo"
                          className="pl-10 h-12 border-gray-300 dark:border-zinc-600 focus:border-green-500 dark:focus:border-green-400"
                          {...field} 
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                    <FormLabel className="text-sm font-semibold" style={{ color: TARGET_TEXT_COLOR }}>
                      Email
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10 h-12 border-gray-300 dark:border-zinc-600 focus:border-green-500 dark:focus:border-green-400"
                          {...field} 
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                    <FormLabel className="text-sm font-semibold" style={{ color: TARGET_TEXT_COLOR }}>
                      Matrícula
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="Digite sua matrícula"
                          className="pl-10 h-12 border-gray-300 dark:border-zinc-600 focus:border-green-500 dark:focus:border-green-400"
                          {...field} 
                        />
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300"
                disabled={isSubmitting}
                style={{
                  backgroundColor: IFC_GREEN,
                  color: TARGET_TEXT_COLOR,
                  border: 'none',
                  boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditDataPage; 