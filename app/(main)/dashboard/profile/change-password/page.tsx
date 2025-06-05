"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  currentPassword: z.string().min(1, { message: 'A senha atual é obrigatória.' }),
  newPassword: z.string().min(6, { message: 'A nova senha deve ter pelo menos 6 caracteres.' }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'], // Atribui o erro ao campo de confirmação
});

const ChangePasswordPage = () => {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (formData: z.infer<typeof formSchema>) => {
    try {
      const { data } = await api.put('/users/me/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (data.success) {
        toast.success('Senha alterada com sucesso!');
        router.push('/dashboard/profile');
      } else {
        toast.error('Falha ao alterar a senha', { description: data.message });
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
    <div className="flex flex-col items-center justify-start pt-10 min-h-screen bg-gray-100 dark:bg-zinc-950">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <div className="flex items-center mb-4">
            <Link href="/dashboard/profile" className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800">
              <ArrowLeft size={24} />
            </Link>
            <CardTitle>Alterar Senha</CardTitle>
          </div>
          <CardDescription>Escolha uma nova senha para sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha Atual</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Sua senha atual" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
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
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Alterar Senha'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePasswordPage; 