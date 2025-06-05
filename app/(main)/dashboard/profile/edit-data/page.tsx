"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

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
        router.push('/dashboard/profile');
      } else {
        toast.error('Falha ao atualizar', { description: data.message });
      }
    } catch (error: unknown) {
      let message = 'Erro ao conectar ao servidor.';
      if (error instanceof Error) {
          // Se for uma instância de Error, podemos tentar pegar a mensagem da resposta da API
          const apiError = error as any;
          if (apiError.response?.data?.message) {
              message = apiError.response.data.message;
          } else {
              message = error.message;
          }
      }
      toast.error('Erro no servidor', { description: message });
    }
  };

  return (
    <div className="flex flex-col items-center justify-start pt-10 min-h-screen bg-gray-100 dark:bg-zinc-950">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <div className="flex items-center mb-4">
            <Link href="/dashboard/profile" className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800">
              <ArrowLeft size={24} />
            </Link>
            <CardTitle>Editar Dados</CardTitle>
          </div>
          <CardDescription>Atualize suas informações pessoais.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
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
                    <FormLabel>Matrícula (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Sua matrícula" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditDataPage; 