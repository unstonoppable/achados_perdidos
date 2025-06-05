"use client"

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
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

export function LoginForm() {
  const router = useRouter();
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
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Acessar Plataforma</CardTitle>
        <CardDescription>Use seu email e senha para entrar.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Entrar'}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Não tem uma conta?{" "}
          <Link href="/register" className="underline">
            Cadastre-se
          </Link>
        </div>
      </CardContent>
    </Card>
  );
} 