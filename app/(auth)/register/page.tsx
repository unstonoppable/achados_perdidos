"use client"

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      <div className="hidden bg-muted lg:block">
        <Image
          src="/img1.svg"
          alt="Imagem de fundo"
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
      <div className="flex items-center justify-center py-12">
        <Card className="mx-auto w-[350px] sm:w-[400px]">
          <CardHeader>
            <CardTitle className="text-3xl">Cadastro</CardTitle>
            <CardDescription>Crie sua conta para encontrar e cadastrar itens.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="nome" render={({ field }) => (<FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Seu Nome Completo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="seu@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="matricula" render={({ field }) => (<FormItem><FormLabel>Matrícula</FormLabel><FormControl><Input placeholder="Sua Matrícula" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Senha</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (<FormItem><FormLabel>Confirmar Senha</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Criar Conta'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter>
             <div className="mt-4 text-center text-sm">
                Já tem uma conta?{" "}
                <Link href="/login" className="underline">
                  Faça login
                </Link>
              </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 